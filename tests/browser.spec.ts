import { test, expect } from '@playwright/test';
const base='http://localhost:3002';
test('consumer branch, switching, three-choice cap, language persistence and saved interview',async({page})=>{
 await page.goto(base);await expect(page.getByRole('button',{name:'Commencer l’entretien',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Commencer l’entretien',exact:true}).click();await expect(page.locator('.field-error[role=alert]')).toContainText('Confirmez');
 await page.locator('.eligibility input').check();await page.getByRole('button',{name:'Commencer l’entretien',exact:true}).click();
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('.field-error')).toHaveCount(2);
 await page.locator('#question-Q1').getByText('MBO Red',{exact:true}).click();await page.locator('#question-Q2 .answer-option').filter({hasText:'Paquet et unité'}).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-Q2b')).toBeVisible();await page.locator('#question-Q2b .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q3 .answer-option').last().click();await page.locator('#question-Q4 .answer-option').nth(1).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q5 .answer-option').nth(2).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q6b').getByText('Gauloises Blondes Blue',{exact:true}).click();await page.locator('#question-Q7 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-Q7a')).toHaveCount(0);await page.locator('#question-Q7b input').fill('2');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(let i=0;i<3;i++)await page.locator('#question-Q8 .answer-option').nth(i).click();await expect(page.locator('#question-Q8 input:disabled')).toHaveCount(7);
 await page.locator('#question-Q9 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-Q10 .answer-option').first().click();await page.locator('#question-Q11 label').nth(3).click();await page.locator('#question-Q12 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.getByRole('tab',{name:'العربية'}).click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');await page.getByRole('tab',{name:'FR',exact:true}).click();
 await page.locator('#question-Q13 .answer-option').first().click();await page.locator('#question-Q14 .answer-option').nth(1).click();await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();
 await page.getByRole('button',{name:'Enregistrer l’entretien',exact:true}).click();await expect(page.getByRole('heading',{name:'Entretien enregistré.'})).toBeVisible();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jti-pulse-records-v1')!));expect(saved).toHaveLength(1);expect(saved[0].answers.Q8).toHaveLength(3);expect(saved[0].answers.Q7b).toBe('2');expect(saved[0].answers.Q7a).toBeUndefined();
 await page.reload();await page.getByRole('button',{name:/Entretiens locaux/}).click();await expect(page.locator('.record-row')).toHaveCount(1);await page.locator('.record-row').click();await expect(page.locator('.review-section')).toHaveCount(9);
});
test('retailer eighteen-SKU stock grid and capped substitution route',async({page})=>{
 await page.goto(base);await page.locator('.mode-card').filter({hasText:'Détaillant'}).click();await page.getByRole('button',{name:'Commencer l’entretien',exact:true}).click();
 await page.locator('#question-R1 input').nth(0).fill('Alger');await page.locator('#question-R1 input').nth(1).fill('Alger');await page.locator('#question-R1 input').nth(2).fill('POS-001');await page.locator('#question-R2 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-R3 select')).toHaveCount(18);for(let i=0;i<18;i++)await page.locator('#question-R3 select').nth(i).selectOption(i<10?'out':'full');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const id of ['R4','R5','R6'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-R7 .answer-option').last().click();await expect(page.locator('.substitution-row')).toHaveCount(8);await expect(page.locator('.substitution-row').first().locator('select').first().locator('option')).toHaveCount(21);for(let i=0;i<8;i++)await page.locator('.substitution-row').nth(i).locator('select').first().selectOption('none');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-R9 .answer-option').nth(2).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#question-R10')).toHaveCount(0);
 for(const id of ['R16','R17'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.locator('#question-R18 .answer-option').first().click();await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await page.getByRole('button',{name:'Enregistrer l’entretien',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Entretien enregistré.'})).toBeVisible();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jti-pulse-records-v1')!));expect(Object.keys(saved[0].answers.R8)).toHaveLength(8);expect(saved[0].answers.R10).toBeUndefined();
});

test('mobile stepper stays visible, adapts to branches and supports RTL',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(base);await page.locator('.eligibility input').check();await page.getByRole('button',{name:'Commencer l’entretien',exact:true}).click();
 const steps=page.locator('.survey-stepper li');const initial=await steps.count();
 await expect(page.locator('.survey-stepper [aria-current=step]')).toHaveCount(1);
 await expect(page.locator('.survey-stepper button').nth(1)).toBeDisabled();
 await page.locator('#question-Q1').getByText('MBO Red',{exact:true}).click();await page.locator('#question-Q2 .answer-option').filter({hasText:'Paquet et unité'}).click();
 await expect(steps).toHaveCount(initial+1);await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('.survey-stepper [aria-current=step]')).toHaveAttribute('aria-label',/2\./);
 await page.locator('.survey-stepper button').first().click();await expect(page.locator('#question-Q1')).toBeVisible();
 await page.evaluate(()=>scrollTo(0,700));
 const header=await page.locator('.sticky-header').boundingBox();expect(header?.y).toBe(0);
 await page.getByRole('tab',{name:'العربية'}).click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow',/^[1-9]\d?$/);
});

