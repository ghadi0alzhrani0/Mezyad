import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';

const testUrl = process.env.TEST_DATABASE_URL;
const password = 'Account-test-2026';
let app, pool, server, base;
const ids = new Set();

if (testUrl) {
  const url = new URL(testUrl);
  assert.match(url.pathname, /_test$/, 'Use a separate database ending in _test');
  process.env.DATABASE_URL = testUrl;
}

before(async () => {
  if (!testUrl) return;
  ({ app } = await import('../src/app.js'));
  ({ pool } = await import('../src/db.js'));
  await pool.query(await readFile(new URL('../../database/migrations/001_schema.sql', import.meta.url), 'utf8'));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  if (!testUrl) return;
  if (server) await new Promise(resolve => server.close(resolve));
  if (pool) {
    const users = [...ids];
    if (users.length) {
      await pool.query('DELETE FROM auction_results WHERE auction_id IN (SELECT a.id FROM auctions a JOIN items i ON i.id=a.item_id WHERE i.seller_id=ANY($1::uuid[]))', [users]);
      await pool.query('DELETE FROM auctions WHERE item_id IN (SELECT id FROM items WHERE seller_id=ANY($1::uuid[]))', [users]);
      await pool.query('DELETE FROM items WHERE seller_id=ANY($1::uuid[])', [users]);
      await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [users]);
    }
    await pool.end();
  }
});

async function api(path, { method = 'POST', body, token } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, json: await response.json(), headers: response.headers };
}

async function account(overrides = {}) {
  const input = { name: 'Account Test', email: randomUUID() + '@example.invalid', password, ...overrides };
  const response = await api('/api/v1/auth/register', { body: input });
  assert.equal(response.status, 201);
  ids.add(response.json.data.id);
  return { input, user: response.json.data };
}

async function login(input) {
  const response = await api('/api/v1/auth/login', { body: input });
  assert.equal(response.status, 200);
  return response.json.data;
}

async function catalogFixture({ title, images, visibility = 'PUBLIC' }) {
  const seller = await account();
  const category = await pool.query("INSERT INTO categories(name) VALUES($1) RETURNING id", ['Catalog test ' + randomUUID()]);
  const item = await pool.query("INSERT INTO items(seller_id,category_id,title,description,status) VALUES($1,$2,$3,$4,'APPROVED') RETURNING id",
    [seller.user.id,category.rows[0].id,title,'Description for ' + title]);
  for (const image of images) await pool.query('INSERT INTO item_images(item_id,image_url) VALUES($1,$2)', [item.rows[0].id,image]);
  const auction = await pool.query(`INSERT INTO auctions(item_id,visibility,access_code_hash,starting_price,current_price,minimum_increment,start_time,end_time,status)
    VALUES($1,$2,$3,1000,1000,100,now()-interval '1 minute',now()+interval '1 day','ACTIVE') RETURNING id`,
  [item.rows[0].id,visibility,visibility === 'PRIVATE' ? await bcrypt.hash('test-private-code',12) : null]);
  return { id: auction.rows[0].id, seller, category: category.rows[0].id };
}

