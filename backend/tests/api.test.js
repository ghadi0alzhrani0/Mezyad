import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import { fixture, password, png } from './fixtures.js';
import { createApp } from '../src/app.js';
import { MockBankAdapter, UnconfiguredBankAdapter } from '../src/banking.js';
let f;
beforeAll(async () => {
  f = await fixture();
});
beforeEach(async () => {
  await f.reset();
});
afterAll(async () => {
  await f?.close();
});
describe('Authentication and sessions', () => {
  it('registers a USER, hashes password and refuses supplied ADMIN role', async () => {
    const body = { name: 'Test Member', email: 'new@example.test', password };
    const response = await f.request.post('/api/v1/auth/register').send(body).expect(201);
    expect(response.body.data.role).toBe('USER');
    expect(response.body.data).not.toHaveProperty('password_hash');
    const saved = (
      await f.pool.query('SELECT password_hash FROM users WHERE id=$1', [response.body.data.id])
    ).rows[0];
    expect(saved.password_hash).toMatch(/^scrypt\$/);
    expect(saved.password_hash).not.toContain(password);
    await f.request
      .post('/api/v1/auth/register')
      .send({ ...body, email: 'another@example.test', role: 'ADMIN' })
      .expect(400);
  });
  it('QA-01 duplicate email returns 409 with one account', async () => {
    await f.request
      .post('/api/v1/auth/register')
      .send({ name: 'Duplicate', email: 'SELLER@example.test', password })
      .expect(409);
    expect(
      (await f.pool.query("SELECT count(*) FROM users WHERE email='seller@example.test'")).rows[0]
        .count
    ).toBe('1');
  });
  it('QA-02 wrong or unknown credentials return 401 without a session', async () => {
    const count = (await f.pool.query('SELECT count(*) FROM user_sessions')).rows[0].count;
    for (const email of ['seller@example.test', 'unknown@example.test'])
      await f.request
        .post('/api/v1/auth/login')
        .send({ email, password: 'incorrect-password' })
        .expect(401);
    expect((await f.pool.query('SELECT count(*) FROM user_sessions')).rows[0].count).toBe(count);
  });
  it('login creates HttpOnly hashed session, hydration and logout revoke it', async () => {
    const response = await f.request
      .post('/api/v1/auth/login')
      .send({ email: 'seller@example.test', password })
      .expect(200);
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    const raw = cookie.split(';')[0].split('=')[1];
    expect(
      (await f.pool.query('SELECT 1 FROM user_sessions WHERE token_hash=$1', [raw])).rowCount
    ).toBe(0);
    await f.request.get('/api/v1/items').set('Cookie', cookie).expect(200);
    await f.request.post('/api/v1/auth/logout').set('Cookie', cookie).expect(200);
    await f.request.get('/api/v1/items').set('Cookie', cookie).expect(401);
  });
  it('unauthorized and expired sessions are rejected', async () => {
    await f.request.get('/api/v1/me/items').expect(401);
    await f.pool.query("UPDATE user_sessions SET expires_at=clock_timestamp()-interval '1 second'");
    await f.send('get', '/items').expect(401);
  });
  it('rejects cross-origin unsafe requests and malformed JSON', async () => {
    await f.send('post', '/auth/logout').set('Origin', 'https://untrusted.example').expect(403);
    await f.request
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
  });
  it('local built frontend can authenticate; production rejects unconfigured local origins', async () => {
    const dev = createApp({
      pool: f.pool,
      config: { ...f.config, nodeEnv: 'development', port: 3000 },
      limits: false,
    });
    for (const origin of ['http://localhost:3000', 'http://127.0.0.1:5173']) {
      await supertest(dev)
        .post('/api/v1/auth/login')
        .set('Origin', origin)
        .send({ email: 'seller@example.test', password })
        .expect(200);
    }
    const prod = createApp({
      pool: f.pool,
      config: { ...f.config, nodeEnv: 'production', frontendOrigin: 'https://mezyad.example.test' },
      limits: false,
    });
    await supertest(prod)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'seller@example.test', password })
      .expect(403);
  });
});
describe('Listings, ownership and review', () => {
  it('seller uploads listing with validated image; unreviewed images stay private', async () => {
    const item = await f.listing();
    expect(item.status).toBe('PENDING_REVIEW');
    expect(item.images).toHaveLength(1);
    await f.request.get(item.images[0].url).expect(404);
    await f.request.get(item.images[0].url).set('Cookie', f.users.seller.cookie).expect(200);
    await f.send('get', `/items/${item.id}`, 'other').expect(403);
  });
  it('QA-03 non-admin cannot review; public ADMIN registration impossible', async () => {
    const item = await f.listing();
    await f
      .send('post', `/admin/items/${item.id}/review`, 'bidder')
      .send({ decision: 'APPROVED' })
      .expect(403);
    expect(
      (await f.pool.query('SELECT status FROM items WHERE id=$1', [item.id])).rows[0].status
    ).toBe('PENDING_REVIEW');
  });
  it('QA-04 unapproved listing cannot become an auction', async () => {
    const item = await f.listing();
    await f
      .send('post', '/auctions')
      .send({
        itemId: item.id,
        visibility: 'PUBLIC',
        startingPrice: 100,
        minimumIncrement: 10,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60000).toISOString(),
      })
      .expect(409);
  });
  it('QA-17 rejected listing edited by owner preserves images and resubmits', async () => {
    const item = await f.listing();
    await f
      .send('post', `/admin/items/${item.id}/review`, 'admin')
      .send({ decision: 'REJECTED' })
      .expect(400);
    await f
      .send('post', `/admin/items/${item.id}/review`, 'admin')
      .send({ decision: 'REJECTED', reason: 'Add more detail.' })
      .expect(200);
    let req = f.send('patch', `/items/${item.id}`);
    for (const [key, value] of Object.entries(f.data)) req = req.field(key, value);
    const response = await req.expect(200);
    expect(response.body.data.status).toBe('PENDING_REVIEW');
    expect(response.body.data.review_reason).toBeNull();
    expect(response.body.data.images).toHaveLength(1);
  });
  it('cannot edit another owner listing or change approved auction listing', async () => {
    const auction = await f.auction();
    for (const [user, status] of [
      ['other', 403],
      ['seller', 409],
    ]) {
      let req = f.send('patch', `/items/${auction.item.id}`, user);
      for (const [key, value] of Object.entries(f.data)) req = req.field(key, value);
      await req.expect(status);
    }
  });
  it('invalid category fields and missing photos return validation errors', async () => {
    let req = f.send('post', '/items');
    for (const [key, value] of Object.entries({ ...f.data, category_fields: '{"year":-1}' }))
      req = req.field(key, value);
    await req.attach('images', png, 'asset.png').expect(400);
    req = f.send('post', '/items');
    for (const [key, value] of Object.entries(f.data)) req = req.field(key, value);
    await req.expect(400);
    expect((await f.pool.query('SELECT count(*) FROM items')).rows[0].count).toBe('0');
  });
  it('QA-22 rejects disguised, SVG, oversized and excess image files', async () => {
    for (const [buffer, type, name] of [
      [Buffer.from('not an image'), 'image/png', 'fake.png'],
      [Buffer.from('<svg/>'), 'image/svg+xml', 'unsafe.svg'],
      [Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png', 'large.png'],
    ]) {
      let req = f.send('post', '/items');
      for (const [key, value] of Object.entries(f.data)) req = req.field(key, value);
      await req.attach('images', buffer, { filename: name, contentType: type }).expect(400);
    }
    let req = f.send('post', '/items');
    for (const [key, value] of Object.entries(f.data)) req = req.field(key, value);
    for (let i = 0; i < 7; i++)
      req = req.attach('images', png, { filename: `${i}.png`, contentType: 'image/png' });
    await req.expect(400);
    expect((await f.pool.query('SELECT count(*) FROM item_images')).rows[0].count).toBe('0');
  });
  it('auction settings reject non-positive increment and invalid schedule', async () => {
    const item = await f.listing();
    const body = {
      itemId: item.id,
      visibility: 'PUBLIC',
      startingPrice: 100,
      minimumIncrement: 0,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() - 1000).toISOString(),
    };
    await f.send('post', '/auctions').send(body).expect(400);
  });
});
describe('Private access', () => {
  it('QA-05 wrong code denied; correct code idempotently grants access', async () => {
    const auction = await f.auction({ visibility: 'PRIVATE' });
    await f
      .send('post', `/auctions/${auction.id}/access`, 'bidder')
      .send({ accessCode: 'incorrect' })
      .expect(404);
    for (let i = 0; i < 2; i++)
      await f
        .send('post', `/auctions/${auction.id}/access`, 'bidder')
        .send({ accessCode: auction.accessCode })
        .expect(200);
    expect((await f.pool.query('SELECT count(*) FROM private_auction_access')).rows[0].count).toBe(
      '1'
    );
    const response = await f.send('get', `/auctions/${auction.id}`, 'bidder').expect(200);
    expect(response.body.data).not.toHaveProperty('access_code_hash');
    expect(response.body.data).not.toHaveProperty('accessCode');
  });
  it('QA-06 direct details, history, images, commitment and bid are private', async () => {
    const auction = await f.auction({ visibility: 'PRIVATE' });
    await f.request
      .get('/api/v1/auctions')
      .expect(200)
      .then((r) => expect(r.body.data.auctions).toHaveLength(0));
    for (const suffix of ['', '/bids', '/commitment'])
      await f.send('get', `/auctions/${auction.id}${suffix}`, 'bidder').expect(404);
    await f.bid(auction.id).then((r) => expect(r.status).toBe(404));
    await f.request
      .get(auction.item.images[0].url)
      .set('Cookie', f.users.bidder.cookie)
      .expect(404);
    await f.send('get', `/auctions/${randomUUID()}`, 'bidder').expect(404);
  });
  it('code guessing is rate limited', async () => {
    const auction = await f.auction({ visibility: 'PRIVATE' }),
      app = createApp({ pool: f.pool, config: f.config });
    for (let i = 0; i < 10; i++)
      await supertest(app)
        .post(`/api/v1/auctions/${auction.id}/access`)
        .set('Cookie', f.users.bidder.cookie)
        .send({ accessCode: 'incorrect' })
        .expect(404);
    await supertest(app)
      .post(`/api/v1/auctions/${auction.id}/access`)
      .set('Cookie', f.users.bidder.cookie)
      .send({ accessCode: 'incorrect' })
      .expect(429);
  });
});
describe('Bid commitment and external dependency', () => {
  it('approved mock commitment enables bidding, repeated request keeps one record', async () => {
    const auction = await f.auction();
    await f.bid(auction.id).then((r) => expect(r.body.error.code).toBe('COMMITMENT_REQUIRED'));
    const first = await f.commitment(auction.id);
    expect(first.status).toBe(201);
    expect(first.body.data.commitment.status).toBe('APPROVED');
    expect(first.body.data.mode).toBe('mock');
    expect(first.body.data.realIntegrationVerified).toBe(false);
    const second = await f.commitment(auction.id);
    expect(second.status).toBe(200);
    expect(second.body.data.commitment.id).toBe(first.body.data.commitment.id);
  });
  it('rejected commitment cannot bid and can retry', async () => {
    const auction = await f.auction();
    const response = await f.commitment(auction.id, 'bidder', 'rejected');
    expect(response.body.data.commitment.status).toBe('REJECTED');
    await f.bid(auction.id).then((r) => expect(r.status).toBe(403));
    await f.commitment(auction.id);
    await f.bid(auction.id).then((r) => expect(r.status).toBe(201));
  });
  for (const scenario of ['timeout', 'error', 'auth-error', 'invalid-response'])
    it(`QA-07 provider ${scenario} never approves eligibility`, async () => {
      const auction = await f.auction();
      const response = await f.commitment(auction.id, 'bidder', scenario);
      expect(response.status).toBe(502);
      const row = (await f.pool.query('SELECT * FROM bid_commitments')).rows[0];
      expect(row.status).toBe('FAILED');
      expect(row.sandbox_reference).toBeNull();
      await f.bid(auction.id).then((r) => expect(r.status).toBe(403));
    });
  it('unconfigured genuine adapter reports blocker; no invented request occurs', async () => {
    const auction = await f.auction(),
      app = createApp({
        pool: f.pool,
        config: f.config,
        bank: new UnconfiguredBankAdapter(),
        limits: false,
      });
    const r = await supertest(app)
      .post(`/api/v1/auctions/${auction.id}/commitment`)
      .set('Cookie', f.users.bidder.cookie)
      .send({})
      .expect(503);
    expect(r.body.error.code).toBe('BANK_NOT_CONFIGURED');
  });
  it('concurrent commitment requests invoke adapter once', async () => {
    const auction = await f.auction();
    let release,
      calls = 0;
    const bank = new MockBankAdapter();
    bank.startSandboxOperation = () => {
      calls++;
      return new Promise((resolve) => {
        release = () => resolve({ eligible: true, reference: 'mock:concurrent' });
      });
    };
    const app = createApp({
      pool: f.pool,
      config: { ...f.config, bankTimeoutMs: 3000 },
      bank,
      limits: false,
    });
    const first = supertest(app)
      .post(`/api/v1/auctions/${auction.id}/commitment`)
      .set('Cookie', f.users.bidder.cookie)
      .send({})
      .then((r) => r);
    for (let i = 0; !release && i < 50; i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    expect(release).toBeTypeOf('function');
    const second = await supertest(app)
      .post(`/api/v1/auctions/${auction.id}/commitment`)
      .set('Cookie', f.users.bidder.cookie)
      .send({})
      .expect(200);
    expect(second.body.data.commitment.status).toBe('PENDING');
    release();
    expect((await first).status).toBe(201);
    expect(calls).toBe(1);
  });
});
describe('Atomic bidding and closure', () => {
  it('preserves large exact-decimal bid amounts', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    const response = await f.bid(auction.id, '9007199254740993.01');
    expect(response.status).toBe(201);
    expect(response.body.data.currentPrice).toBe('9007199254740993.01');
    expect((await f.pool.query('SELECT amount FROM bids')).rows[0].amount).toBe(
      '9007199254740993.01'
    );
  });
  it('QA-03A seller cannot commit or bid on own auction', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id, 'seller').then((r) => expect(r.status).toBe(403));
    await f.bid(auction.id, '100', 'seller').then((r) => expect(r.status).toBe(403));
  });
  it('QA-03B / QA-21 one account sells and bids; both appear in activity', async () => {
    const own = await f.auction(),
      other = await f.auction({ key: 'other' });
    await f.commitment(other.id, 'seller');
    await f.bid(other.id, '100', 'seller').then((r) => expect(r.status).toBe(201));
    const items = await f.send('get', '/me/items').expect(200);
    expect(items.body.data.items.some((i) => i.id === own.item.id)).toBe(true);
    const auctions = await f.send('get', '/me/auctions').expect(200);
    expect(auctions.body.data.auctions.map((a) => a.id).sort()).toEqual([own.id, other.id].sort());
  });
  it('QA-18 accepts first bid equal to starting price with history consistency', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    const response = await f.bid(auction.id);
    expect(response.status).toBe(201);
    expect(response.body.data.currentPrice).toBe('100.00');
    const history = await f.send('get', `/auctions/${auction.id}/bids`, 'bidder');
    expect(history.body.data.bids[0].id).toBe(response.body.data.bidId);
    expect(history.body.data.bids[0].is_mine).toBe(true);
  });
  it('QA-08 / QA-19 invalid bids leave price and records unchanged', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    await f.bid(auction.id, '99').then((r) => expect(r.status).toBe(409));
    await f.bid(auction.id, '100');
    await f.bid(auction.id, '109.99').then((r) => expect(r.status).toBe(409));
    const saved = (
      await f.pool.query('SELECT current_price FROM auctions WHERE id=$1', [auction.id])
    ).rows[0];
    expect(saved.current_price).toBe('100.00');
    expect((await f.pool.query('SELECT count(*) FROM bids')).rows[0].count).toBe('1');
  });
  it('QA-09 same requestId concurrently submitted is accepted at most once', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    const id = randomUUID();
    const responses = await Promise.all([
      f.bid(auction.id, '100', 'bidder', id),
      f.bid(auction.id, '100', 'bidder', id),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      (await f.pool.query('SELECT count(*) FROM bids WHERE request_id=$1', [id])).rows[0].count
    ).toBe('1');
  });
  it('QA-10 two equal concurrent bids serialize without inconsistent price', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    await f.commitment(auction.id, 'other');
    const responses = await Promise.all([
      f.bid(auction.id, '100', 'bidder'),
      f.bid(auction.id, '100', 'other'),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const saved = await f.pool.query(
      'SELECT a.current_price,max(b.amount) AS highest,count(b.id) AS count FROM auctions a LEFT JOIN bids b ON b.auction_id=a.id WHERE a.id=$1 GROUP BY a.id',
      [auction.id]
    );
    expect(saved.rows[0]).toEqual({ current_price: '100.00', highest: '100.00', count: '1' });
  });
  it('database failure rolls back bid insertion and price update together', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    await f.pool.query(
      "CREATE OR REPLACE FUNCTION test_fail_price() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test rollback'; END; $$; CREATE TRIGGER test_price_failure BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE FUNCTION test_fail_price();"
    );
    try {
      await f.bid(auction.id, '120').then((r) => expect(r.status).toBe(500));
      expect((await f.pool.query('SELECT count(*) FROM bids')).rows[0].count).toBe('0');
      expect(
        (await f.pool.query('SELECT current_price FROM auctions WHERE id=$1', [auction.id])).rows[0]
          .current_price
      ).toBe('100.00');
    } finally {
      await f.pool.query(
        'DROP TRIGGER test_price_failure ON auctions; DROP FUNCTION test_fail_price();'
      );
    }
  });
  it('scheduled auction refuses an early bid', async () => {
    const auction = await f.auction({ startTime: new Date(Date.now() + 60000).toISOString() });
    await f.commitment(auction.id);
    await f.bid(auction.id).then((r) => expect(r.body.error.code).toBe('AUCTION_NOT_STARTED'));
  });
  it('QA-11 / QA-23 rejects late bid before a page visit and closes on access', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    await f.pool.query(
      "UPDATE auctions SET end_time=clock_timestamp()-interval '1 second' WHERE id=$1",
      [auction.id]
    );
    await f.bid(auction.id).then((r) => expect(r.body.error.code).toBe('AUCTION_ENDED'));
    expect((await f.pool.query('SELECT count(*) FROM auction_results')).rows[0].count).toBe('0');
    await f.send('get', `/auctions/${auction.id}`, 'bidder').expect(200);
    expect((await f.pool.query('SELECT count(*) FROM auction_results')).rows[0].count).toBe('1');
  });
  it('QA-12 closes without a winner when no bids were accepted', async () => {
    const auction = await f.auction();
    await f.pool.query(
      "UPDATE auctions SET end_time=clock_timestamp()-interval '1 second' WHERE id=$1",
      [auction.id]
    );
    const response = await f.send('get', `/auctions/${auction.id}`, 'bidder');
    expect(response.body.data.status).toBe('CLOSED');
    expect(response.body.data.result.winner_bid_id).toBeNull();
  });
  it('QA-13 repeated closure stores one highest-bid result for the correct auction', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    await f.commitment(auction.id, 'other');
    await f.bid(auction.id);
    const winner = await f.bid(auction.id, '110', 'other');
    await f.pool.query(
      "UPDATE auctions SET end_time=clock_timestamp()-interval '1 second' WHERE id=$1",
      [auction.id]
    );
    const responses = await Promise.all([
      f.send('get', `/auctions/${auction.id}`, 'other'),
      f.send('get', `/auctions/${auction.id}`, 'other'),
    ]);
    expect(responses[0].body.data.result).toEqual(responses[1].body.data.result);
    expect(responses[0].body.data.result.winner_bid_id).toBe(winner.body.data.bidId);
    expect(responses[0].body.data.result.isWinner).toBe(true);
    expect((await f.pool.query('SELECT count(*) FROM auction_results')).rows[0].count).toBe('1');
  });
  it('QA-20 composite foreign key rejects a winning bid from another auction', async () => {
    const a = await f.auction(),
      b = await f.auction();
    await f.commitment(a.id);
    const bid = await f.bid(a.id);
    await expect(
      f.pool.query('INSERT INTO auction_results(auction_id,winner_bid_id) VALUES($1,$2)', [
        b.id,
        bid.body.data.bidId,
      ])
    ).rejects.toMatchObject({ code: '23503' });
  });
  it('bid waiting behind a lock uses wall clock; concurrent closure cannot accept it late', async () => {
    const auction = await f.auction();
    await f.commitment(auction.id);
    const lock = await f.pool.connect();
    await lock.query('BEGIN');
    await lock.query('SELECT 1 FROM auctions WHERE id=$1 FOR UPDATE', [auction.id]);
    const pending = f.bid(auction.id).then((r) => r),
      closing = f.send('get', `/auctions/${auction.id}`, 'bidder').then((r) => r);
    let waiting = 0;
    for (let i = 0; i < 100; i++) {
      const waits = await f.pool.query(
        "SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'"
      );
      waiting = Number(waits.rows[0].count);
      if (waiting >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await lock.query(
      "UPDATE auctions SET end_time=clock_timestamp()-interval '1 second' WHERE id=$1",
      [auction.id]
    );
    await lock.query('COMMIT');
    lock.release();
    expect(waiting).toBeGreaterThanOrEqual(2);
    expect((await pending).status).toBe(409);
    expect((await closing).body.data.status).toBe('CLOSED');
    expect((await f.pool.query('SELECT count(*) FROM bids')).rows[0].count).toBe('0');
  });
});
