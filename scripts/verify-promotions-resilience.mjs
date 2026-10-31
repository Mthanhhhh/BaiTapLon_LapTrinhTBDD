// Uses only fixtures recorded by verify-promotions.mjs. Always resumes paused containers.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const file=process.argv[2];if(!file?.startsWith('.tools/promotions-test-'))throw Error('Pass the isolated fixture state file');
const s=JSON.parse(fs.readFileSync(file));assert.equal(s.prefix,'promo.test.'+s.run);const u=s.users.find(u=>u.addressId&&s.orders.length),b='http://localhost:8080/api/v1/';
const docker=(...args)=>{const p=spawnSync('docker',args,{encoding:'utf8'});if(p.status!==0)throw Error(p.stderr);return p.stdout;};
const sql=q=>{const p=spawnSync('docker',['exec','-i','-e','MYSQL_PWD='+ (process.env.DB_PASSWORD||'root123'),'ecommerce-mysql','mysql','-uroot','-N','-B'],{input:q,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr);return p.stdout.trim();};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(path,method='GET',body){const r=await fetch(b+path,{method,signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',Authorization:'Bearer '+u.token},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(path+' '+r.status+' '+j.message);return j.data;}
async function add(){const c=await api('cart');if(!c.items.length)await api('cart/items','POST',{productId:s.productId,variantId:s.skuId,quantity:1});}
async function order(){const q=await api('promotions/quote','POST',{autoBest:true});const o=await api('orders','POST',{addressId:u.addressId,paymentMethod:'COD',quoteHash:q.quoteHash,idempotencyKey:randomUUID(),autoBest:true});s.orders.push(o.id);fs.writeFileSync(file,JSON.stringify(s,null,2));return o;}
let paused;
try{
 await add();paused='ecommerce-kafka';docker('pause',paused);const o=await order();assert.ok(Number(sql(`SELECT COUNT(*) FROM order_db.promo_outbox WHERE published_at IS NULL AND JSON_EXTRACT(payload,'$.orderId')=${o.id};`))>0);docker('unpause',paused);paused=undefined;
 const end=Date.now()+75000;while(Date.now()<end&&Number(sql(`SELECT COUNT(*) FROM order_db.promo_outbox WHERE published_at IS NULL AND JSON_EXTRACT(payload,'$.orderId')=${o.id};`))>0)await sleep(1000);
 assert.equal(Number(sql(`SELECT COUNT(*) FROM order_db.promo_outbox WHERE published_at IS NULL AND JSON_EXTRACT(payload,'$.orderId')=${o.id};`)),0);await api('orders/'+o.id+'/cancel','POST',{});s.results.kafkaOutageOutboxRecovery=true;console.log('Kafka paused: order committed, outbox retried: PASS');
 await add();paused='ecommerce-redis';docker('pause',paused);const r=await order();await api('orders/'+r.id+'/cancel','POST',{});docker('unpause',paused);paused=undefined;s.results.redisOutageSqlAuthority=true;console.log('Redis paused: quote, order, cancel: PASS');
}finally{if(paused)docker('unpause',paused);fs.writeFileSync(file,JSON.stringify(s,null,2));}
