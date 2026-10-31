import assert from 'node:assert/strict';
const base=process.env.API_BASE_URL||'http://localhost:8080/api/v1';
async function get(path){const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,path);return (await r.json()).data;}
async function all(path){const rows=[];let total;for(let page=0;page<1000;page++){const data=await get(`${path}${path.includes('?')?'&':'?'}page=${page}&size=5`);total??=data.totalElements;assert.equal(data.totalElements,total);rows.push(...data.content);if(data.last){assert.equal(rows.length,total);assert.equal(new Set(rows.map(p=>p.id)).size,total);return rows;}}throw Error('Unbounded pagination');}
const catalog=await all('/products');
const ids=rows=>rows.map(p=>p.id).sort((a,b)=>a-b);
const empty=await all('/products/recommendations');
assert.deepEqual(ids(empty),ids(catalog));
for(const keyword of ['iphone','khongcosanpham123456','%','_','\\']){
 const ranked=await all(`/products/recommendations?keyword=${encodeURIComponent(keyword)}`);
 assert.deepEqual(ids(ranked),ids(catalog),`Catalog incomplete for ${keyword}`);
 let passedMatches=false;
 for(const p of ranked){const match=p.name.toLowerCase().includes(keyword);if(!match)passedMatches=true;else assert.equal(passedMatches,false,`Related product below unrelated product for ${keyword}`);}
 if(keyword==='iphone')assert.ok(ranked.some(p=>p.name.toLowerCase().includes('iphone')),'Need at least one matching fixture');
}
assert.deepEqual((await all('/products/recommendations?keyword=iphone')).map(p=>p.id),(await all('/products/recommendations?keyword=iphone')).map(p=>p.id));
console.log(JSON.stringify({catalogProducts:catalog.length,allProductsRetained:true,relevanceFirst:true,unknownAndLiteralKeywords:true,paginationWithoutDuplicates:true,stableOrder:true}));
