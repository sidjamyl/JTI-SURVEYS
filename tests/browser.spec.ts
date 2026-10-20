import { test, expect } from '@playwright/test';
import { beginSurvey, fillLocation, fillToReview } from './fill-survey';
test.skip(!!process.env.SURVEY_TEST_MODE,'Dedicated branch uses branch.spec.ts');
const base=process.env.SURVEY_TEST_URL || 'http://localhost:3002';
test.beforeEach(async({page})=>{await page.addInitScript(()=>{const w=window as typeof window & {nativeCalls:[string,string][]};w.nativeCalls=[];w.WL={Execute:(name,json)=>w.nativeCalls.push([name,json])};});});
test('consumer branch, switching, three-choice cap, per-question language and direct WinDev delivery',async({page})=>{
 await page.addInitScript(()=>{const w=window as typeof window & {nativeCalls:[string,string][]};w.nativeCalls=[];w.WL={Execute:(name,json)=>w.nativeCalls.push([name,json])};});
 await page.goto(base);await beginSurvey(page,'consumer');
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('.field-error')).toHaveCount(2);
 await page.locator('#question-Q1').getByText('MBO Red',{exact:true}).click();await page.getByRole('tab',{name:'EN',exact:true}).click();await page.locator('#question-Q2 .answer-option').last().click();await page.getByRole('tab',{name:'FR',exact:true}).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-Q2b')).toBeVisible();await page.locator('#question-Q2b .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q3 .answer-option').last().click();await page.locator('#question-Q4 .answer-option').nth(1).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q5 .answer-option').nth(2).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q6b').getByText('Gauloises Blondes Blue',{exact:true}).click();await page.locator('#question-Q7 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-Q7a')).toHaveCount(0);await page.locator('#question-Q7b input').fill('2');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(let i=0;i<3;i++)await page.locator('#question-Q8 .answer-option').nth(i).click();await expect(page.locator('#question-Q8 input:disabled')).toHaveCount(7);
 await page.locator('#question-Q9 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q10 .answer-option').first().click();await page.locator('#question-Q11 label').nth(3).click();await page.locator('#question-Q12 .answer-option').first().click();
 await page.getByRole('tab',{name:'العربية'}).click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');await page.getByRole('tab',{name:'FR',exact:true}).click();
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await expect(page.locator('.field-error')).toHaveCount(3);await expect(page.locator('#question-Q15 input')).toHaveValue('');await page.locator('#question-Q13 .answer-option').filter({has:page.locator('input[value=female]')}).click();await page.locator('#question-Q14 .answer-option').filter({has:page.locator('input[value="1"]')}).click();await page.locator('#question-Q15 input').fill('0555123456');
 await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();
 await page.getByRole('button',{name:'Valider les réponses',exact:true}).click();await expect(page.getByRole('button',{name:'Validé',exact:true})).toBeDisabled();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
 const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);expect(calls).toHaveLength(1);expect(calls[0][0]).toBe('Reponse');expect(JSON.parse(calls[0][1]).answers.Q2).toBe('Both pack and stick');
 const payload=JSON.parse(calls[0][1]);expect(payload.photo).toBeUndefined();await expect(page.locator('.consumer-photo,input[type=file],video')).toHaveCount(0);expect(payload.answers.Q8).toHaveLength(3);expect(payload.answers.Q7b).toBe('2');expect(payload.answers.Q7a).toBeUndefined();expect(payload.answers.Q13).toBe('Female');expect(payload.answers.Q14).toBe('25-34');expect(payload.answers.Q1).toBe('MBO Red');expect(payload.answers.Q2).toBe('Both pack and stick');await expect(page.locator('.success-panel')).toHaveCount(0);
});
test('retailer eighteen-SKU stock grid and capped substitution route',async({page})=>{
 await page.goto(base);await beginSurvey(page,'retailer');
 await expect(page.locator('#question-R1')).toHaveCount(0);await page.locator('#question-R2 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-R3 select')).toHaveCount(18);
 for(const [language,label] of [['FR','Disponible uniquement en paquet'],['EN','Available only by pack'],['العربية','متوفر غير بالباكي.']] as const){await page.getByRole('tab',{name:language,exact:true}).click();await expect(page.locator('#question-R3 select').first().locator('option[value=pack]')).toHaveText(label);}
 await page.getByRole('tab',{name:'FR',exact:true}).click();for(let i=0;i<18;i++)await page.locator('#question-R3 select').nth(i).selectOption(i===0?'pack':i<10?'out':'full');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const id of ['R4','R5','R6'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-R7 .answer-option').last().click();await expect(page.locator('.substitution-row')).toHaveCount(8);await expect(page.locator('.substitution-row').first().locator('select').first().locator('option')).toHaveCount(21);for(let i=0;i<8;i++)await page.locator('.substitution-row').nth(i).locator('select').first().selectOption('none');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-R9 .answer-option').nth(2).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#question-R10')).toHaveCount(0);
 for(const id of ['R16','R17'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.locator('#question-R18 .answer-option').first().click();await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await page.getByRole('button',{name:'Valider les réponses',exact:true}).click();
 await expect(page.getByRole('button',{name:'Validé',exact:true})).toBeDisabled();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);const saved=JSON.parse(calls[0][1]);expect(saved.answers.R3['MBO Red']).toBe('Available only by pack');expect(saved.answers.R8['MBO Red']).toBeUndefined();expect(Object.keys(saved.answers.R8)).toHaveLength(8);expect(saved.answers.R10).toBeUndefined();
});

