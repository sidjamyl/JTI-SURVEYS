import { test, expect } from '@playwright/test';
import { activeSections, skus, type Answers, type Mode } from '../lib/questionnaire';
const mode=process.env.SURVEY_TEST_MODE as Mode|undefined;
const base=process.env.SURVEY_TEST_URL || 'http://localhost:3002';
test.skip(!mode,'Only for dedicated branches');
test('dedicated branch opens directly and sends the completed JSON to WinDev',async({page})=>{
 const answers:Answers=mode==='consumer'?{Q1:skus[0].id,Q2:'pack',Q5:'later'}:{R3:Object.fromEntries(skus.map(s=>[s.id,'full'])),R9:'never'};
 for(const q of activeSections(mode!,answers).flatMap(s=>s.questions))if(answers[q.id]===undefined&&q.options)answers[q.id]=q.type==='multi'?[q.options[0].id]:q.options[0].id;
 await page.addInitScript(({mode,answers})=>{
  localStorage.setItem('jti-pulse-drafts-v1',JSON.stringify({consumer:{},retailer:{},[mode]:answers}));
  const w=window as typeof window & {nativeCalls:[string,string][]};w.nativeCalls=[];w.WL={Execute:(name,json)=>w.nativeCalls.push([name,json])};
 },{mode:mode!,answers});
 await page.goto(base);await expect(page.locator('fieldset').first()).toBeVisible();await expect(page.locator('.mode-cards')).toHaveCount(0);await expect(page.locator('.start-section')).toHaveCount(0);
 await expect(page.locator('fieldset').first()).toHaveAttribute('id',mode==='consumer'?'question-Q1':'question-R2');
 if(mode==='consumer'){
  await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('.field-error[role=alert]')).toContainText('Confirmez');await page.locator('.eligibility input').check();
 }
 while(await page.getByRole('button',{name:'Continuer',exact:true}).count())await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await page.getByRole('button',{name:'Enregistrer l’entretien',exact:true}).click();await expect(page.getByRole('heading',{name:'Entretien enregistré.'})).toBeVisible();
 const result=await page.evaluate(()=>({calls:(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls,json:window.reponse?.()}));expect(result.calls).toHaveLength(1);expect(result.calls[0][0]).toBe('Reponse');expect(result.json).toBe(result.calls[0][1]);const payload=JSON.parse(result.json!);expect(payload.mode).toBe(mode);expect(payload.answers[mode==='consumer'?'Q1':'R2'].answer).toBeTruthy();
 await page.locator('.main-nav').getByRole('button',{name:'Nouvel entretien',exact:true}).click();await expect(page.locator('fieldset').first()).toBeVisible();expect(await page.evaluate(()=>window.reponse?.())).toBeNull();
 await page.getByRole('tab',{name:'العربية'}).click();await page.setViewportSize({width:390,height:844});await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
