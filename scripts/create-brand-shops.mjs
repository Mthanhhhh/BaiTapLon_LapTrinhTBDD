// Merchant role-play accounts for the private classroom demo; never alters Daily Mart.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
if(process.argv[2]!=='--classroom-local')throw Error('Pass --classroom-local');
const brands=JSON.parse(fs.readFileSync('data/brand-catalog-sources.json')),creds=JSON.parse(fs.readFileSync('.tools/shop-catalog-credentials.json'));
const sql=q=>{const r=spawnSync('docker',['exec','-i','-e','MYSQL_PWD='+ (process.env.DB_PASSWORD||'root123'),'ecommerce-mysql','mysql','-uroot','-N','-B','--default-character-set=utf8mb4'],{input:'USE product_db;\n'+q,encoding:'utf8',maxBuffer:16*1024*1024});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
const q=s=>"'"+String(s).replaceAll('\\','\\\\').replaceAll("'","''")+"'";
const daily=sql("SELECT JSON_OBJECT('id',id,'name',name,'owner',owner_user_id,'description',description,'province',province) FROM product_db.shops WHERE id=2;");assert.equal(JSON.parse(daily).name,'Daily Mart');
sql(fs.readFileSync('infra/mysql/migrations/20261101_brand_catalog.sql','utf8'));
let out='USE product_db; SET NAMES utf8mb4; START TRANSACTION;\n';
for(let i=0;i<brands.length;i++){
 const b=brands[i],email=`shop.${b.key}@eshop.example`,province=['Hồ Chí Minh','Hà Nội','Đà Nẵng'][i%3];
 out+=`INSERT INTO auth_db.users(email,password_hash,full_name,status,created_at,updated_at) SELECT ${q(email)},${q(creds.hash)},${q(b.name+' Shop')},'ACTIVE','2025-06-01','2025-06-01' WHERE NOT EXISTS(SELECT 1 FROM auth_db.users WHERE email=${q(email)});\nSET @owner=(SELECT id FROM auth_db.users WHERE email=${q(email)});\nINSERT IGNORE INTO auth_db.user_roles(user_id,role_id) SELECT @owner,id FROM auth_db.roles WHERE code='BUYER';\n`;
 out+=`INSERT INTO shops(owner_user_id,name,slug,description,province,status,is_authorized,created_at,updated_at) SELECT @owner,${q(b.name)},${q('brand-'+b.key)},${q('Khám phá danh mục '+b.name+'. Tên sản phẩm và thông tin kỹ thuật được đối chiếu từ catalog của hãng. Nguồn thông tin: '+b.homeUrl)},${q(province)},'ACTIVE',1,'2025-07-01','2025-07-01' WHERE NOT EXISTS(SELECT 1 FROM shops WHERE owner_user_id=@owner);\nSET @shop=(SELECT id FROM shops WHERE owner_user_id=@owner);\nINSERT IGNORE INTO classroom_catalog_shops(brand_key,shop_id,source_url) VALUES(${q(b.key)},@shop,${q(b.homeUrl)});\n`;
 for(const c of b.categories)out+=`INSERT IGNORE INTO shop_category_links(shop_id,category_id) VALUES(@shop,${c.id});\n`;
}
out+='COMMIT;';sql(out);assert.equal(sql("SELECT JSON_OBJECT('id',id,'name',name,'owner',owner_user_id,'description',description,'province',province) FROM product_db.shops WHERE id=2;"),daily);
const rows=sql("SELECT JSON_OBJECT('brand',c.brand_key,'shopId',s.id,'shopName',s.name,'email',u.email) FROM classroom_catalog_shops c JOIN shops s ON s.id=c.shop_id JOIN auth_db.users u ON u.id=s.owner_user_id ORDER BY c.brand_key;").split('\n').map(JSON.parse);
const csv=s=>'"'+String(s).replaceAll('"','""')+'"';fs.writeFileSync('.tools/shop-catalog-accounts.csv','Shop,Email,Password,Shop ID\n'+rows.map(r=>[r.shopName,r.email,creds.password,r.shopId].map(csv).join(',')).join('\n'));
fs.writeFileSync('.tools/brand-shop-state.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({shops:rows.length,categoryLinks:Number(sql('SELECT COUNT(*) FROM shop_category_links;')),dailyMartPreserved:true,credentialsFile:'.tools/shop-catalog-accounts.csv'}));
