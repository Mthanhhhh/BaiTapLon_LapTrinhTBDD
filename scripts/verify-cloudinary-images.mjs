import { readFile, writeFile } from 'node:fs/promises';

const base = process.env.API_URL || 'http://localhost:8080';
const manifest = JSON.parse(await readFile(new URL('cloudinary-product-images.json', import.meta.url), 'utf8'));
const expected = new Map(manifest.map((image) => [image.id, image.secureUrl]));
async function get(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const body = await response.json();
  if (!body.success) throw new Error(`${path}: API unsuccessful`);
  return body.data;
}
function checkProducts(items, label) {
  if (!items?.length) throw new Error(`${label}: empty results`);
  for (const item of items) {
    if (item.thumbnailUrl !== expected.get(item.id)) throw new Error(`${label}: incorrect image for ${item.id}`);
  }
  return items.length;
}
const page = await get('/api/v1/products?size=100');
const productCount = checkProducts(page.content, 'Home products');
if (productCount !== manifest.length) throw new Error('Product count differs from migration manifest');
let detailImageCount = 0;
for (const image of manifest) {
  const product = await get(`/api/v1/products/${image.id}`);
  checkProducts([product], 'Product detail');
  for (const url of product.images || []) {
    if (url !== image.secureUrl) throw new Error(`Old detail image for ${image.id}`);
    detailImageCount++;
  }
}
const bestSales = checkProducts((await get('/api/v1/products/best-sales?size=10')).content, 'Best sales');
const popular = checkProducts((await get('/api/v1/products/popular?size=10')).content, 'Popular');
const search = checkProducts((await get('/api/v1/products/search?keyword=Tai&size=100')).content, 'Elasticsearch search');
const report = { checkedAt: new Date().toISOString(), api: base, productCount, detailImageCount, bestSales, popular, search, passed: true };
await writeFile(new URL('cloudinary-verification.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