test('account integration against PostgreSQL', { skip: !testUrl && 'Set TEST_DATABASE_URL to run real database tests' }, async t => {
  await t.test('registration normalizes identity, stores a password hash and creates USER', async () => {
    const value = await account({ name: '  غدي  ', email: '  ' + randomUUID().toUpperCase() + '@EXAMPLE.INVALID  ', role: 'ADMIN' });
    assert.equal(value.user.name, 'غدي');
    assert.equal(value.user.email, value.input.email.trim().toLowerCase());
    assert.equal(value.user.role, 'USER');
    assert.deepEqual(Object.keys(value.user).sort(), ['email', 'id', 'name', 'role']);
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [value.user.id]);
    assert.notEqual(rows[0].password_hash, password);
    assert.equal(await bcrypt.compare(password, rows[0].password_hash), true);
  });

  await t.test('QA-01: duplicate normalized email returns 409 without another user', async () => {
    const value = await account();
    const duplicate = await api('/api/v1/auth/register', { body: { ...value.input, email: value.input.email.toUpperCase() } });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.json.error.code, 'DUPLICATE_EMAIL');
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM users WHERE email=$1', [value.user.email])).rows[0].count, 1);
  });

  await t.test('concurrent duplicate registrations create exactly one account', async () => {
    const input = { name: 'Concurrent account', email: randomUUID() + '@example.invalid', password };
    const replies = await Promise.all([api('/api/v1/auth/register', { body: input }), api('/api/v1/auth/register', { body: input })]);
    assert.deepEqual(replies.map(r => r.status).sort(), [201, 409]);
    ids.add(replies.find(r => r.status === 201).json.data.id);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM users WHERE email=$1', [input.email])).rows[0].count, 1);
  });

  await t.test('login returns an opaque token, stores only its hash and protects responses from caching', async () => {
    const value = await account();
    const response = await api('/api/v1/auth/login', { body: { email: value.input.email.toUpperCase(), password } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const { token, user } = response.json.data;
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.deepEqual(user, value.user);
    const { rows } = await pool.query('SELECT token_hash,expires_at FROM user_sessions WHERE user_id=$1', [user.id]);
    assert.equal(rows.length, 1);
    assert.notEqual(rows[0].token_hash, token);
    assert.equal(rows[0].token_hash, createHash('sha256').update(token).digest('hex'));
    assert.ok(rows[0].expires_at > new Date());
  });

  await t.test('QA-02: wrong password and unknown email have the same 401 response and create no session', async () => {
    const value = await account();
    const wrong = await api('/api/v1/auth/login', { body: { email: value.user.email, password: 'wrong-password' } });
    const unknown = await api('/api/v1/auth/login', { body: { email: randomUUID() + '@example.invalid', password } });
    assert.equal(wrong.status, 401);
    assert.deepEqual(wrong.json, unknown.json);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM user_sessions WHERE user_id=$1', [value.user.id])).rows[0].count, 0);
  });

  await t.test('valid session accesses the protected endpoint and logout revokes it', async () => {
    const value = await account();
    const { token } = await login(value.input);
    assert.equal((await api('/api/v1/me/items', { method: 'GET', token })).status, 200);
    const logout = await api('/api/v1/auth/logout', { token });
    assert.equal(logout.status, 200);
    assert.equal(logout.json.data.signedOut, true);
    assert.equal((await api('/api/v1/me/items', { method: 'GET', token })).status, 401);
    assert.equal((await api('/api/v1/auth/logout', { token })).status, 401);
  });

  await t.test('logout revokes only the current session', async () => {
    const value = await account();
    const one = await login(value.input), two = await login(value.input);
    assert.notEqual(one.token, two.token);
    await api('/api/v1/auth/logout', { token: one.token });
    assert.equal((await api('/api/v1/me/items', { method: 'GET', token: one.token })).status, 401);
    assert.equal((await api('/api/v1/me/items', { method: 'GET', token: two.token })).status, 200);
  });

  await t.test('expired session is rejected by the server', async () => {
    const value = await account();
    const { token } = await login(value.input);
    await pool.query("UPDATE user_sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1", [value.user.id]);
    assert.equal((await api('/api/v1/me/items', { method: 'GET', token })).status, 401);
  });

  await t.test('missing, tampered and forged tokens cannot access protected routes', async () => {
    for (const token of [undefined, 'not-a-token', 'a'.repeat(64)]) {
      const result = await api('/api/v1/me/items', { method: 'GET', token });
      assert.equal(result.status, 401);
      assert.equal(result.json.error.code, 'UNAUTHORIZED');
    }
  });

  await t.test('QA-03: USER cannot approve listings, while a database-provisioned ADMIN can', async () => {
    const value = await account();
    const member = await login(value.input);
    const adminAccount = await account();
    await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1", [adminAccount.user.id]);
    const administrator = await login(adminAccount.input);
    assert.equal(administrator.user.role, 'ADMIN');
    const category = await pool.query("INSERT INTO categories(name) VALUES('Account test category') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id");
    const item = await pool.query("INSERT INTO items(seller_id,category_id,title,description) VALUES($1,$2,'Auth test listing','Role authorization fixture') RETURNING id", [value.user.id, category.rows[0].id]);
    const path = '/api/v1/admin/items/' + item.rows[0].id + '/review';
    assert.equal((await api(path, { token: member.token, body: { decision: 'APPROVED' } })).status, 403);
    const approved = await api(path, { token: administrator.token, body: { decision: 'APPROVED' } });
    assert.equal(approved.status, 200);
    assert.equal(approved.json.data.status, 'APPROVED');
  });

  await t.test('legacy auth URLs remain compatible with existing clients', async () => {
    const value = await account();
    const result = await api('/auth/login', { body: value.input });
    assert.equal(result.status, 200);
    assert.equal((await api('/auth/logout', { token: result.json.data.token })).status, 200);
  });

  await t.test('public auction cards return the title and image belonging to their own listing', async () => {
    const car = await catalogFixture({ title: 'Catalog Porsche', images: ['/images/porsche-carrera-gt.jpg'] });
    const villa = await catalogFixture({ title: 'Catalog Villa', images: ['/images/hittin-villa.jpg'] });
    const response = await api('/api/v1/auctions', { method: 'GET' });
    assert.equal(response.status, 200);
    const carCard = response.json.data.find(value => value.id === car.id);
    const villaCard = response.json.data.find(value => value.id === villa.id);
    assert.equal(carCard.title, 'Catalog Porsche');
    assert.equal(carCard.image_url, '/images/porsche-carrera-gt.jpg');
    assert.equal(carCard.bid_count, 0);
    assert.equal(villaCard.title, 'Catalog Villa');
    assert.equal(villaCard.image_url, '/images/hittin-villa.jpg');
    assert.notEqual(carCard.category_name, villaCard.category_name);
  });

  await t.test('auction details contain only images and description of the requested listing', async () => {
    const images = ['/images/porsche-carrera-gt.jpg', '/images/porsche-carrera-gt-2.jpg'];
    const car = await catalogFixture({ title: 'Detail Porsche', images });
    await catalogFixture({ title: 'Other Villa', images: ['/images/hittin-villa.jpg'] });
    const response = await api('/api/v1/auctions/' + car.id, { method: 'GET' });
    assert.equal(response.status, 200);
    assert.equal(response.json.data.id, car.id);
    assert.equal(response.json.data.title, 'Detail Porsche');
    assert.equal(response.json.data.description, 'Description for Detail Porsche');
    assert.deepEqual([...response.json.data.images].sort(), [...images].sort());
    assert.equal(response.json.data.images.includes('/images/hittin-villa.jpg'), false);
  });

  await t.test('private listing images and title are not exposed in public discovery or direct guest access', async () => {
    const privateAuction = await catalogFixture({ title: 'Private catalog fixture', images: ['/images/hittin-villa.jpg'], visibility: 'PRIVATE' });
    const listed = await api('/api/v1/auctions', { method: 'GET' });
    assert.equal(listed.json.data.some(value => value.id === privateAuction.id), false);
    const denied = await api('/api/v1/auctions/' + privateAuction.id, { method: 'GET' });
    assert.equal(denied.status, 404);
    assert.equal(JSON.stringify(denied.json).includes('Private catalog fixture'), false);
    const owner = await login(privateAuction.seller.input);
    const allowed = await api('/api/v1/auctions/' + privateAuction.id, { method: 'GET', token: owner.token });
    assert.equal(allowed.status, 200);
    assert.deepEqual(allowed.json.data.images, ['/images/hittin-villa.jpg']);
  });


});
