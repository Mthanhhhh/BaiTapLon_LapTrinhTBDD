import http from 'k6/http';
import {check} from 'k6';
export const options={scenarios:{catalog:{executor:'constant-arrival-rate',rate:20,timeUnit:'1s',duration:'30s',preAllocatedVUs:20,maxVUs:50}},thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<1500']}};
const base=__ENV.BASE_URL||'http://nginx:8080';
export default function(){const r=http.get(`${base}/api/v1/products/${__ENV.PRODUCT_ID||109}`);check(r,{'product returned':r.status===200});}
export function handleSummary(data){return {[__ENV.REPORT||'/reports/catalog.json']:JSON.stringify(data,null,2)};}
