'use client';
import { useEffect, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { useReducedMotion } from 'motion/react';
export function FieldArt() {
 const reduced = useReducedMotion();
 const [supported,setSupported]=useState(false);
 useEffect(()=>{const canvas=document.createElement('canvas');setSupported(!!canvas.getContext('webgl2'));},[]);
 return <div className="field-art" aria-hidden="true">
  {supported && <MeshGradient colors={['#072a17','#00441d','#00bb31','#76c583']} speed={reduced?0:0.12} distortion={0.65} swirl={0.25} style={{width:'100%',height:'100%',position:'absolute',inset:0}} />}
  <svg viewBox="0 0 480 380" preserveAspectRatio="xMidYMid slice"><defs><pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="white" opacity=".16"/></pattern></defs><rect width="480" height="380" fill="url(#grain)"/>{Array.from({length:20},(_,i)=><ellipse key={i} cx="252" cy="168" rx={35+i*13} ry={42+i*13} transform="rotate(-32 252 168)" fill="none" stroke="#daffd8" strokeOpacity={.45-i*.012} strokeWidth=".7"/>)}<circle cx="252" cy="168" r="5" fill="#edffe9"/><path d="M252 146v-17m0 78v-17m-22-22h-17m78 0h-17" stroke="#edffe9" strokeWidth="1"/></svg>
  <span className="art-coordinate">36°45′ N · 3°03′ E</span><span className="art-mark">ALG / 01</span>
 </div>;
}
