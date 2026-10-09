import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeResponse, publishResponse } from '../lib/windev';
import type { Interview } from '../lib/storage';
const record:Interview={id:'fixed-id',mode:'consumer',language:'fr',completedAt:'2026-10-09T11:00:00Z',schemaVersion:1,questionLanguages:{Q1:'fr',Q2:'en'},answers:{Q1:'mbo-red',Q2:'both'}};
test('WinDev receives one interview as JSON and can pull it without resending',()=>{
 const original=globalThis.window;
 const calls:[string,string][]=[];
 const mock={WL:{calls,Execute(this:{calls:[string,string][]},procedure:string,json:string){this.calls.push([procedure,json]);}},reponse:undefined as (()=>string|null)|undefined};
 Object.defineProperty(globalThis,'window',{configurable:true,value:mock});
 try {
  initializeResponse();assert.equal(mock.reponse?.(),null);
  assert.equal(publishResponse(record),true);assert.equal(calls.length,1);assert.equal(calls[0][0],'Reponse');
  assert.equal(mock.reponse?.(),calls[0][1]);const payload=JSON.parse(calls[0][1]);assert.equal(payload.id,'fixed-id');assert.equal(payload.answers.Q1.answer,'MBO Red');assert.equal(payload.answers.Q2.language,'en');assert.equal(payload.questionLanguages,undefined);
  assert.equal(calls.length,1);initializeResponse();assert.equal(mock.reponse?.(),null);
 }finally{Object.defineProperty(globalThis,'window',{configurable:true,value:original});}
});
test('bridge failure keeps JSON for retrieval and retry; ordinary browsers work',()=>{
 const original=globalThis.window;
 const mock:{WL?:{Execute:(procedure:string,json:string)=>void};reponse?:()=>string|null}={WL:{Execute(){throw new Error('bridge unavailable');}}};
 Object.defineProperty(globalThis,'window',{configurable:true,value:mock});
 try {
  initializeResponse();assert.equal(publishResponse(record),false);assert.equal(JSON.parse(mock.reponse!()!).id,'fixed-id');
  let sent='';mock.WL!.Execute=(_procedure,json)=>{sent=json;};assert.equal(publishResponse(record),true);assert.equal(JSON.parse(sent).id,'fixed-id');
  delete mock.WL;assert.equal(publishResponse(record),true);
 }finally{Object.defineProperty(globalThis,'window',{configurable:true,value:original});}
});
