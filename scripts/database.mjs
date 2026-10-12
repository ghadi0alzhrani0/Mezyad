import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from '../backend/src/config.js';
import { createPool } from '../backend/src/db.js';
import { hashPassword, hashToken } from '../backend/src/security.js';
import { categories } from '../shared/catalog.js';

export async function migrate(pool) {
  const files = (await readdir(path.join(root, 'database/migrations')))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files)
    await pool.query(await readFile(path.join(root, 'database/migrations', file), 'utf8'));
}
export async function seed(pool) {
  await pool.query(await readFile(path.join(root, 'database/seeds/001_categories.sql'), 'utf8'));
}
export async function account(pool, email, name, role, password) {
  if (!password || password.length < 10)
    throw new Error(
      'Seed passwords must be supplied via environment and contain at least 10 characters.'
    );
  const hash = await hashPassword(password);
  const { rows } = await pool.query(
    'INSERT INTO users(email,name,role,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO UPDATE SET name=$2,role=$3,password_hash=$4 RETURNING id',
    [email, name, role, hash]
  );
  return rows[0].id;
}
export async function demo(pool, env = process.env) {
  if (env.NODE_ENV === 'production') throw new Error('Demo seed is forbidden in production.');
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)
    throw new Error('Set SESSION_SECRET before seeding private demo auctions.');
  await seed(pool);
  const admin = await account(
    pool,
    'admin@example.test',
    'مشرف الاختبار',
    'ADMIN',
    env.SEED_ADMIN_PASSWORD
  );
  const seller = await account(
    pool,
    'seller@example.test',
    'بائع الاختبار',
    'USER',
    env.SEED_USER_PASSWORD
  );
  await account(pool, 'bidder@example.test', 'مزايد الاختبار', 'USER', env.SEED_USER_PASSWORD);
  const ids = ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'];
  for (let index = 0; index < 2; index++) {
    await pool.query(
      `INSERT INTO items(id,seller_id,category_id,title,description,category_fields,status,reviewed_by,reviewed_at) VALUES($1,$2,$3,$4,$5,$6,'APPROVED',$7,clock_timestamp()) ON CONFLICT(id) DO NOTHING`,
      [
        ids[index],
        seller,
        categories[2].id,
        index ? 'سيارة اختبار — مزاد خاص' : 'سيارة اختبار — مزاد عام',
        'بيانات اصطناعية لتجربة رحلة المزاد محليًا؛ ليست إعلانًا حقيقيًا.',
        { make: 'اختبار', model: 'نموذج', year: 2020, mileage: 10000, condition: 'بيانات اختبار' },
        admin,
      ]
    );
    await pool.query(
      `INSERT INTO auctions(item_id,visibility,access_code_hash,starting_price,current_price,minimum_increment,start_time,end_time,status) VALUES($1,$2,$3,1000,1000,100,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '7 days','ACTIVE') ON CONFLICT(item_id) DO NOTHING`,
      [
        ids[index],
        index ? 'PRIVATE' : 'PUBLIC',
        index ? hashToken('demo-invite-code', env.SESSION_SECRET) : null,
      ]
    );
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required.');
  const pool = createPool(url);
  try {
    const command = process.argv[2];
    if (command === 'migrate') {
      await migrate(pool);
      console.log('Migration applied (10 core tables).');
    } else if (command === 'seed') {
      await seed(pool);
      console.log('Four categories seeded.');
    } else if (command === 'demo') {
      await demo(pool);
      console.log('Local demo accounts and auctions seeded. Private code: demo-invite-code.');
    } else throw new Error('Use migrate, seed, or demo.');
  } finally {
    await pool.end();
  }
}
