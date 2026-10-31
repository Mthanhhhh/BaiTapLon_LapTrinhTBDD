import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/mobile/package.json',import.meta.url));
const ts=require('typescript');
const source=fs.readFileSync(new URL('../apps/mobile/src/utils/vietnamShipping.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const context={exports:{}};vm.runInNewContext(compiled,context);
const {VIETNAM_PROVINCES:provinces,estimateDelivery:estimate,resolveProvince:resolve,provinceLabel:label}=context.exports;
assert.equal(provinces.length,34);
assert.equal(new Set(provinces.map(p=>p.name)).size,34);
assert.equal(estimate('TP.HCM','Ha Noi').label,'2–3 ngày');
assert.equal(estimate('Hà Nội','Hồ Chí Minh').label,'2–3 ngày');
assert.equal(estimate('Ha Noi','Hà Nội').label,'1–2 ngày');
assert.equal(estimate('Hà Nội',null),null);
assert.equal(estimate(null,'Hà Nội'),null);
assert.equal(estimate('Atlantis','Hà Nội'),null);
assert.equal(label('TP. Ho Chi Minh'),'Hồ Chí Minh');
assert.equal(label('Ha Noi'),'Hà Nội');
assert.equal(label('unknown'),'unknown');
let pairs=0,legacyNames=0;
for(const p of provinces){
 assert.equal(resolve(p.name).name,p.name);
 assert.equal(resolve(p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D')).name,p.name);
 for(const alias of p.aliases){assert.equal(resolve(alias).name,p.name);legacyNames++;}
 for(const to of provinces){
  const a=estimate(p.name,to.name),b=estimate(to.name,p.name);
  assert.ok(a.minDays>=1&&a.maxDays===a.minDays+1);
  assert.equal(a.label,b.label);assert.equal(a.approximateKm,b.approximateKm);pairs++;
 }
}
assert.ok(estimate('Hồ Chí Minh','Đồng Nai').minDays<=estimate('Hồ Chí Minh','Hà Nội').minDays);
console.log(JSON.stringify({provinces:provinces.length,legacyAliases:legacyNames,provincePairs:pairs,reference:'HCMC–Hanoi 2–3 days',missingLocation:'no fabricated estimate'}));
