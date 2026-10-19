import assert from 'node:assert/strict';
import test from 'node:test';
import {isConsumerPhoto,MAX_PHOTO_BASE64_LENGTH} from '../lib/photo';
import {consumerSections,type Answers} from '../lib/questionnaire';
import {interviewPayload,isInterview,type Interview} from '../lib/storage';
const photo={mimeType:'image/jpeg' as const,base64:'/9j/AAAA'};
test('photo payload is bounded JPEG Base64 and only accompanies a consumer interview',()=>{
 assert.ok(isConsumerPhoto(photo));
 assert.ok(isConsumerPhoto({...photo,base64:'/9j/'+'A'.repeat(MAX_PHOTO_BASE64_LENGTH-4)}));
 for(const invalid of [null,{}, {...photo,mimeType:'image/png'},{...photo,base64:'data:image/jpeg;base64,/9j/AAAA'},{...photo,base64:'/9j/ A=='},{...photo,base64:'/9j/A'},{...photo,base64:'/9j/'+'A'.repeat(MAX_PHOTO_BASE64_LENGTH)}])assert.ok(!isConsumerPhoto(invalid));
 const record:Interview={id:'photo',mode:'consumer',language:'ar',completedAt:'2026-10-19T10:00:00Z',participation:{answer:'yes',language:'ar'},schemaVersion:1,answers:{},photo};
 const answers=Object.fromEntries(consumerSections.flatMap(s=>s.questions).map(q=>[q.id,q.type==='location'?{region:'Centre',wilaya:'ALGER',commune:'AIN BENIAN'}:q.type==='sku'?'mbo-red':q.type==='tel'?'0555123456':q.type==='multi'?[q.options![0].id]:q.options?.[0].id??String(q.min??1)])) as Answers;answers.Q5='later';
 assert.equal(isInterview({...record,answers}),true);assert.equal(isInterview({...record,answers,photo:undefined}),false);
 assert.deepEqual(interviewPayload(record).photo,photo);
 assert.equal(isInterview({...record,photo:undefined}),false);
 assert.ok(!('photo' in interviewPayload({...record,photo:undefined})));
 assert.ok(!('photo' in interviewPayload({...record,mode:'retailer'})));
 assert.ok(!('photo' in interviewPayload({...record,participation:{answer:'no',language:'ar'}})));
});
