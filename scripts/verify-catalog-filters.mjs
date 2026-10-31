import assert from 'node:assert/strict';
const get=async p=>{const r=await fetch('http://localhost:8080/api/v1/'+p,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,p);return(await r.json()).data;};
const catalog=await get('categories/catalog'),iphone=catalog.find(c=>c.parentId===32&&c.name==='iPhone');assert.ok(iphone);
const child=await get(`products/category/${iphone.id}?size=100`);assert.ok(child.content.length>0);assert.ok(child.content.every(p=>p.categoryName==='iPhone'));
const root=await get('products/category/32?size=100');assert.ok(root.content.some(p=>child.content.some(c=>c.id===p.id)));
const filtered=await get('products/search?categoryId=32&keyword=iPhone&minPrice=0&maxPrice=10000000&minRating=4&size=100');assert.ok(filtered.content.length>0);assert.ok(filtered.content.every(p=>p.price<=10000000&&p.rating>=4&&/iphone/i.test(p.name)));
const first=await get('products/search?keyword=Pro&size=5&page=0&sort=id,asc'),second=await get('products/search?keyword=Pro&size=5&page=1&sort=id,asc');assert.ok(first.totalElements>5);assert.equal(second.page,1);assert.ok(first.content.every(p=>!second.content.some(q=>p.id===q.id)));
console.log(JSON.stringify({passed:true,rootProducts:root.totalElements,iphoneProducts:child.totalElements,filteredProducts:filtered.totalElements,paginatedKeywordMatches:first.totalElements}));
