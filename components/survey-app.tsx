'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, ClipboardList, Download, Plus, ShieldCheck, Store, Users, FolderOpen } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { Button } from '@/components/ui/button';
import AnimatedTabs from '@/components/smoothui/animated-tabs';
import { AnimatedGroup } from '@/components/tailark/animated-group';
import { SurveyStepper } from '@/components/survey-stepper';
import { QuestionField } from '@/components/question-field';
import { copy } from '@/lib/copy';
import { t } from '@/lib/questionnaire';
import { activeSections, cleanAnswers, questionValid, skus, stockOptions, type Answers, type Answer, type Language, type Mode, type Question } from '@/lib/questionnaire';
import { DRAFT_KEY, RECORD_KEY, download, interviewsCsv, isAnswers, isInterview, type Interview } from '@/lib/storage';

type View='home'|'survey'|'review'|'success'|'records'|'record';
export function SurveyApp() {
 const [lang,setLang]=useState<Language>('fr');
 const [mode,setMode]=useState<Mode>('consumer');
 const [view,setView]=useState<View>('home');
 const [drafts,setDrafts]=useState<Record<Mode,Answers>>({consumer:{},retailer:{}});
 const [activeId,setActiveId]=useState('intention');
 const [eligible,setEligible]=useState(false);
 const [gateError,setGateError]=useState(false);
 const [invalid,setInvalid]=useState<string[]>([]);
 const [records,setRecords]=useState<Interview[]>([]);
 const [selectedRecord,setSelectedRecord]=useState<Interview|null>(null);
 const [storageOk,setStorageOk]=useState(true);
 const [ready,setReady]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null);
 const c=(key:keyof typeof copy)=>copy[key][lang];
 const a=drafts[mode];
 const sections=activeSections(mode,a);
 const sectionIndex=Math.max(0,sections.findIndex(s=>s.id===activeId));
 const current=sections[sectionIndex];
 const dateFormat=new Intl.DateTimeFormat(lang==='ar'?'ar-DZ':lang==='fr'?'fr-FR':'en-GB',{dateStyle:'medium',timeStyle:'short'});
 useEffect(()=>{
  try {
   const rawDrafts=localStorage.getItem(DRAFT_KEY);const rawRecords=localStorage.getItem(RECORD_KEY);
   if(rawDrafts){const d=JSON.parse(rawDrafts);if(!isAnswers(d.consumer)||!isAnswers(d.retailer))throw new Error('Invalid draft');setDrafts(d);}
   if(rawRecords){const r=JSON.parse(rawRecords);if(!Array.isArray(r)||!r.every(isInterview))throw new Error('Invalid records');setRecords(r);}
   const storedLanguage=localStorage.getItem('jti-pulse-language');if(['fr','en','ar'].includes(storedLanguage??''))setLang(storedLanguage as Language);
  }catch{setStorageOk(false);}finally{setReady(true);}
 },[]);
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';if(ready&&storageOk)try{localStorage.setItem('jti-pulse-language',lang);}catch{setStorageOk(false);}},[lang,ready,storageOk]);
 useEffect(()=>{if(ready&&storageOk)try{localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts));}catch{setStorageOk(false);}},[drafts,ready,storageOk]);
 useEffect(()=>{if(view==='survey'||view==='review'||view==='success'){window.scrollTo({top:0,behavior:'instant'});heading.current?.focus();}},[activeId,view]);
 const setAnswer=(id:string,value:Answer)=>{setDrafts(d=>({...d,[mode]:{...d[mode],[id]:value}}));setInvalid(v=>v.filter(x=>x!==id&&x!==id.replace('-other','')));};
 const navigate=(v:View)=>{setView(v);setInvalid([]);};
 const start=()=>{if(mode==='consumer'&&!eligible){setGateError(true);return;}setActiveId(sections.find(s=>s.questions.some(q=>!questionValid(q,a)))?.id??sections[0].id);navigate('survey');};
 const next=()=>{const bad=current.questions.filter(q=>!questionValid(q,a)).map(q=>q.id);setInvalid(bad);if(bad.length){document.getElementById(`question-${bad[0]}`)?.scrollIntoView({behavior:'smooth',block:'center'});return;}if(sectionIndex<sections.length-1)setActiveId(sections[sectionIndex+1].id);else navigate('review');};
 const save=()=>{
  const bad=sections.find(s=>s.questions.some(q=>!questionValid(q,a)));
  if(bad){setActiveId(bad.id);setInvalid(bad.questions.filter(q=>!questionValid(q,a)).map(q=>q.id));setView('survey');return;}
  const record:Interview={id:crypto.randomUUID(),mode,language:lang,completedAt:new Date().toISOString(),answers:cleanAnswers(mode,a),schemaVersion:1};
  try {if(!storageOk)throw new Error('Storage unavailable');const latestRaw=localStorage.getItem(RECORD_KEY);const latest=latestRaw?JSON.parse(latestRaw):[];if(!Array.isArray(latest)||!latest.every(isInterview))throw new Error('Invalid records');const updated=[record,...latest];localStorage.setItem(RECORD_KEY,JSON.stringify(updated));setRecords(updated);setSelectedRecord(record);setDrafts(d=>({...d,[mode]:{}}));navigate('success');}
  catch{setStorageOk(false);}
 };
 const exportRecords=(format:'json'|'csv')=>download(`jti-algeria-interviews.${format}`,format==='json'?JSON.stringify(records,null,2):interviewsCsv(records),format==='json'?'application/json':'text/csv;charset=utf-8');
 const exportDraft=()=>download('jti-algeria-draft.json',JSON.stringify({mode,language:lang,status:'draft',answers:a},null,2),'application/json');
 const summary=(q:Question,answers:Answers):React.ReactNode=>{
  const v=answers[q.id];
  if(q.type==='sku')return <bdi>{skus.find(s=>s.id===v)?.name}</bdi>;
  if(q.type==='stock'||q.type==='substitution'||q.type==='context')return <div className="review-grid">{Object.entries(v as Record<string,string>).filter(([,x])=>x).map(([key,val])=>{
   const sku=skus.find(s=>s.id===key.replace(/-(second|other)$/,''));
   const label=q.type==='context'?copy[key as 'wilaya'|'city'|'pos']?.[lang]:sku?.name+(key.endsWith('-second')?` · ${c('secondary')}`:key.endsWith('-other')?` · ${c('specify')}`:'');
   const display=q.type==='stock'?stockOptions.find(o=>o.id===val)?.label[lang]:q.type==='substitution'?(skus.find(s=>s.id===val)?.name??(val==='other'?c('otherBrand'):val==='none'?c('none'):val)):val;
   return <div key={key}><bdi>{label}</bdi><bdi>{display}</bdi></div>;
  })}</div>;
  const vals=Array.isArray(v)?v:[v];return vals.map((x,i)=><span key={i} className="review-answer"><bdi>{q.options?.find(o=>o.id===x)?.label[lang]??String(x)}</bdi>{x==='other'&&<> — {String(answers[q.id+'-other'])}</>}</span>);
 };
 const shownAnswers=view==='record'&&selectedRecord?selectedRecord.answers:a;
 const shownSections=view==='record'&&selectedRecord?activeSections(selectedRecord.mode,shownAnswers):sections;
 return <MotionConfig reducedMotion="user"><div className="app-shell">
  <a className="skip-link" href="#main">{c('interview')}</a>
  <div className="workspace">
   <div className="sticky-header">
    <header className="topbar">
     <button className="brand" onClick={()=>navigate('home')} aria-label={`JTI — ${c('home')}`}><span className="brand-logo"><img src={(process.env.NEXT_PUBLIC_BASE_PATH || '')+'/brand/jti-logo.png'} alt="JTI" width={1335} height={1214}/></span><span className="brand-name">Retail Pulse</span></button>
     <nav className="main-nav" aria-label={c('fieldwork')}><button className={['home','survey','review','success'].includes(view)?'active':''} onClick={()=>navigate('home')}><Plus size={16}/><span>{c('interview')}</span></button><button className={['records','record'].includes(view)?'active':''} onClick={()=>navigate('records')}><FolderOpen size={16}/><span>{c('records')}</span><span className="nav-count">{records.length}</span></button></nav>
     <AnimatedTabs ariaLabel={t('Langue','Language','اللغة')[lang]} layoutId="language" activeTab={lang} variant="pill" tabs={[{id:'fr',label:'FR'},{id:'en',label:'EN'},{id:'ar',label:'العربية'}]} onChange={v=>setLang(v as Language)} className="language-tabs"/>
    </header>
    {['survey','review','success'].includes(view)&&<SurveyStepper sections={view==='success'&&selectedRecord?activeSections(mode,selectedRecord.answers):sections} answers={view==='success'&&selectedRecord?selectedRecord.answers:a} lang={lang} activeId={view==='survey'?current.id:'review'} finished={view==='success'} onSelect={id=>{if(id==='review')navigate('review');else{setActiveId(id);navigate('survey');}}}/>}
   </div>
   <main id="main" role="tabpanel" aria-labelledby={`language-tab-${lang}`} className={`main-content ${view==='survey'?'survey-content':''}`}>
    {view==='home'&&<>
     <section className="start-section"><h1>{c('interview')}</h1><AnimatedGroup preset="fade" className="mode-cards">{(['consumer','retailer'] as Mode[]).map(m=>{const Icon=m==='consumer'?Users:Store;return <button key={m} className={`mode-card ${mode===m?'chosen':''}`} onClick={()=>{setMode(m);setGateError(false);}} aria-pressed={mode===m}><span className="mode-icon"><Icon size={24} strokeWidth={1.5}/></span><div className="mode-title"><h2>{c(m)}</h2><span><bdi>{m==='consumer'?'3–5':'4–6'}</bdi> {c('minutes')}</span></div><span className="mode-radio">{mode===m&&<Check size={13}/>}</span></button>;})}</AnimatedGroup>
      {mode==='consumer'&&<label className={`eligibility ${gateError?'invalid':''}`}><input type="checkbox" checked={eligible} onChange={e=>{setEligible(e.target.checked);setGateError(false);}}/><span>{c('gate')}</span></label>}{gateError&&<p className="field-error" role="alert">{c('eligibility')}</p>}
      <div className="start-footer"><Button size="lg" className="primary-button" disabled={!ready} onClick={start}>{Object.keys(a).length?c('resume'):c('start')}<ArrowRight className="directional" size={18}/></Button></div>
     </section>
    </>}
    {view==='survey'&&<><div className="survey-heading"><h1 tabIndex={-1} ref={heading}>{current.title[lang]}</h1></div><div className="form-sheet"><form onSubmit={e=>{e.preventDefault();next();}} noValidate>{current.questions.map(q=><QuestionField key={q.id} question={q} answers={a} lang={lang} set={setAnswer} invalid={invalid.includes(q.id)}/>)}<div className="form-navigation"><Button type="button" variant="ghost" onClick={()=>{if(sectionIndex)setActiveId(sections[sectionIndex-1].id);else navigate('home');setInvalid([]);}}><ArrowLeft className="directional"/>{c('back')}</Button><Button type="submit" size="lg" className="primary-button">{sectionIndex===sections.length-1?c('review'):c('next')}<ArrowRight className="directional"/></Button></div></form></div><button className="draft-export" onClick={exportDraft}><Download size={14}/>{c('exportDraft')}</button></>}
    {(view==='review'||view==='record')&&<><div className="survey-heading"><h1 ref={heading} tabIndex={-1}>{c('review')}</h1>{view==='record'&&selectedRecord&&<p>{dateFormat.format(new Date(selectedRecord.completedAt))}</p>}</div><div className="review-sections">{shownSections.map(s=><section className="review-section" key={s.id}><header><h2>{s.title[lang]}</h2>{view==='review'&&<Button variant="ghost" onClick={()=>{setActiveId(s.id);navigate('survey');}}>{c('edit')}<ArrowUpRight size={14}/></Button>}</header>{s.questions.map(q=><div className="review-row" key={q.id}><div><span className="review-code">{q.id}</span><p>{q.text[lang]}</p></div><div>{summary(q,shownAnswers)}</div></div>)}</section>)}</div><div className="review-footer"><Button variant="outline" onClick={()=>navigate(view==='record'?'records':'survey')}><ArrowLeft className="directional"/>{c('back')}</Button>{view==='review'&&<Button className="primary-button" size="lg" onClick={save} disabled={!storageOk}>{c('save')}<Check size={17}/></Button>}</div>{!storageOk&&<Button variant="outline" onClick={exportDraft}>{c('exportDraft')}<Download size={16}/></Button>}</>}
    {view==='success'&&<div className="success-panel"><span className="success-icon"><Check strokeWidth={1.5} size={38}/></span><h1 ref={heading} tabIndex={-1}>{c('success')}</h1>{selectedRecord&&<div className="receipt"><span>{c(mode)}</span><bdi>{selectedRecord.id.slice(0,8).toUpperCase()}</bdi><span>{dateFormat.format(new Date(selectedRecord.completedAt))}</span></div>}<div className="success-actions"><Button variant="outline" onClick={()=>exportRecords('json')}><Download size={16}/>{c('export')}</Button><Button className="primary-button" onClick={()=>{setEligible(false);navigate('home');}}>{c('new')}<Plus size={16}/></Button></div></div>}
    {view==='records'&&<><div className="section-heading records-heading"><div><h1>{c('records')}</h1><p>{records.length} {c('recorded')}</p></div>{records.length>0&&<div className="export-buttons"><Button variant="outline" onClick={()=>exportRecords('csv')}><Download size={15}/>CSV</Button><Button className="primary-button" onClick={()=>exportRecords('json')}><Download size={15}/>JSON</Button></div>}</div>{records.length?<div className="records-list">{records.map(r=><button key={r.id} className="record-row" onClick={()=>{setSelectedRecord(r);navigate('record');}}><span className="record-icon">{r.mode==='consumer'?<Users size={19}/>:<Store size={19}/>}</span><div><strong>{c(r.mode)}</strong><span>{dateFormat.format(new Date(r.completedAt))}</span></div><bdi className="record-id">{r.id.slice(0,8).toUpperCase()}</bdi><span className="complete-tag"><Check size={12}/>{c('completed')}</span><ArrowUpRight size={18}/></button>)}</div>:<div className="empty-state"><ClipboardList size={42} strokeWidth={1}/><h2>{c('empty')}</h2><Button className="primary-button" onClick={()=>navigate('home')}>{c('start')}<ArrowRight className="directional"/></Button></div>}</>}
    {!storageOk&&<div className="storage-alert" role="alert"><ShieldCheck size={18}/><span>{c('localError')}</span><button onClick={exportDraft}>{c('exportDraft')}</button></div>}
    {storageOk&&<footer className="page-footer"><ShieldCheck size={14}/><span>{c('localShort')}</span></footer>}
   </main>
  </div>
 </div></MotionConfig>;
}
