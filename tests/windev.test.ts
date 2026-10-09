import assert from 'node:assert/strict';
import test from 'node:test';
import { publishResponse } from '../lib/windev';
import type { Interview } from '../lib/storage';
const record:Interview={id:'fixed-id',mode:'consumer',language:'fr',completedAt:'2026-10-09T11:00:00Z',schemaVersion:1,questionLanguages:{Q1:'fr',Q2:'en'},answers:{Q1:'mbo-red',Q2:'both'}};
test('WinDev receives the JSON through Reponse exactly as Camel sends Score',()=>{
 const original=globalThis.window;
 const calls:[string,string][]=[];
 const mock={WL:{calls,Execute(this:{calls:[string,string][]},procedure:string,json:string){this.calls.push([procedure,json]);}}};
 Object.defineProperty(globalThis,'window',{configurable:true,value:mock});
 try {
  assert.equal(publishResponse(record),true);assert.equal(calls.length,1);assert.equal(calls[0][0],'Reponse');
  const payload=JSON.parse(calls[0][1]);assert.equal(payload.id,'fixed-id');assert.equal(payload.answers.Q1.answer,'MBO Red');assert.equal(payload.answers.Q2.language,'en');assert.equal(payload.questionLanguages,undefined);
  assert.equal(calls.length,1);
 }finally{Object.defineProperty(globalThis,'window',{configurable:true,value:original});}
});
test('bridge failure allows retrying the same saved interview; ordinary browsers work',()=>{
 const original=globalThis.window;
 const mock:{WL?:{Execute:(procedure:string,json:string)=>void}}={WL:{Execute(){throw new Error('bridge unavailable');}}};
 Object.defineProperty(globalThis,'window',{configurable:true,value:mock});
 try {
  assert.equal(publishResponse(record),false);
  let sent='';mock.WL!.Execute=(_procedure,json)=>{sent=json;};assert.equal(publishResponse(record),true);assert.equal(JSON.parse(sent).id,'fixed-id');
  delete mock.WL;assert.equal(publishResponse(record),true);
 }finally{Object.defineProperty(globalThis,'window',{configurable:true,value:original});}
});
