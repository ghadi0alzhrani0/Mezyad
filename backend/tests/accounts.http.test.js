import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';

let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await pool.end(); });

async function post(path, body) {
  return fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('invalid registration is rejected at the HTTP boundary without requiring a database', async () => {
  for (const invalid of [{ name: '' }, { name: 'a'.repeat(161) }, { email: 'invalid' }, { email: 'a'.repeat(255) + '@example.invalid' }, { password: 'short' }, { password: 'س'.repeat(37) }]) {
    const response = await post('/api/v1/auth/register', { name: 'Validation test', email: 'validation@example.invalid', password: 'Account-test-2026', ...invalid });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_INPUT');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('incomplete login returns a clear 400 response', async () => {
  for (const body of [{}, { email: 'invalid', password: 'password' }, { email: 'user@example.invalid' }, { email: 'user@example.invalid', password: 'س'.repeat(37) }]) {
    const response = await post('/api/v1/auth/login', body);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_INPUT');
  }
});

test('malformed JSON is rejected without echoing sensitive input', async () => {
  const response = await fetch(base + '/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"password":"private-test-value"' });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, 'INVALID_JSON');
  assert.equal(JSON.stringify(body).includes('private-test-value'), false);
});

test('oversized account request is rejected before processing', async () => {
  const response = await post('/api/v1/auth/register', { name: 'a'.repeat(110000) });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'PAYLOAD_TOO_LARGE');
});

test('missing and malformed bearer tokens cannot reach protected handlers', async () => {
  for (const token of [undefined, 'not-a-token']) {
    const response = await fetch(base + '/api/v1/me/items', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'UNAUTHORIZED');
  }
});
