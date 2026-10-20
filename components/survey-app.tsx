'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, Store, Users, Clock, X } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { Button } from '@/components/ui/button';
import AnimatedTabs from '@/components/smoothui/animated-tabs';
import { AnimatedGroup } from '@/components/tailark/animated-group';
import { SurveyStepper } from '@/components/survey-stepper';
import { QuestionField } from '@/components/question-field';
import { copy } from '@/lib/copy';
import { t, activeSections, cleanAnswers, questionValid, skus, stockOptions, type Answers, type Answer, type Language, type Mode, type Question } from '@/lib/questionnaire';
import { type QuestionLanguages, type Interview, type Participation } from '@/lib/storage';
import { publishResponse } from '@/lib/windev';

type View='home'|'intro'|'survey'|'review'|'declined';
export function SurveyApp({consumerOnly=false}:{consumerOnly?:boolean}) {
 const [lang,setLang]=useState<Language>('fr');
 const [mode,setMode]=useState<Mode>('consumer');
 const [view,setView]=useState<View>('home');
 const [participation,setParticipation]=useState<Participation|null>(null);
 const [a,setAnswers]=useState<Answers>({});
 const [questionLanguages,setQuestionLanguages]=useState<QuestionLanguages>({});
 const [activeId,setActiveId]=useState('location');
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
   setAnswers({});setQuestionLanguages({});setParticipation(null);setEligible(false);setGateError(false);setInvalid([]);setBridgeError(false);setSent(false);sentRef.current=false;pending.current=null;
   setActiveId('location');setView('home');
  };
  window.addEventListener('pageshow',reset);
  return ()=>window.removeEventListener('pageshow',reset);
 },[mode]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});heading.current?.focus();},[activeId,view]);
 const setAnswer=(id:string,value:Answer)=>{setAnswers(d=>({...d,[id]:value}));setQuestionLanguages(l=>({...l,[id.replace('-other','')]:lang}));setInvalid(v=>v.filter(x=>x!==id&&x!==id.replace('-other','')));};
 const navigate=(v:View)=>{setView(v);setInvalid([]);};
 const start=(selected:Mode)=>{if(consumerOnly&&selected==='retailer')return;setMode(selected);setAnswers({});setQuestionLanguages({});setParticipation(null);setEligible(false);setGateError(false);setBridgeError(false);setSent(false);sentRef.current=false;pending.current=null;setActiveId('location');navigate('intro');};
 const submit=(record:Interview)=>{
  if(sentRef.current)return;
  pending.current??=record;
  sentRef.current=true;
  const ok=publishResponse(pending.current);
  sentRef.current=ok;setSent(ok);setBridgeError(!ok);
 };
 const respond=(answer:Participation['answer'])=>{
  const response={answer,language:lang};setParticipation(response);
  if(answer==='yes'){navigate('survey');return;}
  submit({id:crypto.randomUUID(),mode,language:lang,completedAt:new Date().toISOString(),answers:{},participation:response,schemaVersion:1});
  navigate('declined');
 };
 const next=()=>{if(mode==='consumer'&&!eligible){setGateError(true);return;}const bad=current.questions.filter(q=>!questionValid(q,a)).map(q=>q.id);setInvalid(bad);if(bad.length){document.getElementById(`question-${bad[0]}`)?.scrollIntoView({behavior:'smooth',block:'center'});return;}if(sectionIndex<sections.length-1)setActiveId(sections[sectionIndex+1].id);else navigate('review');};
 const confirm=()=>{
  if(sentRef.current)return;
  if(participation?.answer!=='yes'){setView('intro');return;}
  if(mode==='consumer'&&!eligible){setGateError(true);setActiveId(sections[0].id);setView('survey');return;}
  const bad=sections.find(s=>s.questions.some(q=>!questionValid(q,a)));
  if(bad){setActiveId(bad.id);setInvalid(bad.questions.filter(q=>!questionValid(q,a)).map(q=>q.id));setView('survey');return;}
  const record=pending.current??{id:crypto.randomUUID(),mode,language:lang,completedAt:new Date().toISOString(),answers:cleanAnswers(mode,a),questionLanguages,participation,schemaVersion:1 as const};
  submit(record);
 };
 const summary=(q:Question,answers:Answers):React.ReactNode=>{
  const v=answers[q.id];
  if(q.type==='tel'&&!String(v??'').trim())return <span className="review-answer">{c('notProvided')}</span>;
  if(q.type==='location')return <div className="review-grid">{(['region','wilaya','commune'] as const).map(key=><div key={key}><span>{c(key)}</span><bdi>{(v as Record<string,string>)[key]}</bdi></div>)}</div>;
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
   {(view==='survey'||view==='review')&&<SurveyStepper sections={sections} answers={a} lang={lang} activeId={view==='survey'?current.id:'review'} finished={sent} onSelect={id=>{if(pending.current)return;if(id==='review')navigate('review');else{setActiveId(id);navigate('survey');}}}/>}
  </div></header>
  <main id="main" role="tabpanel" aria-labelledby={`language-tab-${lang}`} className="main-content">
   <div className="survey-heading"><h1 tabIndex={-1} ref={heading}>{view==='home'?c('choose'):view==='intro'?c('introduction'):view==='declined'?c('thankYou'):view==='review'?c('review'):current.title[lang]}</h1>
    <AnimatedTabs ariaLabel={t('Langue','Language','اللغة')[lang]} layoutId="language" activeTab={lang} variant="pill" tabs={[{id:'fr',label:'FR'},{id:'en',label:'EN'},{id:'ar',label:'العربية'}]} onChange={v=>setLang(v as Language)} className="language-tabs"/>
   </div>
   {view==='home'&&<section className="start-section welcome-panel">
    <p className="welcome-eyebrow">{c('fieldwork')}</p><p className="welcome-hint">{c('chooseHint')}</p>
    <AnimatedGroup preset="fade" className="mode-cards">{(['consumer','retailer'] as Mode[]).map(m=>{const Icon=m==='consumer'?Users:Store;return <button key={m} className="mode-card" disabled={consumerOnly&&m==='retailer'} onClick={()=>start(m)}><span className="mode-icon"><Icon size={28} strokeWidth={1.6}/></span><div className="mode-title"><h2>{c(m)}</h2><span>{c(m==='consumer'?'consumerHint':'retailerHint')}</span></div><ArrowUpRight className="mode-arrow directional" size={22}/></button>;})}</AnimatedGroup>
   </section>}
   {view==='intro'&&<section className="welcome-panel intro-panel">
    <div className="intro-badge">{mode==='consumer'?<Users size={18}/>:<Store size={18}/>}<span>{c(mode)}</span><span className="intro-duration"><Clock size={14}/><bdi>{mode==='consumer'?'3–5':'4–6'}</bdi> {c('minutes')}</span></div>
    <p className="intro-text">{c(mode==='consumer'?'introConsumer':'introRetailer')}</p>
    <div className="consent-actions"><Button className="primary-button" size="lg" onClick={()=>respond('yes')}>{c('yes')}<Check size={19}/></Button><Button variant="outline" size="lg" onClick={()=>respond('no')}>{c('no')}<X size={18}/></Button></div>
    <Button variant="ghost" className="intro-back" onClick={()=>navigate('home')}><ArrowLeft className="directional" size={16}/>{c('back')}</Button>
   </section>}
   {view==='declined'&&<section className="welcome-panel declined-panel"><span className="declined-icon"><Check size={28}/></span><p>{bridgeError?c('bridgeError'):c('declined')}</p>{bridgeError&&<Button className="primary-button" onClick={()=>pending.current&&submit(pending.current)}>{c('retry')}<ArrowRight className="directional" size={17}/></Button>}</section>}
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
