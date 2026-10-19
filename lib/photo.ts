export const MAX_PHOTO_BASE64_LENGTH=256*1024;
export type ConsumerPhoto={mimeType:'image/jpeg';base64:string};
export function isConsumerPhoto(value:unknown):value is ConsumerPhoto {
 if(!value||typeof value!=='object')return false;
 const photo=value as ConsumerPhoto;
 return photo.mimeType==='image/jpeg'&&typeof photo.base64==='string'&&photo.base64.length<=MAX_PHOTO_BASE64_LENGTH&&photo.base64.startsWith('/9j/')&&photo.base64.length%4===0&&/^[A-Za-z0-9+/]+={0,2}$/.test(photo.base64);
}
export async function compressPhoto(file:File):Promise<ConsumerPhoto> {
 if(!file.type.startsWith('image/')||file.size>20*1024*1024)throw new Error('Invalid image');
 const url=URL.createObjectURL(file);
 try {
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');
  const context=canvas.getContext('2d');if(!context||!image.naturalWidth||!image.naturalHeight)throw new Error('Image unavailable');
  let scale=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight));
  for(let attempt=0;attempt<6;attempt++){
   canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
   for(const quality of [0.8,0.65,0.5]){
    const data=canvas.toDataURL('image/jpeg',quality);
    const photo:ConsumerPhoto={mimeType:'image/jpeg',base64:data.slice(data.indexOf(',')+1)};
    if(data.startsWith('data:image/jpeg;base64,')&&isConsumerPhoto(photo))return photo;
   }
   scale*=0.75;
  }
  throw new Error('Image too large');
 }finally{URL.revokeObjectURL(url);}
}
