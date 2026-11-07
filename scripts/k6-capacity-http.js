import http from 'k6/http';
import exec from 'k6/execution';
import { Trend, Counter } from 'k6/metrics';

const cases = [
 ['edge',75], ['edge',100], ['edge',125], ['edge',150], ['edge',200],
 ['product',150], ['product',300], ['product',450], ['product',600],
];
const scenarios = {};
const metrics = {};
const duration = 20;
for (const [i,[route,rate]] of cases.entries()) {
 const name = route+'_'+rate;
 scenarios[name] = {executor:'constant-arrival-rate',rate,timeUnit:'1s',duration:duration+'s',
  startTime:i*24+'s',preAllocatedVUs:45,maxVUs:120,gracefulStop:'3s'};
 metrics[name] = {ok:new Counter(name+'_ok'),limited:new Counter(name+'_429'),
  server:new Counter(name+'_server'),other:new Counter(name+'_other'),latency:new Trend(name+'_p95',true)};
}
export const options = {scenarios,discardResponseBodies:true,summaryTrendStats:['p(95)']};
export default function () {
 const name = exec.scenario.name;
 const m = metrics[name];
 const origin = name.startsWith('edge') ? 'http://nginx:8080' : 'http://product-service:8084';
 const r = http.get(origin+'/api/v1/products/'+(__ENV.PRODUCT_ID || '109'),{timeout:'3s'});
 m.ok.add(Number(r.status===200));
 m.limited.add(Number(r.status===429));
 m.server.add(Number(r.status===0||r.status>=500));
 m.other.add(Number(r.status>0&&r.status<500&&r.status!==200&&r.status!==429));
 if(r.status===200)m.latency.add(r.timings.duration);
}
export function handleSummary(data) {
 const rows=cases.map(([route,rate])=>{
  const get=(suffix)=>data.metrics[route+'_'+rate+suffix]?.values??{};
  const [ok,limited,server,other]=['_ok','_429','_server','_other'].map(k=>get(k).count??0);
  return {route,offeredRps:rate,okRps:ok/duration,ok,limited,server,other,
   notStarted:Math.max(0,rate*duration-ok-limited-server-other),p95OkMs:get('_p95')['p(95)']??null};
 });
 const output=JSON.stringify(rows,null,2);
 return {stdout:output+'\n','/results/capacity-http.json':output};
}
