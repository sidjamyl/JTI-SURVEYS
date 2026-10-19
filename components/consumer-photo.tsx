'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { compressPhoto, type ConsumerPhoto } from '@/lib/photo';
import type { Language } from '@/lib/questionnaire';

export function ConsumerPhotoField({photo,lang,onChange,onBusy}:{photo:ConsumerPhoto|null;lang:Language;onChange:(photo:ConsumerPhoto|null)=>void;onBusy:(busy:boolean)=>void}) {
 const camera=useRef<HTMLInputElement>(null),upload=useRef<HTMLInputElement>(null);
 const request=useRef(0);
 const [busy,setBusy]=useState(false),[error,setError]=useState(false);
 const c=(key:keyof typeof copy)=>copy[key][lang];
 useEffect(()=>()=>{request.current++;onBusy(false);},[onBusy]);
 const choose=async(file:File|undefined)=>{
  if(!file)return;
  const id=++request.current;setBusy(true);onBusy(true);setError(false);
  try{const result=await compressPhoto(file);if(id===request.current)onChange(result);}
  catch{if(id===request.current)setError(true);}
  finally{if(id===request.current){setBusy(false);onBusy(false);}}
 };
 return <section className="question consumer-photo" aria-labelledby="consumer-photo-title" aria-busy={busy}>
  <h2 id="consumer-photo-title" className="question-title">{c('consumerPhoto')}</h2>
  <p className="field-help">{c('photoHint')}</p>
  <input ref={camera} type="file" accept="image/*" capture="user" hidden aria-label={c('takePhoto')} onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
  <input ref={upload} type="file" accept="image/*" hidden aria-label={c('uploadPhoto')} onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
  <div className="photo-actions"><Button type="button" variant="outline" disabled={busy} onClick={()=>camera.current?.click()}><Camera size={18}/>{c('takePhoto')}</Button><Button type="button" variant="outline" disabled={busy} onClick={()=>upload.current?.click()}><Upload size={18}/>{c('uploadPhoto')}</Button></div>
  {busy&&<p role="status">{c('photoProcessing')}</p>}
  {photo&&<div className="photo-preview"><img src={`data:${photo.mimeType};base64,${photo.base64}`} alt={c('consumerPhotoAlt')}/><Button type="button" variant="ghost" disabled={busy} onClick={()=>{onChange(null);setError(false);}}><X size={16}/>{c('removePhoto')}</Button></div>}
  {error&&<p className="field-error" role="alert">{c('photoError')}</p>}
 </section>;
}