test('mobile stepper stays visible, adapts to branches and supports RTL',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(base);await beginSurvey(page,'consumer');
 const steps=page.locator('.survey-stepper li');const initial=await steps.count();
 await expect(page.locator('.survey-stepper [aria-current=step]')).toHaveCount(1);
 await expect(page.locator('.survey-stepper button').nth(2)).toBeDisabled();
 await page.locator('#question-Q1').getByText('MBO Red',{exact:true}).click();await page.locator('#question-Q2 .answer-option').filter({hasText:"Paquet et cigarette à l'unité"}).click();
 await expect(steps).toHaveCount(initial+1);await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('.survey-stepper [aria-current=step]')).toHaveAttribute('aria-label',/3\./);
 await page.locator('.survey-stepper button').nth(1).click();await expect(page.locator('#question-Q1')).toBeVisible();
 await page.evaluate(()=>scrollTo(0,700));
 const header=await page.locator('.sticky-header').boundingBox();expect(header?.y).toBe(0);
 await page.getByRole('tab',{name:'العربية'}).click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow',/^[1-9]\d?$/);
});

test('supplied logo and eighteen photos load in all three languages',async({page})=>{
 await page.goto(base);await expect(page.locator('.brand-logo img')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>[...document.fonts].some(font=>font.family==='Manrope'&&font.status==='loaded'))).toBe(true);
 expect(await page.locator('.brand-logo img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await beginSurvey(page,'consumer');
 await expect(page.locator('#question-Q1 .question-meta bdi')).toHaveCSS('background-color','rgb(0, 171, 96)');await expect(page.locator('#question-Q1 .product-brand').first()).toHaveCSS('font-size','16px');await expect(page.locator('.question-meta')).toHaveText(['Q1','Q2']);
 const images=page.locator('#question-Q1 .product-visual img');await expect(images).toHaveCount(18);
 for(const img of await images.all()){
  await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
 }
 for(const language of ['EN','العربية','FR']){
  await page.getByRole('tab',{name:language,exact:true}).click();await expect(images).toHaveCount(18);
  if(language==='العربية')await expect.poll(()=>page.evaluate(()=>[...document.fonts].some(font=>font.family==='Noto Sans Arabic'&&font.status==='loaded'))).toBe(true);
 }
});

test('retailer recommendation branch and no flagged products',async({page})=>{
 await page.goto(base);await beginSurvey(page,'retailer');

 await page.locator('#question-R2 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const select of await page.locator('#question-R3 select').all())await select.selectOption('full');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const id of ['R4','R5','R6'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-R8')).toHaveCount(0);await page.locator('#question-R7 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-R9 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#question-R10')).toBeVisible();
 await page.locator('#question-R10 .answer-option').last().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#R10-error')).toBeVisible();
 await page.locator('#question-R10 .other-field input').fill('Critère local');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const id of ['R16','R17'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.locator('#question-R18 .answer-option').first().click();
 await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await page.getByRole('button',{name:'Valider les réponses',exact:true}).click();
 const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);const answers=JSON.parse(calls[0][1]).answers;expect(answers.R8).toBeUndefined();expect(answers.R10).toContain('Critère local');
});


test('invitation records refusals once, retries the same JSON, and never opens the questions',async({page})=>{
 await page.addInitScript(()=>{const w=window as typeof window & {nativeCalls:[string,string][]};w.nativeCalls=[];w.WL={Execute:(name,json)=>{w.nativeCalls.push([name,json]);if(w.nativeCalls.length===1)throw new Error('Temporary failure');}};});
 await page.goto(base);await expect(page.locator('.mode-card')).toHaveCount(2);
 await page.locator('.mode-card').filter({hasText:'Détaillant'}).click();
 await page.getByRole('tab',{name:'EN',exact:true}).click();await expect(page.locator('.intro-text')).toContainText('product availability');
 await page.getByRole('button',{name:'No',exact:true}).click();await expect(page.locator('fieldset')).toHaveCount(0);
 await page.getByRole('button',{name:'Retry sending',exact:true}).click();
 await expect(page.locator('.declined-panel')).toContainText('Your response has been noted');
 const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);
 expect(calls).toHaveLength(2);expect(calls[0]).toEqual(calls[1]);const payload=JSON.parse(calls[1][1]);expect(Object.keys(payload)[0]).toBe('participation');expect(payload.participation).toBe('non');expect(payload.answers).toEqual({});expect(payload.mode).toBe('retailer');
 await expect(page.locator('.declined-panel button')).toHaveCount(0);
});

test('location selectors reset dependent choices and reject missing values in an Arabic mobile survey',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(base);
 await page.locator('.mode-card').filter({hasText:'Consommateur'}).click();await page.getByRole('button',{name:'Oui',exact:true}).click();
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('.field-error[role=alert]')).toContainText('Confirmez');
 await page.locator('.eligibility input').check();await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#Q0-error')).toBeVisible();
 await fillLocation(page);const selects=page.locator('.location-fields select');await selects.nth(0).selectOption('Ouest');await expect(selects.nth(1)).toHaveValue('');await expect(selects.nth(2)).toHaveValue('');await expect(selects.nth(2)).toBeDisabled();
 await selects.nth(1).selectOption('ORAN');await selects.nth(2).selectOption('CANASTEL');await selects.nth(1).selectOption('TLEMCEN');await expect(selects.nth(2)).toHaveValue('');
 await page.getByRole('tab',{name:'العربية'}).click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await selects.nth(2).selectOption('TLEMCEN');await page.getByRole('button',{name:'تابع',exact:true}).click();await expect(page.locator('#question-Q1')).toBeVisible();
});


