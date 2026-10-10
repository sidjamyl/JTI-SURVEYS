import { expect, type Page } from '@playwright/test';
import { activeSections, skus, type Answers, type Mode } from '../lib/questionnaire';

export async function fillToReview(page:Page,mode:Mode,overrides:Answers={}) {
 const answers:Answers=mode==='consumer'?{Q1:'mbo-red',Q2:'pack',Q5:'later',...overrides}:{R3:Object.fromEntries(skus.map(s=>[s.id,'full'])),R9:'decides',...overrides};
 if(mode==='consumer')await page.locator('.eligibility input').check();
 for(let step=0;step<12;step++) {
  const fields=page.locator('fieldset');
  const ids=await fields.evaluateAll(els=>els.map(el=>el.id.replace('question-','')));
  const questions=activeSections(mode,answers).flatMap(s=>s.questions);
  for(const id of ids) {
   const q=questions.find(q=>q.id===id)!;
   const value=answers[id]??(q.options?(q.type==='multi'?[q.options[0].id]:q.options[0].id):q.type==='scale'?'4':String(q.min??1));
   answers[id]=value;
   const field=page.locator(`#question-${id}`);
   if(q.type==='sku')await field.getByText(skus.find(s=>s.id===value)!.name,{exact:true}).click();
   else if(q.type==='single'||q.type==='multi')for(const v of Array.isArray(value)?value:[value])await field.locator(`input[value="${v}"]`).check({force:true});
   else if(q.type==='number')await field.locator('input[type=number]').fill(String(value));
   else if(q.type==='scale')await field.locator('.scale-options label').nth(Number(value)-1).click();
   else if(q.type==='stock')for(const [sku,status] of Object.entries(value as Record<string,string>))await field.locator(`#stock-${sku}`).selectOption(status);
   else for(const select of await field.locator('.substitution-row select').all())await select.selectOption('none');
  }
  await page.locator('.form-navigation button[type=submit]').click();
  await expect(page.locator('.field-error')).toHaveCount(0);
  if(await page.locator('.review-row').count())return;
 }
 throw new Error('Review was not reached');
}
