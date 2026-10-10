import { Check } from 'lucide-react';
import { copy } from '@/lib/copy';
import { questionValid, t, type Answers, type Language, type Section } from '@/lib/questionnaire';

export function SurveyStepper({sections,answers,lang,activeId,finished,onSelect}:{sections:Section[];answers:Answers;lang:Language;activeId:string;finished:boolean;onSelect:(id:string)=>void}) {
 const steps=[...sections.map(s=>({id:s.id,title:s.title[lang],complete:s.questions.every(q=>questionValid(q,answers))})),{id:'review',title:t('Vérification','Review','المراجعة')[lang],complete:finished}];
 const activeIndex=steps.findIndex(s=>s.id===activeId);
 const total=sections.reduce((n,s)=>n+s.questions.length,0);
 const answered=sections.reduce((n,s)=>n+s.questions.filter(q=>questionValid(q,answers)).length,0);
 // Saving is the final step, so complete answers alone never show 100%.
 const progress=finished?100:Math.round(answered/(total+1)*100);
 return <div className="survey-stepper" dir={lang==='ar'?'rtl':'ltr'}>
  <nav aria-label={copy.journey[lang]}><ol>{steps.map((step,i)=>{
   const available=!finished&&steps.slice(0,i).every(s=>s.complete);
   return <li key={step.id} className={`${step.complete?'complete':''} ${!finished&&i===activeIndex?'current':''}`}><button disabled={!available} aria-current={!finished&&i===activeIndex?'step':undefined} aria-label={`${i+1}. ${step.title}${step.complete?` · ${copy.completed[lang]}`:''}`} onClick={()=>onSelect(step.id)}><span className="step-dot">{step.complete?<Check size={14}/>:<bdi>{i+1}</bdi>}</span><span className="step-label">{step.title}</span></button></li>;
  })}</ol></nav>
  <div className="stepper-track" role="progressbar" aria-label={copy.progress[lang]} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{transform:`scaleX(${progress/100})`}}/></div>
 </div>;
}