test('required customer phone blocks empty or invalid values and reaches WinDev as a string',async({page})=>{
 await page.goto(base);await fillToReview(page,'consumer');
 await page.locator('.review-section').filter({hasText:'Informations du client'}).getByRole('button',{name:'Modifier',exact:true}).click();
 const phone=page.locator('#question-Q15 input');await expect(phone).toHaveAttribute('type','tel');await expect(phone).toHaveAttribute('dir','ltr');
 for(const [language,label] of [['FR','obligatoire'],['EN','required'],['العربية','إجباري']] as const){await page.getByRole('tab',{name:language,exact:true}).click();await expect(page.locator('#question-Q15')).toContainText(label);}
 await page.getByRole('tab',{name:'FR',exact:true}).click();await phone.fill('');await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await expect(page.locator('#Q15-error')).toBeVisible();
 await phone.fill('abc');await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await expect(page.locator('#Q15-error')).toContainText('7 à 15');
 await page.getByRole('tab',{name:'العربية'}).click();await phone.fill('0555123456');await page.getByRole('button',{name:'راجع الإجابات',exact:true}).click();await page.getByRole('button',{name:'أكّد الإجابات',exact:true}).click();
 const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);expect(calls).toHaveLength(1);expect(JSON.parse(calls[0][1]).answers.Q15).toBe('0555123456');
});

