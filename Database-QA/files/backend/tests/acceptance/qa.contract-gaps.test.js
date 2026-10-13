import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setupQa, databaseSkip } from '../helpers/qa-fixtures.js';

// These are acceptance checks, not expected-failure tests. A failing assertion
// identifies a real gap to fix before the complete Stage 3 contract can pass.
let q;
before(async () => { if (!databaseSkip) q=await setupQa('contracts'); });
after(async () => { if(q) await q.shutdown(); });
const check=(name,fn)=>test(name,{skip:databaseSkip},fn);

check('GAP-01: Stage 3 multipart listing accepts a valid PNG and persists its image reference',async()=>{
  const form=new FormData();
  form.set('categoryId',q.category.id);
  form.set('category',q.category.id); // exact public field naming still needs clarification
  form.set('title','Synthetic multipart listing'); form.set('description','A local QA image fixture.');
  form.set('category_fields','{}');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=','base64');
  form.append('images',new Blob([png],{type:'image/png'}),'qa-fixture.png');
  const result=await q.api('/items',{method:'POST',token:q.seller.token,form});
  assert.equal(result.status,201,JSON.stringify(result.json));
  assert.ok((await q.pool.query('SELECT 1 FROM item_images WHERE item_id=$1',[result.json.data.id])).rowCount);
});

check('GAP-02 / QA-17: resubmission saves corrected category fields, not only title/description',async()=>{
  const listing=await q.item({status:'REJECTED',fields:{fixtureVersion:'old'}});
  const result=await q.api('/items/'+listing.id,{method:'PATCH',token:q.seller.token,
    body:{title:'Corrected',description:'Corrected',categoryFields:{fixtureVersion:'corrected'}}});
  assert.equal(result.status,200);
  assert.deepEqual(result.json.data.category_fields,{fixtureVersion:'corrected'});
});

check('GAP-03: invalid UUID on admin review is a client error, not an internal server failure',async()=>{
  const result=await q.api('/admin/items/not-a-uuid/review',{method:'POST',token:q.admin.token,body:{decision:'APPROVED'}});
  assert.equal(result.status,400,JSON.stringify(result.json));
});

check('GAP-04: overlong listing title is rejected with 400 before a PostgreSQL error',async()=>{
  const result=await q.api('/items',{method:'POST',token:q.seller.token,
    body:{categoryId:q.category.id,title:'a'.repeat(241),description:'Synthetic boundary fixture'}});
  assert.equal(result.status,400,JSON.stringify(result.json));
});

check('GAP-05: whitespace-only rejection reason is rejected and listing remains pending',async()=>{
  const listing=await q.item({status:'PENDING_REVIEW'});
  const result=await q.api('/admin/items/'+listing.id+'/review',{method:'POST',token:q.admin.token,body:{decision:'REJECTED',reason:'   '}});
  assert.equal(result.status,400,JSON.stringify(result.json));
  assert.equal((await q.pool.query('SELECT status FROM items WHERE id=$1',[listing.id])).rows[0].status,'PENDING_REVIEW');
});

check('GAP-06 / QA-06: private bid denial does not disclose whether the auction exists',async()=>{
  const a=await q.auction({visibility:'PRIVATE'});
  const hidden=await q.bid(a);
  const missing=await q.bid({id:randomUUID()});
  assert.equal(hidden.status,missing.status,JSON.stringify({hidden,missing}));
  assert.deepEqual(hidden.json,missing.json);
});

check('GAP-07: public auction status filter excludes auctions in other states',async()=>{
  const active=await q.auction(),closed=await q.auction({end:'-1 second'});
  await q.api('/auctions/'+closed.id); // finalize through the actual documented endpoint
  const result=await q.api('/auctions?status=CLOSED');
  assert.equal(result.status,200);
  assert.ok(result.json.data.some(a=>a.id===closed.id));
  assert.equal(result.json.data.some(a=>a.id===active.id),false);
});
