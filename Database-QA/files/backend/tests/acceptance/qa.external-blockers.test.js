import test from 'node:test';

// Explicit skipped gates, never described as passing tests.
test('BLOCK-01 / QA-07: genuine provider success/rejection/timeout/authentication/response verification',
  {skip:'Stage 3 provider, operation, consent contract and sandbox credentials have not been verified'},()=>{});
test('BLOCK-02 / QA-22: MIME/extension/size/storage acceptance through the real image upload pipeline',
  {skip:'Multipart image upload is absent; approved file limits and storage backend are unspecified (see GAP-01)'},()=>{});
test('BLOCK-03 / QA-14/15/16: complete public/private browser journeys and UX states',
  {skip:'This package tests the database and API; complete browser E2E requires remaining UI/bank work and QA review'},()=>{});
test('BLOCK-04: private-code throttle policy returns 429 at its configured limit',
  {skip:'No throttle implementation or approved threshold/window exists; source review records this security gap'},()=>{});
