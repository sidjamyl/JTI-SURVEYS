import assert from 'node:assert/strict';
import test from 'node:test';
import { activeSections, cleanAnswers, consumerSections, flaggedSkus, questionValid, retailerSections, skus, type Answers } from '../lib/questionnaire';
import { interviewsCsv, literalAnswers, interviewsJson, isQuestionLanguages } from '../lib/storage';
const question=(id:string)=>[...consumerSections,...retailerSections].flatMap(s=>s.questions).find(q=>q.id===id)!;
test('consumer routing follows purchase, format and substitution answers',()=>{
 const a:Answers={Q1:skus[0].id,Q2:'both',Q5:'other-stick',Q6b:skus[1].id,Q7:'stick'};
 const ids=()=>activeSections('consumer',a).flatMap(s=>s.questions.map(q=>q.id));
 assert.ok(ids().includes('Q2b'));assert.ok(ids().includes('Q7a'));assert.ok(!ids().includes('Q7b'));assert.ok(ids().includes('Q8'));assert.ok(ids().includes('Q11'));assert.ok(ids().includes('Q12'));
 a.Q7='both';assert.ok(ids().includes('Q7a'));assert.ok(ids().includes('Q7b'));
 a.Q5='later';assert.ok(!ids().includes('Q6b'));assert.ok(!ids().includes('Q7a'));assert.ok(!ids().includes('Q8'));assert.ok(!ids().includes('Q11'));assert.ok(ids().includes('Q9'));
 a.Q5='intended';a.Q6b=a.Q1;a.Q7='pack';a.Q2='pack';assert.ok(!ids().includes('Q2b'));assert.ok(!ids().includes('Q8'));assert.ok(ids().includes('Q7b'));
});
test('retailer substitution is capped at eight SKUs in sales rank order',()=>{
 const a:Answers={R3:Object.fromEntries([...skus].reverse().map((s,i)=>[s.id,i%2?'out':'stick']))};
 assert.deepEqual(flaggedSkus(a).map(s=>s.id),skus.slice(0,8).map(s=>s.id));
 const ids=()=>activeSections('retailer',a).flatMap(s=>s.questions.map(q=>q.id));assert.ok(ids().includes('R8'));assert.ok(!ids().includes('R10'));a.R9='sometimes';assert.ok(ids().includes('R10'));
 a.R3=Object.fromEntries(skus.map(s=>[s.id,'full']));assert.ok(!ids().includes('R8'));
});
test('validation enforces integer bounds, three-answer maximum and specified Other',()=>{
 assert.ok(questionValid(question('Q7b'),{Q7b:'10'}));assert.ok(!questionValid(question('Q7b'),{Q7b:'11'}));
 assert.ok(questionValid(question('Q7a'),{Q7a:'15'}));for(const v of ['0','16','1.5','1e1',''])assert.ok(!questionValid(question('Q7a'),{Q7a:v}));
 assert.ok(!questionValid(question('Q8'),{Q8:['only','closest','cheaper','taste']}));assert.ok(questionValid(question('Q8'),{Q8:['only','taste','trust']}));assert.ok(!questionValid(question('Q8'),{Q8:['trust','trust']}));
 assert.ok(!questionValid(question('Q2b'),{Q2b:'other'}));assert.ok(questionValid(question('Q2b'),{Q2b:'other','Q2b-other':'Occasion particulière'}));
});
test('availability grid requires all eighteen valid statuses',()=>{
 const a:Answers={R3:Object.fromEntries(skus.map(s=>[s.id,'full']))};assert.ok(questionValid(question('R3'),a));delete (a.R3 as Record<string,string>)[skus[17].id];assert.ok(!questionValid(question('R3'),a));
});
test('routed substitute includes the full SKU list and lost sales, rejects duplicate second choice',()=>{
 const a:Answers={R3:{[skus[0].id]:'out'},R8:{[skus[0].id]:'none'}};assert.ok(questionValid(question('R8'),a));a.R8={[skus[0].id]:skus[0].id};assert.ok(questionValid(question('R8'),a));a.R8={[skus[0].id]:skus[1].id,[skus[0].id+'-second']:skus[1].id};assert.ok(!questionValid(question('R8'),a));a.R8={[skus[0].id]:'other'};assert.ok(!questionValid(question('R8'),a));a.R8={[skus[0].id]:'other',[skus[0].id+'-other']:'Specified brand'};assert.ok(questionValid(question('R8'),a));
});
test('exports omit stale conditional answers after edits',()=>{
 const a:Answers={Q1:skus[0].id,Q2:'pack',Q2b:'other','Q2b-other':'Stale',Q5:'later',Q6b:skus[1].id,Q7:'both',Q7a:'2',Q7b:'1',Q8:['trust'],Q11:'4',Q12:['price']};const cleaned=cleanAnswers('consumer',a);
 for(const id of ['Q2b','Q2b-other','Q6b','Q7','Q7a','Q7b','Q8','Q11','Q12'])assert.ok(!(id in cleaned));
 const r:Answers={R3:{[skus[0].id]:'out'},R8:{[skus[0].id]:'none',[skus[1].id]:'other'}};assert.deepEqual(cleanAnswers('retailer',r).R8,{[skus[0].id]:'none'});
});
test('CSV preserves Arabic and quotes text while neutralizing spreadsheet formulas',()=>{
 const csv=interviewsCsv([{id:'test',mode:'retailer',language:'ar',completedAt:'2026-10-08T10:00:00.000Z',schemaVersion:1,answers:{R1:{city:'الجزائر',pos:'=HYPERLINK("bad")'},R17:['Camel','Winston']}}]);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('الجزائر'));assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('""bad""'));assert.ok(csv.includes('Camel|Winston'));
});
test('all question and option translations are present in three languages',()=>{
 for(const q of [...consumerSections,...retailerSections].flatMap(s=>s.questions))for(const lang of ['fr','en','ar'] as const){assert.ok(q.text[lang].trim());for(const o of q.options??[])assert.ok(o.label[lang].trim());}
});

