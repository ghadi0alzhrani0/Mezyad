import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import { createPool } from '../src/db.js';
import { createApp } from '../src/app.js';
import { hashPassword, hashToken, randomToken } from '../src/security.js';
import { migrate, seed } from '../../scripts/database.mjs';
import { categories } from '../../shared/catalog.js';
export const password = 'Test-only-password-42';
export const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64'
);
export async function fixture() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test'))
    throw new Error(
      'TEST_DATABASE_URL must name an isolated database ending in _test. No production fallback.'
    );
  const pool = createPool(url),
    uploadDir = await mkdtemp(path.join(os.tmpdir(), 'mezyad-upload-test-'));
  await migrate(pool);
  const hash = await hashPassword(password);
  const config = {
    nodeEnv: 'test',
    sessionSecret: 'local-test-session-secret-never-used-in-production',
    frontendOrigin: 'http://localhost:5173',
    uploadDir,
    bankAdapter: 'mock',
    allowMock: true,
    bankTimeoutMs: 40,
    dummyPasswordHash: hash,
  };
  const app = createApp({ pool, config, limits: false });
  const request = supertest(app);
  let users = {};
  async function reset() {
    await pool.query(
      'TRUNCATE users,categories,items,auctions,user_sessions,item_images,private_auction_access,bid_commitments,bids,auction_results CASCADE'
    );
    await seed(pool);
    users = {};
    for (const [key, role] of [
      ['seller', 'USER'],
      ['bidder', 'USER'],
      ['other', 'USER'],
      ['admin', 'ADMIN'],
    ]) {
      const row = await pool.query(
        'INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING *',
        [key, `${key}@example.test`, hash, role]
      );
      const token = randomToken();
      await pool.query(
        "INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES($1,$2,clock_timestamp()+interval '1 day')",
        [row.rows[0].id, hashToken(token, config.sessionSecret)]
      );
      users[key] = { ...row.rows[0], cookie: `mezyad_session=${token}` };
    }
  }
  const send = (method, url, key = 'seller') =>
    request[method](`/api/v1${url}`).set('Cookie', users[key].cookie);
  const data = {
    category: categories[2].id,
    title: 'سيارة اختبار',
    description: 'وصف اختبار اصطناعي للسيارة.',
    category_fields: JSON.stringify({ make: 'اختبار', model: 'نموذج', year: 2020 }),
  };
  async function listing(key = 'seller') {
    let req = send('post', '/items', key);
    for (const [field, value] of Object.entries(data)) req = req.field(field, value);
    const response = await req.attach('images', png, {
      filename: 'asset.png',
      contentType: 'image/png',
    });
    if (response.status !== 201)
      throw new Error(`Fixture listing failed: ${JSON.stringify(response.body)}`);
    return response.body.data;
  }
  async function auction({ key = 'seller', visibility = 'PUBLIC', endTime, startTime } = {}) {
    const item = await listing(key);
    await send('post', `/admin/items/${item.id}/review`, 'admin')
      .send({ decision: 'APPROVED' })
      .expect(200);
    const response = await send('post', '/auctions', key)
      .send({
        itemId: item.id,
        visibility,
        startingPrice: '100.00',
        minimumIncrement: '10.00',
        startTime: startTime || new Date(Date.now() - 60000).toISOString(),
        endTime: endTime || new Date(Date.now() + 600000).toISOString(),
      })
      .expect(201);
    return { ...response.body.data, item };
  }
  async function commitment(id, key = 'bidder', scenario = 'success') {
    return send('post', `/auctions/${id}/commitment`, key).send({ scenario });
  }
  async function bid(id, amount = '100.00', key = 'bidder', requestId = randomUUID()) {
    return send('post', `/auctions/${id}/bids`, key).send({ amount, requestId });
  }
  const close = async () => {
    await pool.end();
    await rm(uploadDir, { recursive: true, force: true });
  };
  return {
    pool,
    config,
    app,
    request,
    reset,
    send,
    listing,
    auction,
    commitment,
    bid,
    data,
    close,
    get users() {
      return users;
    },
  };
}
