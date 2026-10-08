import { activeSections, questionValid, type Answers, type Mode, type Language } from './questionnaire';
export const DRAFT_KEY='jti-pulse-drafts-v1';
export const RECORD_KEY='jti-pulse-records-v1';
export type Interview = { id:string; mode:Mode; language:Language; completedAt:string; answers:Answers; schemaVersion:1 };
export function isAnswers(value:unknown): value is Answers {
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(v=>typeof v==='string'||(Array.isArray(v)&&v.every(x=>typeof x==='string'))||(!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(x=>typeof x==='string')));
}
export function isInterview(value:unknown):value is Interview {
 if(!value||typeof value!=='object')return false;const r=value as Interview;
 return typeof r.id==='string'&&['consumer','retailer'].includes(r.mode)&&['fr','en','ar'].includes(r.language)&&typeof r.completedAt==='string'&&!Number.isNaN(Date.parse(r.completedAt))&&isAnswers(r.answers)&&r.schemaVersion===1&&activeSections(r.mode,r.answers).every(s=>s.questions.every(q=>questionValid(q,r.answers)));
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