test('supplied logo and eighteen photos load in all three languages',async({page})=>{
 await page.goto(base);await expect(page.locator('.brand-logo img')).toBeVisible();
 expect(await page.locator('.brand-logo img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await page.locator('.eligibility input').check();await page.getByRole('button',{name:'Commencer l’entretien',exact:true}).click();
 const images=page.locator('#question-Q1 .product-visual img');await expect(images).toHaveCount(18);
 for(const img of await images.all()){
  await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
 }
 for(const language of ['EN','العربية','FR']){
  await page.getByRole('tab',{name:language,exact:true}).click();await expect(images).toHaveCount(18);
 }
});

test('changing a purchase to no purchase skips and excludes stale answers',async({page})=>{
 await page.goto(base);
 await page.evaluate(()=>localStorage.setItem('jti-pulse-drafts-v1',JSON.stringify({consumer:{Q1:'mbo-red',Q2:'pack',Q3:'out',Q4:'out',Q5:'other-pack',Q6b:'gauloises-blue',Q7:'both',Q7a:'3',Q7b:'1',Q8:['only'],Q9:'few',Q10:'return',Q11:'4',Q12:['price'],Q13:'male',Q14:'1'},retailer:{}})));
 await page.reload();await page.locator('.eligibility input').check();await page.getByRole('button',{name:'Reprendre le brouillon'}).click();
 await page.locator('.survey-stepper button').filter({hasText:'Votre décision'}).click();await page.locator('#question-Q5 .answer-option').filter({hasText:'J’achèterai plus tard'}).click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-Q9')).toBeVisible();await expect(page.locator('#question-Q8')).toHaveCount(0);
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#question-Q10')).toBeVisible();await expect(page.locator('#question-Q11')).toHaveCount(0);
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await page.getByRole('button',{name:'Enregistrer l’entretien',exact:true}).click();
 const answers=await page.evaluate(()=>JSON.parse(localStorage.getItem('jti-pulse-records-v1')!)[0].answers);
 for(const id of ['Q6b','Q7','Q7a','Q7b','Q8','Q11','Q12'])expect(answers[id]).toBeUndefined();
 expect(answers.Q5).toBe('later');
});

test('retailer recommendation branch and no flagged products',async({page})=>{
 await page.goto(base);await page.locator('.mode-card').filter({hasText:'Détaillant'}).click();await page.getByRole('button',{name:'Commencer l’entretien',exact:true}).click();
 for(const [i,value] of ['Alger','Alger','POS-002'].entries())await page.locator('#question-R1 input').nth(i).fill(value);
 await page.locator('#question-R2 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const select of await page.locator('#question-R3 select').all())await select.selectOption('full');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const id of ['R4','R5','R6'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await expect(page.locator('#question-R8')).toHaveCount(0);await page.locator('#question-R7 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();
 await page.locator('#question-R9 .answer-option').first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#question-R10')).toBeVisible();
 await page.locator('#question-R10 .answer-option').last().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#R10-error')).toBeVisible();
 await page.locator('#question-R10 .other-field input').fill('Critère local');await page.getByRole('button',{name:'Continuer',exact:true}).click();
 for(const id of ['R16','R17'])await page.locator(`#question-${id} .answer-option`).first().click();await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.locator('#question-R18 .answer-option').first().click();
 await page.getByRole('button',{name:'Vérifier les réponses',exact:true}).click();await page.getByRole('button',{name:'Enregistrer l’entretien',exact:true}).click();
 const answers=await page.evaluate(()=>JSON.parse(localStorage.getItem('jti-pulse-records-v1')!)[0].answers);expect(answers.R8).toBeUndefined();expect(answers.R10).toBe('other');expect(answers['R10-other']).toBe('Critère local');
});