test('question codes, choice counts and SKU ranks match the original workbook',async()=>{
 const {readFile}=await import('node:fs/promises');
 const fixture=JSON.parse(await readFile(new URL('./fixtures/questionnaire.json',import.meta.url),'utf8'));
 for(const [mode,sections] of [['consumer',consumerSections],['retailer',retailerSections]] as const){
  const questions=sections.flatMap(s=>s.questions);
  assert.deepEqual(questions.map(q=>q.id).sort(),fixture[mode].filter((q:{id:string})=>!['Q13','Q14','R1'].includes(q.id)).map((q:{id:string})=>q.id).sort());
  for(const q of fixture[mode])if(q.choiceCount&&!['Q13','Q14','R1'].includes(q.id))assert.equal(questions.find(x=>x.id===q.id)?.options?.length,q.choiceCount,q.id);
 }
 const normalized=(name:string)=>name.replace('Filsters','Filters').trim();
 assert.deepEqual(skus.map(s=>s.name),fixture.skus.map(normalized));
});

test('substitution export removes stale Other text while preserving an active second Other',()=>{
 const sku=skus[0].id;
 const a:Answers={R3:{[sku]:'out'},R8:{[sku]:'none',[sku+'-other']:'Stale text'}};
 assert.deepEqual(cleanAnswers('retailer',a).R8,{[sku]:'none'});
 (a.R8 as Record<string,string>)[sku+'-second']='other';
 assert.deepEqual(cleanAnswers('retailer',a).R8,{[sku]:'none',[sku+'-second']:'other',[sku+'-other']:'Stale text'});
});


test('JSON exports literal answers with each question language and excludes removed fields',()=>{
 const answers:Answers={Q1:'mbo-red',Q2:'both',Q2b:'other','Q2b-other':'Occasion',Q5:'later',Q13:'male',Q14:'1'};
 const result=literalAnswers('consumer',answers,{Q1:'fr',Q2:'en',Q2b:'ar'},'fr');
 assert.equal(result.Q1.answer,'MBO Red');assert.equal(result.Q1.language,'fr');
 assert.equal(result.Q2.answer,question('Q2').options!.find(o=>o.id==='both')!.label.en);assert.equal(result.Q2.language,'en');
 assert.equal(result.Q2b.answer,question('Q2b').options!.find(o=>o.id==='other')!.label.ar+' — Occasion');
 assert.equal(result.Q5.language,null);assert.ok(!('Q13' in result));assert.ok(!('Q14' in result));
 const parsed=JSON.parse(interviewsJson([{id:'test',mode:'consumer',language:'en',completedAt:'2026-10-09T10:00:00Z',schemaVersion:1,answers,questionLanguages:{Q2:'en'}}]));
 assert.equal(parsed[0].answers.Q2.language,'en');assert.equal(parsed[0].questionLanguages,undefined);
 assert.ok(isQuestionLanguages({Q2:'en'}));assert.ok(!isQuestionLanguages({Q2:'bad'}));
});
test('literal grid and multiple-choice answers preserve labels and free text',()=>{
 const sku=skus[0].id;
 const a:Answers={R3:{[sku]:'out',[skus[1].id]:'full'},R8:{[sku]:'other',[sku+'-other']:'Local brand',[sku+'-second']:'none',[skus[1].id]:'none'},R17:['Winston','Camel']};
 const result=literalAnswers('retailer',a,{R3:'en',R8:'fr',R17:'ar'});
 assert.equal((result.R3.answer as Record<string,string>)['MBO Red'],'Out of stock');
 assert.deepEqual(Object.keys(result.R8.answer as object),['MBO Red']);
 assert.ok(JSON.stringify(result.R8.answer).includes('Local brand'));assert.deepEqual(result.R17.answer,['Winston','Camel']);
});
