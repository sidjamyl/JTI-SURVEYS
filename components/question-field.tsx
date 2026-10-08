'use client';
import { useState } from 'react';
import { Check, Search, Package, Minus, Plus } from 'lucide-react';
import productImages from '@/public/products/images.json';
import { copy } from '@/lib/copy';
import { flaggedSkus, skus, stockOptions, type Answers, type Answer, type Question, type Language } from '@/lib/questionnaire';
export function ProductVisual({id,small=false,lang}:{id:string;small?:boolean;lang:Language}) {
 const sku=skus.find(s=>s.id===id)!;
 const [missing,setMissing]=useState(!(productImages as Record<string,string>)[id]);
 return <div className={`product-visual ${small?'small':''}`} style={{'--product-color':sku.color} as React.CSSProperties}>
  {!missing && <img src={(productImages as Record<string,string>)[id]} alt={sku.name} onError={()=>setMissing(true)} loading="lazy" />}
  {missing && <><Package size={small?19:27} strokeWidth={1}/>{!small&&<span>{copy.photoPending[lang]}</span>}</>}
 </div>;
}
export function QuestionField({question:q,answers:a,lang,set,invalid}:{question:Question;answers:Answers;lang:Language;set:(id:string,value:Answer)=>void;invalid:boolean}) {
 const [search,setSearch]=useState('');
 const value=a[q.id];
 const c=(key:keyof typeof copy)=>copy[key][lang];
 const grid=(value&&typeof value==='object'&&!Array.isArray(value)?value:{}) as Record<string,string>;
 const setGrid=(id:string,v:string)=>set(q.id,{...grid,[id]:v});
 const hasOther=value==='other'||(Array.isArray(value)&&value.includes('other'));
 return <fieldset className={`question ${invalid?'invalid':''}`} id={`question-${q.id}`} aria-describedby={invalid?`${q.id}-error`:undefined}>
  <legend><span className="question-meta"><bdi>{q.id}</bdi><span>{q.type==='multi'?(q.max?c('max'):c('multi')):q.type==='stock'||q.type==='substitution'?c('catalogue'):c('one')}</span></span><span className="question-title">{q.text[lang]}</span></legend>
  {(q.type==='single'||q.type==='multi')&&<div className={`answer-options ${q.options!.length<=4?'compact':''}`}>
   {q.options!.map(option=>{const checked=q.type==='multi'?Array.isArray(value)&&value.includes(option.id):value===option.id;const limit=q.type==='multi'&&!checked&&!!q.max&&Array.isArray(value)&&value.length>=q.max;return <label className={`answer-option ${checked?'selected':''} ${limit?'at-limit':''}`} key={option.id}>
    <input type={q.type==='multi'?'checkbox':'radio'} name={q.id} value={option.id} checked={checked} disabled={limit} onChange={()=>set(q.id,q.type==='multi'?(checked?(value as string[]).filter(v=>v!==option.id):[...(Array.isArray(value)?value:[]),option.id]):option.id)}/>
    <span className={`choice-mark ${q.type==='multi'?'square':''}`}>{checked&&<Check size={13}/>}</span><span><bdi>{option.label[lang]}</bdi></span>
   </label>;})}
  </div>}
  {q.type==='sku'&&<><div className="product-search"><Search size={17}/><input aria-label={c('search')} placeholder={c('search')} value={search} onChange={e=>setSearch(e.target.value)} /></div><div className="product-grid">
   {skus.filter(s=>(s.name+' '+s.brand).toLowerCase().includes(search.trim().toLowerCase())).map(s=><label key={s.id} className={`product-card ${value===s.id?'selected':''}`}><input type="radio" name={q.id} checked={value===s.id} onChange={()=>set(q.id,s.id)}/><span className="product-check">{value===s.id?<Check size={12}/>:null}</span><ProductVisual id={s.id} lang={lang}/><span className="product-brand"><bdi>{s.brand}</bdi></span><span className="product-name"><bdi>{s.name}</bdi></span></label>)}
  </div>{!skus.some(s=>(s.name+' '+s.brand).toLowerCase().includes(search.trim().toLowerCase()))&&<p className="empty-search">{c('noResults')}</p>}</>}
  {q.type==='number'&&<><div className="number-field"><button type="button" aria-label="−1" disabled={!value||Number(value)<=q.min!} onClick={()=>set(q.id,String(Number(value)-1))}><Minus size={19}/></button><input type="number" min={q.min} max={q.max} step="1" value={typeof value==='string'?value:''} aria-label={q.text[lang]} onChange={e=>set(q.id,e.target.value)} /><button type="button" aria-label="+1" disabled={!!value&&Number(value)>=q.max!} onClick={()=>set(q.id,String(value?Number(value)+1:q.min))}><Plus size={19}/></button></div><p className="field-help">{c('between')} {q.min} {c('and')} {q.max}.</p></>}
  {q.type==='scale'&&<><div className="scale-options">{[1,2,3,4,5].map(n=><label className={value===String(n)?'selected':''} key={n}><input type="radio" name={q.id} checked={value===String(n)} onChange={()=>set(q.id,String(n))}/><span>{n}</span></label>)}</div><div className="scale-labels"><span>{c('unlikely')}</span><span>{c('likely')}</span></div></>}
  {q.type==='context'&&<div className="context-fields">{(['wilaya','city','pos'] as const).map(key=><label key={key}>{c(key)}<input maxLength={120} autoComplete="off" value={grid[key]??''} onChange={e=>setGrid(key,e.target.value)} /></label>)}</div>}
  {q.type==='stock'&&<div className="stock-grid">{skus.map(s=><div className="stock-row" key={s.id}><div className="stock-product"><ProductVisual id={s.id} small lang={lang}/><div><span className="product-brand"><bdi>{s.brand}</bdi></span><strong><bdi>{s.name}</bdi></strong></div></div><label className="sr-only" htmlFor={`stock-${s.id}`}>{s.name}</label><select id={`stock-${s.id}`} className={grid[s.id]?'has-value':''} value={grid[s.id]??''} onChange={e=>setGrid(s.id,e.target.value)}><option value="">{c('select')}</option>{stockOptions.map(o=><option key={o.id} value={o.id}>{o.label[lang]}</option>)}</select></div>)}</div>}
  {q.type==='substitution'&&<><p className="field-help">{c('flagged')}</p><div className="substitution-grid">{flaggedSkus(a).map(s=><div className="substitution-row" key={s.id}><div className="stock-product"><ProductVisual id={s.id} small lang={lang}/><strong><bdi>{s.name}</bdi></strong></div><div className="substitution-fields">{['','-second'].map(suffix=><label key={suffix}>{suffix?c('secondary'):c('primary')}<select value={grid[s.id+suffix]??''} onChange={e=>setGrid(s.id+suffix,e.target.value)}><option value="">{c('select')}</option>{skus.filter(x=>x.id!==s.id&&(suffix?x.id!==grid[s.id]:true)).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}<option value="other">{c('otherBrand')}</option><option value="none">{c('none')}</option></select></label>)}{[grid[s.id],grid[s.id+'-second']].includes('other')&&<label>{c('specify')}<input value={grid[s.id+'-other']??''} maxLength={400} onChange={e=>setGrid(s.id+'-other',e.target.value)}/></label>}</div></div>)}</div></>}
  {hasOther&&<label className="other-field">{c('specify')}<input maxLength={400} value={typeof a[q.id+'-other']==='string'?String(a[q.id+'-other']):''} onChange={e=>set(q.id+'-other',e.target.value)}/></label>}
  {invalid&&<p className="field-error" id={`${q.id}-error`} role="alert">{c('required')}</p>}
 </fieldset>;
}
