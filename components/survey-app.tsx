'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, Store, Users } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { Button } from '@/components/ui/button';
import AnimatedTabs from '@/components/smoothui/animated-tabs';
import { AnimatedGroup } from '@/components/tailark/animated-group';
import { SurveyStepper } from '@/components/survey-stepper';
import { QuestionField } from '@/components/question-field';
import { copy } from '@/lib/copy';
import { t, activeSections, cleanAnswers, questionValid, skus, stockOptions, type Answers, type Answer, type Language, type Mode, type Question } from '@/lib/questionnaire';
import { type QuestionLanguages, type Interview } from '@/lib/storage';
import { fixedMode } from '@/lib/deployment';
import { publishResponse } from '@/lib/windev';

type View='home'|'survey'|'review';
export function SurveyApp() {
 const [lang,setLang]=useState<Language>('fr');
 const [mode,setMode]=useState<Mode>(fixedMode??'consumer');
 const [view,setView]=useState<View>(fixedMode?'survey':'home');
 const [a,setAnswers]=useState<Answers>({});
 const [questionLanguages,setQuestionLanguages]=useState<QuestionLanguages>({});
 const [activeId,setActiveId]=useState(fixedMode==='retailer'?'context':'intention');
 const [eligible,setEligible]=useState(false);
 const [gateError,setGateError]=useState(false);
 const [invalid,setInvalid]=useState<string[]>([]);
 const [bridgeError,setBridgeError]=useState(false);
 const [sent,setSent]=useState(false);
 const sentRef=useRef(false);
 const pending=useRef<Interview|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const c=(key:keyof typeof copy)=>copy[key][lang];
 const sections=activeSections(mode,a);
 const sectionIndex=Math.max(0,sections.findIndex(s=>s.id===activeId));
 const current=sections[sectionIndex];
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';},[lang]);
 useEffect(()=>{
  const reset=(event:PageTransitionEvent)=>{
   if(!event.persisted)return;
   setAnswers({});setQuestionLanguages({});setEligible(false);setGateError(false);setInvalid([]);setBridgeError(false);setSent(false);sentRef.current=false;pending.current=null;
   setActiveId(mode==='retailer'?'context':'intention');setView(fixedMode?'survey':'home');
  };
  window.addEventListener('pageshow',reset);
  return ()=>window.removeEventListener('pageshow',reset);
 },[mode]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});heading.current?.focus();},[activeId,view]);
 const setAnswer=(id:string,value:Answer)=>{setAnswers(d=>({...d,[id]:value}));setQuestionLanguages(l=>({...l,[id.replace('-other','')]:lang}));setInvalid(v=>v.filter(x=>x!==id&&x!==id.replace('-other','')));};
 const navigate=(v:View)=>{setView(v);setInvalid([]);};
 const start=()=>{setAnswers({});setQuestionLanguages({});setActiveId(mode==='retailer'?'context':'intention');navigate('survey');};
 const next=()=>{if(mode==='consumer'&&!eligible){setGateError(true);return;}const bad=current.questions.filter(q=>!questionValid(q,a)).map(q=>q.id);setInvalid(bad);if(bad.length){document.getElementById(`question-${bad[0]}`)?.scrollIntoView({behavior:'smooth',block:'center'});return;}if(sectionIndex<sections.length-1)setActiveId(sections[sectionIndex+1].id);else navigate('review');};
 const confirm=()=>{
  if(sentRef.current)return;
  if(mode==='consumer'&&!eligible){setGateError(true);setActiveId(sections[0].id);setView('survey');return;}
  const bad=sections.find(s=>s.questions.some(q=>!questionValid(q,a)));
  if(bad){setActiveId(bad.id);setInvalid(bad.questions.filter(q=>!questionValid(q,a)).map(q=>q.id));setView('survey');return;}
  const record=pending.current??{id:crypto.randomUUID(),mode,language:lang,completedAt:new Date().toISOString(),answers:cleanAnswers(mode,a),questionLanguages,schemaVersion:1 as const};
  pending.current=record;
  sentRef.current=true;
  const ok=publishResponse(record);
  sentRef.current=ok;setSent(ok);setBridgeError(!ok);
 };
 const summary=(q:Question,answers:Answers):React.ReactNode=>{
  const v=answers[q.id];
  if(q.type==='sku')return <bdi>{skus.find(s=>s.id===v)?.name}</bdi>;
  if(q.type==='stock'||q.type==='substitution')return <div className="review-grid">{Object.entries(v as Record<string,string>).filter(([,x])=>x).map(([key,val])=>{
   const sku=skus.find(s=>s.id===key.replace(/-(second|other)$/,''));
   const label=sku?.name+(key.endsWith('-second')?` · ${c('secondary')}`:key.endsWith('-other')?` · ${c('specify')}`:'');
   const display=q.type==='stock'?stockOptions.find(o=>o.id===val)?.label[lang]:q.type==='substitution'?(skus.find(s=>s.id===val)?.name??(val==='other'?c('otherBrand'):val==='none'?c('none'):val)):val;
   return <div key={key}><bdi>{label}</bdi><bdi>{display}</bdi></div>;
  })}</div>;
  const vals=Array.isArray(v)?v:[v];return vals.map((x,i)=><span key={i} className="review-answer"><bdi>{q.options?.find(o=>o.id===x)?.label[lang]??String(x)}</bdi>{x==='other'&&<> — {String(answers[q.id+'-other'])}</>}</span>);
 };
 return <MotionConfig reducedMotion="user"><div className="app-shell"><div className="workspace">
  <a className="skip-link" href="#main">{c('review')}</a>
  <header className="sticky-header"><div className="topbar">
   <span className="brand-logo"><img src={(process.env.NEXT_PUBLIC_BASE_PATH || '')+'/brand/jti-logo.png'} alt="JTI" width={1335} height={1214}/></span>
   {view!=='home'&&<SurveyStepper sections={sections} answers={a} lang={lang} activeId={view==='survey'?current.id:'review'} finished={sent} onSelect={id=>{if(pending.current)return;if(id==='review')navigate('review');else{setActiveId(id);navigate('survey');}}}/>}
  </div></header>
  <main id="main" role="tabpanel" aria-labelledby={`language-tab-${lang}`} className="main-content">
   <div className="survey-heading"><h1 tabIndex={-1} ref={heading}>{view==='home'?c('interview'):view==='review'?c('review'):current.title[lang]}</h1>
    <AnimatedTabs ariaLabel={t('Langue','Language','اللغة')[lang]} layoutId="language" activeTab={lang} variant="pill" tabs={[{id:'fr',label:'FR'},{id:'en',label:'EN'},{id:'ar',label:'العربية'}]} onChange={v=>setLang(v as Language)} className="language-tabs"/>
   </div>
   {view==='home'&&!fixedMode&&<section className="start-section"><AnimatedGroup preset="fade" className="mode-cards">{(['consumer','retailer'] as Mode[]).map(m=>{const Icon=m==='consumer'?Users:Store;return <button key={m} className={`mode-card ${mode===m?'chosen':''}`} onClick={()=>setMode(m)} aria-pressed={mode===m}><span className="mode-icon"><Icon size={24} strokeWidth={1.5}/></span><div className="mode-title"><h2>{c(m)}</h2></div><span className="mode-radio">{mode===m&&<Check size={13}/>}</span></button>;})}</AnimatedGroup><div className="start-footer"><Button className="primary-button" onClick={start}>{c('start')}<ArrowRight className="directional"/></Button></div></section>}
   {view==='survey'&&<div className="form-sheet"><form onSubmit={e=>{e.preventDefault();next();}} noValidate>
    {mode==='consumer'&&sectionIndex===0&&<div className="question"><label className={`eligibility ${gateError?'invalid':''}`}><input type="checkbox" checked={eligible} onChange={e=>{setEligible(e.target.checked);setGateError(false);}}/><span>{c('gate')}</span></label>{gateError&&<p className="field-error" role="alert">{c('eligibility')}</p>}</div>}
    {current.questions.map(q=><QuestionField key={q.id} question={q} answers={a} lang={lang} set={setAnswer} invalid={invalid.includes(q.id)}/>)}
    <div className="form-navigation">{sectionIndex>0&&<Button type="button" variant="ghost" onClick={()=>{setActiveId(sections[sectionIndex-1].id);setInvalid([]);}}><ArrowLeft className="directional"/>{c('back')}</Button>}<Button type="submit" size="lg" className="primary-button">{sectionIndex===sections.length-1?c('review'):c('next')}<ArrowRight className="directional"/></Button></div>
   </form></div>}
   {view==='review'&&<><div className="review-sections">{sections.map(s=><section className="review-section" key={s.id}><header><h2>{s.title[lang]}</h2>{!pending.current&&<Button variant="ghost" onClick={()=>{setActiveId(s.id);navigate('survey');}}>{c('edit')}<ArrowUpRight size={14}/></Button>}</header>{s.questions.map(q=><div className="review-row" key={q.id}><div><bdi className="review-code">{q.id}</bdi><p>{q.text[lang]}</p></div><div>{summary(q,a)}</div></div>)}</section>)}</div>
    <div className="review-footer">{!pending.current&&<Button variant="outline" onClick={()=>navigate('survey')}><ArrowLeft className="directional"/>{c('back')}</Button>}<Button className="primary-button" size="lg" onClick={confirm} disabled={sent}>{sent?c('confirmed'):bridgeError?c('retry'):c('confirm')}<Check size={17}/></Button></div>
    {bridgeError&&<p className="field-error" role="alert">{c('bridgeError')}</p>}
   </>}
  </main>
 </div></div></MotionConfig>;
}
