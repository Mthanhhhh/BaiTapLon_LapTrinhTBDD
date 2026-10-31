import assert from 'node:assert/strict';import fs from 'node:fs';
import dns from 'node:dns';import {spawnSync} from 'node:child_process';
// Optional diagnostic for a Windows resolver still caching the old domain delegation.
// Keep the original hostname/SNI and certificate validation; never disable TLS verification.
if(process.argv.includes('--public-dns')){
 const result=spawnSync('powershell.exe',['-NoProfile','-Command',"@(Resolve-DnsName api-eshop.mtcord.io.vn -Server 1.1.1.1 -Type A -DnsOnly | Where-Object Type -eq A | Select-Object -ExpandProperty IPAddress) | ConvertTo-Json -Compress"],{encoding:'utf8'});
 assert.equal(result.status,0,'Public DNS lookup');const resolved=JSON.parse(result.stdout);const addresses=Array.isArray(resolved)?resolved:[resolved];assert.ok(addresses.length);
 const original=dns.lookup;dns.lookup=function(host,options,callback){if(host!=='api-eshop.mtcord.io.vn')return original.apply(this,arguments);if(typeof options==='function'){callback=options;options={};}queueMicrotask(()=>options?.all?callback(null,addresses.map(address=>({address,family:4}))):callback(null,addresses[0],4));};
}
const base='https://api-eshop.mtcord.io.vn',creds=JSON.parse(fs.readFileSync('.tools/shop-catalog-credentials.json'));
const call=async(origin,path,method='GET',body,token)=>{const r=await fetch(origin+'/api/v1/'+path,{method,signal:AbortSignal.timeout(25000),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});assert.ok(r.ok,path+': HTTP '+r.status);return(await r.json()).data;};
const login=async email=>(await call(base,'auth/login','POST',{email,password:creds.password})).accessToken;
const a=await login('buyer.catalog.practice@eshop.example'),b=await login('buyer.catalog.practice@eshop.example'),other=await login('shop.samsung@eshop.example');
const publicCats=await call(base,'categories'),localCats=await call('http://127.0.0.1:8080','categories');assert.deepEqual(publicCats,localCats);
const detail=await call(base,'products/111');const sku=detail.variants[0];
const before=await call(base,'cart','GET',undefined,a),previous=before.items.find(i=>i.variantId===sku.id);
let itemId;
try{
 await call(base,'cart/items','POST',{productId:111,variantId:sku.id,quantity:1},a);
 const seen=await call(base,'cart','GET',undefined,b);const item=seen.items.find(i=>i.variantId===sku.id);assert.ok(item);itemId=item.id;assert.equal(item.quantity,(previous?.quantity||0)+1);
 const serverCart=await call('http://127.0.0.1:8080','cart','GET',undefined,b);assert.equal(serverCart.items.find(i=>i.id===itemId)?.quantity,item.quantity);
 const isolated=await call(base,'cart','GET',undefined,other);assert.ok(isolated.items.every(i=>i.id!==itemId));
 await call(base,'promotions/quote','POST',{autoBest:true},b);
 const history=await call(base,'orders?size=2','GET',undefined,b);
 assert.ok(history.content.length);
 const payment=await fetch(base+'/api/v1/payments/order/'+history.content[0].id,{headers:{Authorization:'Bearer '+b}});
 assert.ok([200,404].includes(payment.status),'Payment service must accept the shared JWT');
 const invalidReview=await fetch(base+'/api/v1/products/111/reviews',{method:'POST',headers:{Authorization:'Bearer '+b,'Content-Type':'application/json'},body:'{}'});
 assert.equal(invalidReview.status,400,'Product service must accept JWT then validate required review fields');
}finally{if(itemId){if(previous)await call(base,'cart/items/'+itemId,'PUT',{quantity:previous.quantity},a);else await call(base,'cart/items/'+itemId,'DELETE',undefined,a);}}
const callback=await fetch(base+'/api/v1/auth/oauth/mobile/callback?state=connection-test&code=dummy-code',{redirect:'manual'});assert.equal(callback.status,302);assert.ok(callback.headers.get('location')?.startsWith('eshop://oauth/callback?'));
const socket=()=>new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('https:','wss:')+'/ws/promotions');const timer=setTimeout(()=>{ws.close();reject(Error('WSS timeout'));},20000);ws.onmessage=e=>{try{const j=JSON.parse(String(e.data));assert.ok(j.serverTime);clearTimeout(timer);ws.close();resolve(true);}catch(error){clearTimeout(timer);ws.close();reject(error);}};ws.onerror=()=>{clearTimeout(timer);reject(Error('WSS failed'));};});
let socketError;
for(let attempt=0;attempt<3;attempt++){try{await socket();socketError=undefined;break;}catch(error){socketError=error;await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}}
if(socketError)throw socketError;
const report={passed:true,base,dns:process.argv.includes('--public-dns')?'1.1.1.1 diagnostic lookup':'system',checks:['public HTTPS','same database via local/public API','two independent logins share account cart','other account cart isolation','order history','checkout quote','native OAuth callback relay','WSS server clock'],checkedAt:new Date().toISOString()};fs.writeFileSync('.tools/cloud-server-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
