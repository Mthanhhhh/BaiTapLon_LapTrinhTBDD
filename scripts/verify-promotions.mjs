// Local integration test. Creates explicitly labelled, isolated fixtures; never uses existing buyer carts.
// Run: node scripts/verify-promotions.mjs. Docker MySQL is required. State is kept under ignored .tools/.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const base=process.env.API_URL||'http://localhost:8080/api/v1/';
const run=Date.now().toString(),prefix='promo.test.'+run;
const state={run,prefix,users:[],campaigns:[],orders:[],results:{}};
const file='.tools/promotions-test-'+run+'.json';
fs.mkdirSync('.tools',{recursive:true});
const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2));
const sql=query=>{const p=spawnSync('docker',['exec','-i','-e','MYSQL_PWD='+ (process.env.DB_PASSWORD||'root123'),'ecommerce-mysql','mysql','-uroot','--batch','--skip-column-names','--default-character-set=utf8mb4'],{input:query,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr);return p.stdout.trim();};
async function api(path,method='GET',body,token,expected=200){const r=await fetch(base+path,{method,signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();if(expected!==null&&r.status!==expected)throw Error(path+' '+r.status+' '+JSON.stringify(j));return expected===null?{status:r.status,data:j.data,error:j.message}:j.data;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function eventually(fn,label,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await wait(500);}throw Error('Timeout: '+label);}
async function pool(list,size,fn){let index=0;return Promise.all(Array.from({length:size},async()=>{while(index<list.length){const i=index++;list[i]=await fn(list[i],i);}}));}
async function account(index){const email=prefix+'.'+index+'@example.invalid',password=randomUUID();const auth=await api('auth/register','POST',{email,password,fullName:'KIỂM THỬ ƯU ĐÃI '+run+' '+index});const token=auth.accessToken;const id=JSON.parse(Buffer.from(token.split('.')[1],'base64url')).sub;const user={id:Number(id),email,password,token};state.users.push(user);save();return user;}
async function campaign(owner,extra){const c=await api('promotions/manage','POST',{name:'CHỈ KIỂM THỬ '+run,kind:'VOUCHER',layer:'SHOP',code:'T'+run+'_'+state.campaigns.length,discountType:'FIXED',value:10000,minOrder:0,budget:10000000,quota:500,perUserLimit:1,stackable:true,startsAt:new Date(Date.now()-60000).toISOString(),endsAt:new Date(Date.now()+3600000).toISOString(),...extra},owner.token);state.campaigns.push(c.id);save();return c.id;}
async function cart(user){await api('cart/items','POST',{productId:state.productId,variantId:state.skuId,quantity:1},user.token);}
const quote=user=>api('promotions/quote','POST',{autoBest:true},user.token);
async function place(user,method='COD',q){q=q||await quote(user);const body={addressId:user.addressId,paymentMethod:method,autoBest:true,quoteHash:q.quoteHash,idempotencyKey:randomUUID(),note:'CHỈ KIỂM THỬ '+run};const o=await api('orders','POST',body,user.token);state.orders.push(o.id);save();return {o,body,q};}
function counters(){return JSON.parse(sql(`SELECT JSON_OBJECT('stock',s.stock_quantity,'used',f.quota_used,'reserved',f.quota_reserved,'spent',c.budget_spent,'budgetReserved',c.budget_reserved) FROM product_db.product_skus s JOIN order_db.promo_flash_items f ON f.sku_id=s.id JOIN order_db.promo_campaigns c ON c.id=f.campaign_id WHERE f.campaign_id=${state.flashId};`));}
let ws;
try{
 await eventually(async()=>{try{return !!await api('promotions/catalog');}catch{return false;}},'services ready',60000);
 ws=new WebSocket(base.replace(/^http/,'ws').replace('/api/v1/','/ws/promotions'));const messages=[];ws.onmessage=e=>messages.push(JSON.parse(e.data));await eventually(()=>messages.some(m=>m.type==='CONNECTED'),'WebSocket connected');
 const owner=await account('owner'),admin=await account('admin');state.ownerId=owner.id;state.adminId=admin.id;
 sql(`INSERT IGNORE INTO auth_db.user_roles(user_id,role_id) SELECT ${admin.id},id FROM auth_db.roles WHERE code='ADMIN';`);
 const shop=await api('orders/shop/me','POST',{name:'CHỈ KIỂM THỬ '+run,description:'Fixture tự động; không phải shop thương mại',province:'Hồ Chí Minh'},owner.token);state.shopId=shop.id;assert.ok(state.shopId);save();
 const cats=await api('categories');const first=Array.isArray(cats)?cats[0]:cats.content[0];
 const product=await api(`products/shops/${state.shopId}/products`,'POST',{name:'CHỈ KIỂM THỬ voucher '+run,description:'Không phải sản phẩm thương mại',categoryId:first.id,price:100000,stock:300,variants:[{name:'Phân loại kiểm thử',price:100000,stock:300}]},owner.token);state.productId=product.id;const detail=await api('products/'+product.id);state.skuId=detail.variants[0].id;save();
 await api('promotions/shipping-policy','PUT',{fee:30000},owner.token);
 const shopCode=await campaign(owner,{discountType:'PERCENT',value:15,maxDiscount:20000});
 const platform=await campaign(admin,{layer:'PLATFORM'});
 const freight=await campaign(admin,{layer:'SHIPPING',value:30000});
 state.flashId=await campaign(owner,{kind:'FLASH',layer:'FLASH',budget:200000,items:[{skuId:state.skuId,salePrice:80000,quota:10,perUserLimit:1}]});save();
 await api('promotions/manage/'+shopCode+'/cancel','POST',{},admin.token,403);
 await api('promotions/manage','POST',{name:'Forbidden',kind:'VOUCHER',layer:'PLATFORM'},owner.token,403);
 const buyers=Array.from({length:100},(_,i)=>i);await pool(buyers,8,async(_,i)=>{const user=await account(i);const a=await api('addresses','POST',{fullName:'KIỂM THỬ '+run,phone:'0900000101',street:'Địa chỉ kiểm thử',city:'Hồ Chí Minh',state:'Quận kiểm thử',country:'VN'},user.token);user.addressId=a.id;await cart(user);return user;});save();
 await pool(buyers,8,async user=>{user.q=await quote(user);assert.equal(user.q.total,63800);assert.equal(user.q.applied.length,3);return user;});
 state.results.optimalThreeLayerQuote=63800;
 assert.equal(Object.hasOwn((await api('promotions/catalog')).campaigns[0],'budget_total'),false);
 const before=Date.now(),responses=await Promise.all(buyers.map(async user=>{const body={addressId:user.addressId,paymentMethod:'COD',autoBest:true,quoteHash:user.q.quoteHash,idempotencyKey:randomUUID()};return {user,body,...await api('orders','POST',body,user.token,null)};}));
 const success=responses.filter(r=>r.status===200);for(const r of success)state.orders.push(r.data.id);save();
 assert.equal(success.length,10,JSON.stringify(responses.filter(r=>r.status!==200).slice(0,3).map(r=>({status:r.status,error:r.error}))));assert.ok(responses.every(r=>[200,400,409].includes(r.status)));
 assert.deepEqual(counters(),{stock:290,used:10,reserved:0,spent:200000,budgetReserved:0});state.results.race={buyers:100,slots:10,success:10,rejected:90,elapsedMs:Date.now()-before};console.log('100 buyers / 10 slots: PASS');
 const winner=success[0],repeat=await Promise.all(Array.from({length:4},()=>api('orders','POST',winner.body,winner.user.token)));assert.ok(repeat.every(o=>o.id===winner.data.id));state.results.idempotency=true;
 const frozen=await api(`promotions/orders/${winner.data.id}/pricing`,'GET',undefined,winner.user.token);await api(`promotions/orders/${winner.data.id}/pricing`,'GET',undefined,buyers.find(b=>b.id!==winner.user.id).token,403);
 await Promise.all(Array.from({length:5},()=>api(`orders/${winner.data.id}/cancel`,'POST',{},winner.user.token)));assert.deepEqual(counters(),{stock:291,used:9,reserved:0,spent:180000,budgetReserved:0});state.results.cancelExactlyOnce=true;
 await cart(winner.user);const online=await place(winner.user,'VISA');const snapshot=await api(`promotions/orders/${online.o.id}/pricing`,'GET',undefined,winner.user.token);assert.ok(new Date(snapshot.expiresAt).getTime()-Date.now()>270000);assert.equal(counters().reserved,1);
 sql(`UPDATE order_db.promo_reservations SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE order_id=${online.o.id} AND user_id=${winner.user.id};`);
 await eventually(async()=>(await api('orders/'+online.o.id,'GET',undefined,winner.user.token)).status==='CANCELLED','reservation expiry');const restored=counters();await wait(2500);assert.deepEqual(counters(),restored);assert.equal(restored.stock,291);assert.equal(restored.reserved,0);state.results.fiveMinuteExpiry=true;
 await api('payments','POST',{orderId:online.o.id,method:'VISA',cardNumber:'4111111111111111'},winner.user.token,400);
 await cart(winner.user);const failed=await place(winner.user,'VISA');await api('payments','POST',{orderId:failed.o.id,method:'VISA',cardNumber:'4111111111110000'},winner.user.token,400);await eventually(async()=>(await api('orders/'+failed.o.id,'GET',undefined,winner.user.token)).status==='CANCELLED','Kafka compensation');assert.equal(counters().stock,291);assert.equal(counters().reserved,0);state.results.paymentFailureCompensation=true;
 const delivered=success[1];await api(`orders/${delivered.data.id}/confirm`,'POST',{},owner.token);await api(`orders/${delivered.data.id}/ship`,'POST',{},owner.token);await api(`orders/${delivered.data.id}/receive`,'POST',{},delivered.user.token);const stats=await api('promotions/manage','GET',undefined,owner.token);assert.equal(stats.campaigns.find(c=>c.id===shopCode).metrics.deliveredOrderRevenue,63800);state.results.realLifecycleMetrics=true;
 const reminder=await campaign(owner,{startsAt:new Date(Date.now()+120000).toISOString()});await api(`promotions/${reminder}/save`,'POST',{},winner.user.token);await api(`promotions/${reminder}/reminder`,'POST',{},winner.user.token);await eventually(()=>Number(sql(`SELECT COUNT(*) FROM auth_db.app_notifications WHERE user_id=${winner.user.id} AND event_key='promo-reminder-${reminder}';`))===1,'Kafka reminder');await wait(3500);assert.equal(Number(sql(`SELECT COUNT(*) FROM auth_db.app_notifications WHERE user_id=${winner.user.id} AND event_key='promo-reminder-${reminder}';`)),1);state.results.reminderExactlyOnce=true;
 await api('promotions/manage/'+shopCode+'/cancel','POST',{},owner.token);const unchanged=await api(`promotions/orders/${winner.data.id}/pricing`,'GET',undefined,winner.user.token);assert.equal(unchanged.total,frozen.total);assert.equal(unchanged.quoteHash,frozen.quoteHash);state.results.frozenPrice=true;
 assert.ok(messages.some(m=>m.type==='PROMOTIONS_CHANGED'));assert.ok(messages.every(m=>Object.keys(m).every(k=>['type','serverTime'].includes(k))));state.results.webSocketPublicInvalidation=true;
 state.results.passed=true;save();console.log(JSON.stringify({file,results:state.results},null,2));
}catch(error){state.error=error.message;save();console.error(error);process.exitCode=1;}finally{ws?.close();save();}
