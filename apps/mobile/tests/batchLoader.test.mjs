import test from 'node:test';
import assert from 'node:assert/strict';
import {createBatchLoader} from '../src/utils/batchLoader.ts';

test('deduplicates IDs, preserves waiters, uses null for absent offers',async()=>{
 const calls=[];const get=createBatchLoader(async ids=>{calls.push(ids);return [{id:1,price:50}];},row=>row.id,1);
 const rows=await Promise.all([get(1,'buyer'),get(1,'buyer'),get(2,'buyer')]);
 assert.deepEqual(calls,[[1,2]]);assert.deepEqual(rows,[{id:1,price:50},{id:1,price:50},null]);
});
test('isolates account batches and respects API batch limit',async()=>{
 const calls=[];const get=createBatchLoader(async ids=>{calls.push(ids);return ids.map(id=>({id}));},row=>row.id,1,2);
 await Promise.all([get(1,'a'),get(2,'a'),get(3,'a'),get(1,'b')]);
 assert.equal(calls.length,3);assert.ok(calls.every(ids=>ids.length<=2));
});
test('one failed chunk does not strand later promises',async()=>{
 const get=createBatchLoader(async ids=>{if(ids[0]===1)throw Error('unavailable');return ids.map(id=>({id}));},row=>row.id,1,1);
 const rows=await Promise.allSettled([get(1,'a'),get(2,'a')]);assert.equal(rows[0].status,'rejected');assert.equal(rows[1].status,'fulfilled');assert.deepEqual(rows[1].value,{id:2});
});
