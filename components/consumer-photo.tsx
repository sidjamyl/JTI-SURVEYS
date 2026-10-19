'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { compressPhoto, type ConsumerPhoto } from '@/lib/photo';
import type { Language } from '@/lib/questionnaire';

export function ConsumerPhotoField({photo,lang,onChange,onBusy,invalid}:{photo:ConsumerPhoto|null;lang:Language;onChange:(photo:ConsumerPhoto|null)=>void;onBusy:(busy:boolean)=>void;invalid:boolean}) {
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),request=useRef(0);
 const [cameraOpen,setCameraOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const c=(key:keyof typeof copy)=>copy[key][lang];
 const stop=()=>{stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;};
 useEffect(()=>()=>{request.current++;stop();onBusy(false);},[onBusy]);
 const openCamera=async()=>{
  const id=++request.current;setBusy(true);onBusy(true);setError(false);
  try{
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
   if(id!==request.current){media.getTracks().forEach(track=>track.stop());return;}
   stream.current=media;video.current!.srcObject=media;setCameraOpen(true);await video.current!.play();
  }catch{if(id===request.current){stop();setCameraOpen(false);setError(true);onBusy(false);}}
  finally{if(id===request.current)setBusy(false);}
 };
 const capture=async()=>{
  const id=++request.current;setBusy(true);setError(false);
  try{
   const source=video.current!,canvas=document.createElement('canvas');
   if(!source.videoWidth||!source.videoHeight)throw new Error('Camera not ready');
   const scale=Math.min(1,1024/Math.max(source.videoWidth,source.videoHeight));
   canvas.width=Math.max(1,Math.round(source.videoWidth*scale));canvas.height=Math.max(1,Math.round(source.videoHeight*scale));
   const context=canvas.getContext('2d');if(!context)throw new Error('Camera unavailable');
   context.drawImage(source,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Capture failed')),'image/jpeg',0.9));
   const result=await compressPhoto(new File([blob],'consumer.jpg',{type:'image/jpeg'}));
   if(id===request.current)onChange(result);
  }catch{if(id===request.current)setError(true);}
  finally{if(id===request.current){stop();setCameraOpen(false);setBusy(false);onBusy(false);}}
 };
 return <section className={`question consumer-photo ${invalid?'invalid':''}`} aria-labelledby="consumer-photo-title" aria-busy={busy}>
  <h2 id="consumer-photo-title" className="question-title">{c('consumerPhoto')}</h2>
  <p className="field-help">{c('photoHint')}</p>
  <video className="photo-camera" ref={video} hidden={!cameraOpen} autoPlay muted playsInline aria-label={c('cameraPreview')}/>
  <div className="photo-actions">{cameraOpen?<><Button type="button" variant="outline" disabled={busy} onClick={()=>void capture()}><Camera size={18}/>{c('capturePhoto')}</Button><Button type="button" variant="ghost" onClick={()=>{request.current++;stop();setCameraOpen(false);setBusy(false);onBusy(false);}}>{c('cancelCamera')}</Button></>:<Button type="button" variant="outline" disabled={busy} onClick={()=>void openCamera()}><Camera size={18}/>{c('takePhoto')}</Button>}</div>
  {busy&&<p role="status">{c('photoProcessing')}</p>}
  {photo&&<div className="photo-preview"><img src={`data:${photo.mimeType};base64,${photo.base64}`} alt={c('consumerPhotoAlt')}/><Button type="button" variant="ghost" disabled={busy||cameraOpen} onClick={()=>{onChange(null);setError(false);}}><X size={16}/>{c('removePhoto')}</Button></div>}
  {error&&<p className="field-error" role="alert">{c('photoError')}</p>}
  {invalid&&!photo&&<p className="field-error" role="alert">{c('photoRequired')}</p>}
 </section>;
}
