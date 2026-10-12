import assert from 'node:assert/strict';
import test from 'node:test';
import { activeSections, cleanAnswers, consumerSections, flaggedSkus, questionValid, retailerSections, skus, type Answers } from '../lib/questionnaire';
import { interviewsCsv, literalAnswers, interviewsJson, isQuestionLanguages, interviewPayload, isInterview } from '../lib/storage';
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

test('question codes, choice counts and SKU ranks preserve the workbook with requested location and POS updates',async()=>{
 const {readFile}=await import('node:fs/promises');
 const fixture=JSON.parse(await readFile(new URL('./fixtures/questionnaire.json',import.meta.url),'utf8'));
 for(const [mode,sections] of [['consumer',consumerSections],['retailer',retailerSections]] as const){
  const questions=sections.flatMap(s=>s.questions);
  assert.deepEqual(questions.filter(q=>q.id!=='Q0').map(q=>q.id).sort(),fixture[mode].filter((q:{id:string})=>!['Q13','Q14'].includes(q.id)).map((q:{id:string})=>q.id).sort());
  for(const q of fixture[mode])if(q.choiceCount&&!['Q13','Q14'].includes(q.id))assert.equal(questions.find(x=>x.id===q.id)?.options?.length,q.id==='R2'?2:q.choiceCount,q.id);
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


test('JSON exports direct English answers and excludes removed fields',()=>{
 const answers:Answers={Q1:'mbo-red',Q2:'both',Q2b:'other','Q2b-other':'Occasion',Q5:'later',Q13:'male',Q14:'1'};
 const result=literalAnswers('consumer',answers);
 assert.equal(result.Q1,'MBO Red');
 assert.equal(result.Q2,question('Q2').options!.find(o=>o.id==='both')!.label.en);
 assert.equal(result.Q2b,question('Q2b').options!.find(o=>o.id==='other')!.label.en+' — Occasion');
 assert.equal(result.Q5,'Will buy later');assert.ok(!('Q13' in result));assert.ok(!('Q14' in result));
 const parsed=JSON.parse(interviewsJson([{id:'test',mode:'consumer',language:'en',completedAt:'2026-10-09T10:00:00Z',schemaVersion:1,answers,questionLanguages:{Q2:'en'}}]));
 assert.equal(parsed[0].answers.Q2,'Both pack and stick');assert.equal(parsed[0].questionLanguages,undefined);
 assert.ok(isQuestionLanguages({Q2:'en'}));assert.ok(!isQuestionLanguages({Q2:'bad'}));
});
test('literal grid and multiple-choice answers preserve labels and free text',()=>{
 const sku=skus[0].id;
 const a:Answers={R3:{[sku]:'out',[skus[1].id]:'full'},R8:{[sku]:'other',[sku+'-other']:'Local brand',[sku+'-second']:'none',[skus[1].id]:'none'},R17:['Winston','Camel']};
 const result=literalAnswers('retailer',a);
 assert.equal((result.R3 as Record<string,string>)['MBO Red'],'Out of stock');
 assert.deepEqual(Object.keys(result.R8 as object),['MBO Red']);
 assert.ok(JSON.stringify(result.R8).includes('Local brand'));assert.deepEqual(result.R17,['Winston','Camel']);
});

test('French and Algerian Arabic questions and answers match V2 with requested location and POS updates',async()=>{
 const {readFile}=await import('node:fs/promises');
 const fixture=JSON.parse(await readFile(new URL('./fixtures/translations-v2.json',import.meta.url),'utf8'));
 const questions=[...consumerSections,...retailerSections].flatMap(s=>s.questions);
 assert.deepEqual(Object.keys(fixture).sort(),questions.map(q=>q.id).sort());
 const {stockOptions}=await import('../lib/questionnaire');
 for(const q of questions){
  for(const lang of ['fr','ar'] as const)assert.equal(q.text[lang],fixture[q.id].text[lang],`${q.id} ${lang}`);
  const options=q.type==='stock'?stockOptions:q.options;
  if(options){
   assert.deepEqual(options.map(o=>o.id).sort(),Object.keys(fixture[q.id].options).sort(),q.id);
   for(const o of options)for(const lang of ['fr','ar'] as const)assert.equal(o.label[lang],fixture[q.id].options[o.id][lang],`${q.id} ${o.id} ${lang}`);
  }
 }
 const result=literalAnswers('consumer',{Q1:'mbo-red',Q5:'other-pack',Q6b:'camel-yellow',Q11:'4'});
 assert.equal(result.Q11,question('Q11').options!.find(o=>o.id==='4')!.label.en);
});


test('location choices retain all 98 source entries and reject mismatched region, wilaya or commune',async()=>{
 const {locations}=await import('../lib/locations');
 assert.deepEqual(Object.keys(locations),['Centre','Est','Ouest']);
 assert.equal(Object.values(locations).reduce((n,region)=>n+Object.keys(region).length,0),17);
 assert.equal(Object.values(locations).flatMap(region=>Object.values(region)).flat().length,98);
 assert.equal(locations.Centre.TIPAZA.filter(c=>c==='KOLEA').length,1);
 assert.ok(locations.Centre.ALGER.includes('AIN BENIANE'));
 for(const id of ['Q0','R1']){
  assert.ok(questionValid(question(id),{[id]:{region:'Centre',wilaya:'ALGER',commune:'AIN BENIAN'}}));
  for(const value of [undefined,'ALGER',[],{region:'Centre',wilaya:'ALGER',commune:''},{region:'Est',wilaya:'ALGER',commune:'AIN BENIAN'},{region:'Centre',wilaya:'ALGER',commune:'KOLEA'},{region:'__proto__',wilaya:'constructor',commune:'x'}])assert.ok(!questionValid(question(id),{[id]:value} as Answers));
 }
 assert.deepEqual(question('R2').options!.map(o=>o.id),['tobacco','kiosk']);
 assert.ok(!questionValid(question('R2'),{R2:'grocery'}));assert.ok(!questionValid(question('R2'),{R2:'other'}));
});

test('participation is oui or non at the start of the JSON and refusals have no survey answers',()=>{
 const base={id:'consent',mode:'consumer' as const,language:'fr' as const,completedAt:'2026-10-12T10:00:00Z',schemaVersion:1 as const};
 const yes=interviewPayload({...base,participation:{answer:'yes',language:'en'},answers:{Q0:{region:'Centre',wilaya:'ALGER',commune:'AIN BENIAN'}}});
 assert.equal(Object.keys(yes)[0],'participation');assert.equal(yes.participation,'oui');
 assert.deepEqual(yes.answers.Q0,{region:'Central',wilaya:'ALGER',commune:'AIN BENIAN'});
 const refusal={...base,participation:{answer:'no' as const,language:'ar' as const},answers:{}};
 assert.ok(isInterview(refusal));assert.equal(interviewPayload(refusal).participation,'non');
 assert.deepEqual(interviewPayload({...refusal,answers:{Q1:'mbo-red'}}).answers,{});
 assert.ok(!isInterview({...refusal,answers:{Q1:'mbo-red'}}));
 assert.ok(!isInterview({...refusal,participation:{answer:'maybe',language:'ar'}}));
});


test('payload answers are identical for French, English and Arabic interviews',()=>{
 for(const mode of ['consumer','retailer'] as const){
  const answers:Answers=mode==='consumer'?{Q0:{region:'Est',wilaya:'ANNABA',commune:'ANNABA'},Q1:'mbo-red',Q2:'both',Q5:'other-pack',Q6b:'camel-yellow',Q7:'both',Q7a:'3',Q7b:'1',Q8:['only','taste'],Q11:'4',Q12:['price']}:{R1:{region:'Ouest',wilaya:'ORAN',commune:'CANASTEL'},R2:'tobacco',R3:{'mbo-red':'out','camel-yellow':'stick'},R8:{'mbo-red':'none','mbo-red-second':'other','mbo-red-other':'ماركة محلية'},R9:'always',R10:'price',R17:['Camel','Winston']};
  const outputs=['fr','en','ar'].map(language=>interviewPayload({id:'same',mode,language:language as 'fr'|'en'|'ar',completedAt:'2026-10-12T10:00:00Z',schemaVersion:1,participation:{answer:'yes',language:language as 'fr'|'en'|'ar'},questionLanguages:Object.fromEntries(Object.keys(answers).map(id=>[id,language as 'fr'|'en'|'ar'])),answers}));
  for(const output of outputs){assert.equal(output.participation,'oui');assert.deepEqual(output.answers,outputs[0].answers);}
  if(mode==='consumer'){assert.equal(outputs[0].answers.Q2,'Both pack and stick');assert.deepEqual(outputs[0].answers.Q8,['Only available option','Similar taste / strength']);}
  else {assert.equal(outputs[0].answers.R2,'Tobacco specialist');assert.equal((outputs[0].answers.R3 as Record<string,string>)['Camel Filters Yellow'],'Available only by stick');assert.deepEqual((outputs[0].answers.R8 as Record<string,unknown>)['MBO Red'],{primary:'No clear substitute / leaves without buying',secondary:'Other brand, specify — ماركة محلية'});}
 }
});
