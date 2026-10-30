const password=process.env.PRACTICE_PASSWORD;
if(!password)throw Error('Set PRACTICE_PASSWORD for the two local practice accounts. This test creates an order.');
async function api(path,method='GET',body,token,expected=200){const r=await fetch('http://localhost:8080/api/v1/'+path,{method,signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();if(r.status!==expected)throw Error(path+': '+r.status+' '+JSON.stringify(j));return j.data;}
const b=(await api('auth/login','POST',{email:'buyer.practice.20261029@example.com',password})).accessToken;
const s=(await api('auth/login','POST',{email:'shop.practice.20261029@example.com',password})).accessToken;
const categories=await api('categories/catalog');if(categories.length<20)throw Error('Too few categories');
const reco=await api('products/recommendations?keyword=Pastel');if(!reco.content.length||reco.content.some(p=>!p.name.toLowerCase().includes('pastel')))throw Error('Recommendation mismatch');
await api('cart/items','POST',{productId:21,variantId:47,quantity:1},b);
const address=(await api('addresses','GET',undefined,b))[0];
const order=await api('orders','POST',{addressId:address.id,paymentMethod:'COD'},b);
await api(`orders/${order.id}/confirm`,'POST',undefined,s);
const inbox=await api('auth/notifications','GET',undefined,b);
const note=inbox.content.find(n=>n.orderId===order.id&&n.body.includes('chuẩn bị'));if(!note)throw Error('Missing status notification');
const other=await api('auth/notifications','GET',undefined,s);if(other.content.some(n=>n.orderId===order.id))throw Error('Account data leak');
await api('auth/notifications/'+note.id+'/read','POST',undefined,s);
const protectedInbox=await api('auth/notifications','GET',undefined,b);if(protectedInbox.content.find(n=>n.id===note.id).isRead)throw Error('Foreign user marked notification read');
await api('auth/notifications/'+note.id+'/read','POST',undefined,b);
const ownInbox=await api('auth/notifications','GET',undefined,b);if(!ownInbox.content.find(n=>n.id===note.id).isRead)throw Error('Read failed');
console.log(JSON.stringify({categories:categories.length,recommendationMatches:reco.content.length,orderId:order.id,notifications:true,accountIsolation:true,readState:true}));
