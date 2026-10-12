import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createPool } from '../backend/src/db.js';
import { createApp } from '../backend/src/app.js';
import { hashPassword } from '../backend/src/security.js';
import { migrate, seed, account } from './database.mjs';
const url = process.env.E2E_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error('E2E_DATABASE_URL must name an isolated database ending in _test.');
const pool = createPool(url);
await migrate(pool);
await pool.query(
  'TRUNCATE users,categories,items,auctions,user_sessions,item_images,private_auction_access,bid_commitments,bids,auction_results CASCADE'
);
await seed(pool);
const password = 'E2E-local-only-password';
await account(pool, 'admin@example.test', 'مشرف الاختبار', 'ADMIN', password);
const uploadDir = await mkdtemp(path.join(os.tmpdir(), 'mezyad-e2e-'));
const config = {
  nodeEnv: 'test',
  sessionSecret: 'e2e-local-session-secret-only-32-plus-characters',
  frontendOrigin: 'http://127.0.0.1:3001',
  uploadDir,
  bankAdapter: 'mock',
  allowMock: true,
  bankTimeoutMs: 1000,
  dummyPasswordHash: await hashPassword(password),
};
const server = createApp({ pool, config }).listen(3001, '127.0.0.1', () =>
  console.log('Mezyad isolated E2E server ready')
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      await rm(uploadDir, { recursive: true, force: true });
      process.exit(0);
    })
  );
