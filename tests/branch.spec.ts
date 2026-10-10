import { test, expect } from '@playwright/test';
import type { Mode } from '../lib/questionnaire';
import { fillToReview } from './fill-survey';
const mode=process.env.SURVEY_TEST_MODE as Mode|undefined;
const base=process.env.SURVEY_TEST_URL || 'http://localhost:3002';
test.skip(!mode,'Only for dedicated branches');
test('compact fresh survey sends JSON once and stops at review',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('jti-pulse-drafts-v1',JSON.stringify({consumer:{Q1:'mbo-red',Q2:'pack'},retailer:{R2:'grocery'}}));
  const w=window as typeof window & {nativeCalls:[string,string][]};w.nativeCalls=[];w.WL={Execute:(name,json)=>w.nativeCalls.push([name,json])};
 });
 await page.goto(base);await expect(page.locator('fieldset').first()).toBeVisible();
 await expect(page.locator('fieldset').first()).toHaveAttribute('id',mode==='consumer'?'question-Q1':'question-R2');
 await expect(page.locator('.main-nav,.draft-export,.page-footer,.brand-name,.success-panel,.mode-cards')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Retour',exact:true})).toHaveCount(0);
 await expect(page.locator('fieldset input:checked')).toHaveCount(0);
 const header=await page.locator('.sticky-header').boundingBox();expect(header!.height).toBeLessThanOrEqual(80);
 await expect(page.locator('.sticky-header .language-tabs')).toHaveCount(0);
 if(mode==='consumer'){
  await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('.field-error[role=alert]')).toContainText('Confirmez');
 }
 await fillToReview(page,mode!);
 const first=page.locator('.review-row').first();await expect(first.locator('.review-code')).toHaveCSS('font-size','16px');await expect(first.locator('.review-code')).toHaveCSS('background-color','rgb(0, 171, 96)');
 const question=await first.locator('p').boundingBox();const answer=await first.locator(':scope > div').nth(1).boundingBox();expect(Math.abs(question!.y+question!.height/2-answer!.y-answer!.height/2)).toBeLessThan(1);
 await page.getByRole('button',{name:'Valider les réponses',exact:true}).click();
 await expect(page.getByRole('button',{name:'Validé',exact:true})).toBeDisabled();await expect(page.locator('.review-row').first()).toBeVisible();await expect(page.locator('.success-panel')).toHaveCount(0);
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
 const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);expect(calls).toHaveLength(1);expect(calls[0][0]).toBe('Reponse');const payload=JSON.parse(calls[0][1]);expect(payload.mode).toBe(mode);expect(payload.answers[mode==='consumer'?'Q1':'R2'].language).toBe('fr');
 expect(await page.evaluate(()=>localStorage.getItem('jti-pulse-records-v1'))).toBeNull();
 await page.reload();await expect(page.locator('fieldset').first()).toBeVisible();await expect(page.locator('fieldset input:checked')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:'العربية'}).click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('failed bridge retries the same JSON without losing answers or showing a final screen',async({page})=>{
 await page.addInitScript(()=>{const w=window as typeof window & {nativeCalls:[string,string][]};w.nativeCalls=[];w.WL={Execute:(name,json)=>{w.nativeCalls.push([name,json]);if(w.nativeCalls.length===1)throw new Error('Temporary bridge error');}};});
 await page.goto(base);await fillToReview(page,mode!);
 await page.getByRole('button',{name:'Valider les réponses',exact:true}).click();await expect(page.locator('.field-error[role=alert]')).toContainText('Échec');
 await page.getByRole('button',{name:'Réessayer l’envoi',exact:true}).click();await expect(page.getByRole('button',{name:'Validé',exact:true})).toBeDisabled();
 const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);expect(calls).toHaveLength(2);expect(calls[0]).toEqual(calls[1]);await expect(page.locator('.success-panel')).toHaveCount(0);
});

test('reload and browser history restoration reset entered answers',async({page})=>{
 await page.goto(base);
 await page.locator('fieldset').first().locator('label').filter({has:page.locator('input[type=radio]')}).first().click();
 await expect(page.locator('fieldset input:checked')).toHaveCount(1);
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 await expect(page.locator('fieldset input:checked')).toHaveCount(0);
 await page.locator('fieldset').first().locator('label').filter({has:page.locator('input[type=radio]')}).first().click();
 await page.reload();await expect(page.locator('fieldset input:checked')).toHaveCount(0);
});