test('Q9 good-price choice is translated and reaches WinDev in English',async({page})=>{
 await page.goto(base);await fillToReview(page,'consumer',{Q9:'price'});
 await page.locator('.review-section').filter({has:page.locator('.review-code').filter({hasText:/^Q9$/})}).getByRole('button',{name:'Modifier',exact:true}).click();
 for(const [language,label] of [['FR','Parce que son prix est intéressant'],['EN','Because its price is attractive'],['العربية','خاطر السعر تاعو مليح']] as const){
  await page.getByRole('tab',{name:language,exact:true}).click();await expect(page.locator('#question-Q9 .answer-option').filter({has:page.locator('input[value=price]')})).toContainText(label);
 }
 await page.getByRole('tab',{name:'FR',exact:true}).click();await page.getByRole('button',{name:/^\d+\. Vérification/}).click();await page.getByRole('button',{name:'Valider les réponses',exact:true}).click();
 const calls=await page.evaluate(()=>(window as typeof window & {nativeCalls:[string,string][]}).nativeCalls);expect(calls).toHaveLength(1);expect(JSON.parse(calls[0][1]).answers.Q9).toBe('Because its price is attractive');
});

test('Q7a accepts only 5 to 15 sticks and bounds the quantity buttons',async({page})=>{
 await page.goto(base);await fillToReview(page,'consumer',{Q5:'intended',Q6b:'mbo-red',Q7:'stick',Q7a:'5'});
 await page.locator('.review-section').filter({has:page.locator('.review-row').filter({hasText:'Q7a'})}).getByRole('button',{name:'Modifier',exact:true}).click();
 const field=page.locator('#question-Q7a'),input=field.locator('input');
 await expect(input).toHaveAttribute('min','5');await expect(input).toHaveAttribute('max','15');await expect(field.getByRole('button',{name:'−1',exact:true})).toBeDisabled();
 for(const value of ['4','16']){await input.fill(value);await page.locator('.form-navigation button[type=submit]').click();await expect(page.locator('#Q7a-error')).toBeVisible();}
 await input.fill('15');await expect(field.getByRole('button',{name:'+1',exact:true})).toBeDisabled();await page.locator('.form-navigation button[type=submit]').click();await expect(page.locator('#Q7a-error')).toHaveCount(0);
});


test('consumer URL keeps both modes at root and disables only retailer at /0 before and after hydration',async({page,browser})=>{
 const limited=base.replace(/\/$/,'')+'/0';
 const staticPage=await browser.newPage({javaScriptEnabled:false});
 try{const response=await staticPage.goto(limited);expect(response!.status()).toBe(200);await expect(staticPage.locator('.mode-card').nth(0)).toBeEnabled();await expect(staticPage.locator('.mode-card').nth(1)).toBeDisabled();}finally{await staticPage.close();}
 await page.goto(base);await expect(page.locator('.mode-card')).toHaveCount(2);await expect(page.locator('.mode-card').nth(0)).toBeEnabled();await expect(page.locator('.mode-card').nth(1)).toBeEnabled();await page.locator('.mode-card').nth(1).click();await expect(page.locator('.intro-badge')).toContainText('Détaillant');
 await page.goto(limited);const retailer=page.locator('.mode-card').nth(1);await expect(retailer).toBeDisabled();await expect(retailer).toHaveCSS('filter','grayscale(1) blur(1.5px)');
 await retailer.evaluate((button:HTMLButtonElement)=>button.click());await expect(page.locator('.mode-card')).toHaveCount(2);await expect(page.locator('.intro-panel')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:'العربية'}).click();await expect(retailer).toBeDisabled();await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('tab',{name:'FR',exact:true}).click();await beginSurvey(page,'consumer');await expect(page.locator('#question-Q1')).toBeVisible();await page.reload();await expect(page.locator('.mode-card').nth(1)).toBeDisabled();
 await page.goto(base);await expect(page.locator('.mode-card').nth(1)).toBeEnabled();
});
