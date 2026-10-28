import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// One-time migration. Run from any directory with Node 18+ and curl installed.
// No API secret is required. Disable the unsigned preset after migration.
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 't4eozcyt';
const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
const local = (name) => fileURLToPath(new URL(name, import.meta.url));
const products = (await readFile(local('cloudinary-source-products.jsonl'), 'utf8'))
  .replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(JSON.parse);
const manifestPath = local('cloudinary-product-images.json');
let overrides = {};
try { overrides = JSON.parse(await readFile(local('cloudinary-source-overrides.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
let manifest;
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; manifest = []; }

const failures = [];
for (const product of products) {
  if (!Number.isSafeInteger(product.id) || product.id <= 0) throw new Error('Invalid product ID');
  if (manifest.some((item) => item.id === product.id && item.sourceUrl === product.sourceUrl && item.cloudName === cloudName)) continue;
  if (!preset) throw new Error('Set CLOUDINARY_UPLOAD_PRESET before uploading new assets.');
  const uploadSourceUrl = overrides[product.id] || product.sourceUrl;
  const source = new URL(uploadSourceUrl);
  if (source.protocol !== 'https:') throw new Error(`HTTPS source required: ${product.id}`);
  const result = spawnSync('curl.exe', [
    '--fail-with-body', '--silent', '--show-error', '--max-time', '90',
    '-X', 'POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    '--data-urlencode', `file=${uploadSourceUrl}`,
    '--data-urlencode', `upload_preset=${preset}`,
    '--data-urlencode', `public_id=eshop-products/product-${product.id}`,
  ], { encoding: 'utf8', timeout: 100000 });
  if (result.status !== 0) {
    failures.push(product.id);
    console.error(`Upload ${product.id} failed: ${result.stdout} ${result.stderr}`);
    continue;
  }
  const asset = JSON.parse(result.stdout);
  if (!asset.secure_url?.startsWith(`https://res.cloudinary.com/${cloudName}/`) || asset.resource_type !== 'image') {
    throw new Error(`Unexpected upload response for ${product.id}`);
  }
  manifest = manifest.filter((item) => item.id !== product.id);
  manifest.push({ ...product, uploadSourceUrl, cloudName, publicId: asset.public_id, assetId: asset.asset_id,
    secureUrl: asset.secure_url, width: asset.width, height: asset.height, bytes: asset.bytes });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Uploaded product ${product.id}: ${asset.secure_url}`);
}
if (failures.length) throw new Error(`No database migration generated. Fix image sources and rerun for products: ${failures.join(', ')}`);

const quote = (value) => {
  if (/[\\\r\n\0]/.test(value)) throw new Error('Unsafe SQL string');
  return `'${value.replaceAll("'", "''")}'`;
};
const forward = ['USE product_db;', 'START TRANSACTION;'];
const rollback = ['USE product_db;', 'START TRANSACTION;'];
for (const product of products) {
  const image = manifest.find((item) => item.id === product.id && item.cloudName === cloudName && item.sourceUrl === product.sourceUrl);
  if (!image) throw new Error(`Missing upload for ${product.id}`);
  const oldUrl = quote(image.sourceUrl), newUrl = quote(image.secureUrl);
  forward.push(`UPDATE products SET thumbnail_url=${newUrl} WHERE id=${image.id} AND thumbnail_url=${oldUrl};`);
  forward.push(`UPDATE product_images SET url=${newUrl} WHERE product_id=${image.id} AND url=${oldUrl};`);
  rollback.push(`UPDATE products SET thumbnail_url=${oldUrl} WHERE id=${image.id} AND thumbnail_url=${newUrl};`);
  rollback.push(`UPDATE product_images SET url=${oldUrl} WHERE product_id=${image.id} AND url=${newUrl};`);
}
forward.push('COMMIT;'); rollback.push('COMMIT;');
await writeFile(local('cloudinary-product-images.sql'), forward.join('\n') + '\n');
await writeFile(local('cloudinary-product-images-rollback.sql'), rollback.join('\n') + '\n');
console.log(`Prepared migration and rollback for ${products.length} products. Database has not been changed by this script.`);
