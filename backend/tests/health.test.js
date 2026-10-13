import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from '../src/app.js';
test('GET /health returns status ok',async()=>{
 const server=app.listen(0);
 try{
  const port=server.address().port;
  const response=await fetch('http://127.0.0.1:'+port+'/health');
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{data:{status:'ok'}});
 }finally{await new Promise(resolve=>server.close(resolve))}
});
