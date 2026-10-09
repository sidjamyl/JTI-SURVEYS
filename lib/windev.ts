import { interviewPayload, type Interview } from './storage';

declare global {
 interface Window {
  WL?: { Execute?: (procedure:string,json:string)=>void };
  reponse?: ()=>string|null;
 }
}
let response:string|null=null;
export function initializeResponse() {
 response=null;
 window.reponse=()=>response;
}
export function publishResponse(record:Interview):boolean {
 response=JSON.stringify(interviewPayload(record));
 window.reponse=()=>response;
 if(!window.WL?.Execute)return true;
 try {window.WL.Execute('Reponse',response);return true;}
 catch {return false;}
}
