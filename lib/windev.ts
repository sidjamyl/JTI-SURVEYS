import { interviewPayload, type Interview } from './storage';

declare global {
 interface Window {
  WL?: { Execute?: (procedure:string,json:string)=>void };
 }
}
export function publishResponse(record:Interview):boolean {
 const winDev=window.WL;
 const execute=winDev?.Execute;
 if(!execute)return true;
 const json=JSON.stringify(interviewPayload(record));
 try {execute.call(winDev,'Reponse',json);return true;}
 catch {return false;}
}
