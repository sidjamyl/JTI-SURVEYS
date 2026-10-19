import { isConsumerPhoto, type ConsumerPhoto } from './photo';
import { activeSections, flaggedSkus, questionValid, skus, stockOptions, type Answers, type Mode, type Language } from './questionnaire';
import { copy } from './copy';
export const DRAFT_KEY='jti-pulse-drafts-v1';
export const DRAFT_LANGUAGE_KEY='jti-pulse-draft-languages-v1';
export const RECORD_KEY='jti-pulse-records-v1';
export type QuestionLanguages = Record<string,Language>;
export type Participation = { answer:'yes'|'no'; language:Language };
export type Interview = { id:string; mode:Mode; language:Language; completedAt:string; answers:Answers; photo?:ConsumerPhoto; questionLanguages?:QuestionLanguages; participation?:Participation; schemaVersion:1 };
export function isQuestionLanguages(value:unknown):value is QuestionLanguages {
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(v=>v==='fr'||v==='en'||v==='ar');
}
export function isAnswers(value:unknown): value is Answers {
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(v=>typeof v==='string'||(Array.isArray(v)&&v.every(x=>typeof x==='string'))||(!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(x=>typeof x==='string')));
}
export function isInterview(value:unknown):value is Interview {
 if(!value||typeof value!=='object')return false;const r=value as Interview;
 return typeof r.id==='string'&&['consumer','retailer'].includes(r.mode)&&['fr','en','ar'].includes(r.language)&&typeof r.completedAt==='string'&&!Number.isNaN(Date.parse(r.completedAt))&&isAnswers(r.answers)&&(r.questionLanguages===undefined||isQuestionLanguages(r.questionLanguages))&&(r.mode==='consumer'&&r.participation?.answer!=='no'?isConsumerPhoto(r.photo):r.photo===undefined)&&r.schemaVersion===1&&(r.participation===undefined||(['yes','no'].includes(r.participation?.answer)&&['fr','en','ar'].includes(r.participation?.language)))&&(r.participation?.answer==='no'?Object.keys(r.answers).length===0:activeSections(r.mode,r.answers).every(s=>s.questions.every(q=>questionValid(q,r.answers))));
}
export function literalAnswers(mode:Mode,answers:Answers) {
 return Object.fromEntries(activeSections(mode,answers).flatMap(s=>s.questions).filter(q=>answers[q.id]!==undefined&&(q.type!=='tel'||(typeof answers[q.id]==='string'&&String(answers[q.id]).trim()!==''))).map(q=>{
  const value=answers[q.id];
  const skuName=(id:string)=>skus.find(s=>s.id===id)?.name??id;
  const label=(id:string)=>q.options?.find(o=>o.id===id)?.label.en??id;
  const choice=(id:string)=>id==='other'?`${label(id)} — ${answers[q.id+'-other']??''}`:label(id);
  let answer:unknown=value;
  if(q.type==='tel')answer=(value as string).trim();
  else if(q.type==='sku')answer=skuName(value as string);
  else if(q.type==='location'){const location=value as Record<string,string>;answer={...location,region:({Centre:'Central',Est:'East',Ouest:'West'} as Record<string,string>)[location.region]??location.region};}
  else if(q.type==='stock')answer=Object.fromEntries(Object.entries(value as Record<string,string>).map(([id,status])=>[skuName(id),stockOptions.find(o=>o.id===status)?.label.en??status]));
  else if(q.type==='substitution'){
   const grid=value as Record<string,string>;
   const substitute=(id:string,key:string)=>id==='other'?`${copy.otherBrand.en} — ${grid[key+'-other']??''}`:id==='none'?copy.none.en:skuName(id);
   answer=Object.fromEntries(flaggedSkus(answers).filter(s=>grid[s.id]).map(s=>[s.name,{primary:substitute(grid[s.id],s.id),...(grid[s.id+'-second']?{secondary:substitute(grid[s.id+'-second'],s.id)}:{})}]));
  }
  else if(q.options)answer=Array.isArray(value)?value.map(choice):choice(value as string);
  return [q.id,answer];
 }));
}
export function interviewPayload(r:Interview) {
 const {questionLanguages,participation,photo,...record}=r;
 return {...(participation?{participation:participation.answer==='yes'?'oui':'non'}:{}),...record,...(r.mode==='consumer'&&participation?.answer!=='no'&&isConsumerPhoto(photo)?{photo}:{}),answers:participation?.answer==='no'?{}:literalAnswers(r.mode,r.answers)};
}
export function interviewsJson(records:Interview[]) {
 return JSON.stringify(records.map(interviewPayload),null,2);
}
export function interviewsCsv(records:Interview[]) {
 const rows=[['interview_id','mode','language','completed_at','question_code','item','answer']];
 for(const r of records)for(const [q,v]of Object.entries(r.answers)) {
  if(typeof v==='object'&&!Array.isArray(v))for(const [item,answer]of Object.entries(v))rows.push([r.id,r.mode,r.language,r.completedAt,q,item,answer]);
  else rows.push([r.id,r.mode,r.language,r.completedAt,q,'',Array.isArray(v)?v.join('|'):v]);
 }
 const safe=(s:string)=>'"'+(/^[\s]*[=+\-@]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';
 return '\uFEFF'+rows.map(row=>row.map(safe).join(',')).join('\r\n');
}
export function download(filename:string,content:string,mime:string) {
 const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
