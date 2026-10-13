import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { pool } from '../src/db.js';

// Opt-in fixtures for a named local test database. Never customer listings.
const url = process.env.DATABASE_URL && new URL(process.env.DATABASE_URL);
if (process.env.DEMO_SEED_ALLOWED !== 'true' || !url || !/_test$/.test(url.pathname)) {
  await pool.end();
  throw new Error('Set DEMO_SEED_ALLOWED=true and use a separate database ending in _test');
}
const fixtures = [
  { suffix: '1', title: 'فيلا في حي حطين', category: 'Real Estate', image: 'hittin-villa.jpg', price: 14500000,
    description: 'فيلا في حي حطين. راجع الصور والمعلومات المتاحة قبل المشاركة في المزاد.' },
  { suffix: '2', title: 'بورش كاريرا GT — 2005', category: 'Rare Vehicles', image: 'porsche-carrera-gt.jpg', price: 4200000,
    description: 'بورش كاريرا GT، موديل 2005. راجع صور السيارة والمعلومات المتاحة قبل المشاركة في المزاد.' },
  { suffix: '3', title: 'لوحة مميزة — ن ج د 1', category: 'Vehicle Plates', image: 'plate-njd1.jpg', price: 750000,
    description: 'لوحة مميزة — ن ج د 1. راجع صورة اللوحة قبل المشاركة في المزاد.' },
];
const userId = '10000000-0000-4000-8000-000000000000';
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(`INSERT INTO users(id,name,email,password_hash) VALUES($1,'حساب العرض المحلي','design-demo@example.invalid',$2)
    ON CONFLICT(id) DO NOTHING`, [userId, await bcrypt.hash(randomBytes(32).toString('hex'), 12)]);
  for (const fixture of fixtures) {
    const itemId = '10000000-0000-4000-8000-00000000000' + fixture.suffix;
    const auctionId = '20000000-0000-4000-8000-00000000000' + fixture.suffix;
    const imageId = '30000000-0000-4000-8000-00000000000' + fixture.suffix;
    const category = await client.query(`INSERT INTO categories(name) VALUES($1) ON CONFLICT(name)
      DO UPDATE SET name=EXCLUDED.name RETURNING id`, [fixture.category]);
    await client.query(`INSERT INTO items(id,seller_id,category_id,title,description,category_fields,status)
      VALUES($1,$2,$3,$4,$5,$6,'APPROVED') ON CONFLICT(id) DO NOTHING`,
    [itemId,userId,category.rows[0].id,fixture.title,fixture.description,JSON.stringify({ designFixture: true, source: 'mbc0Qc5e0hR8dIaqQjbMMN/2:2' })]);
    await client.query('INSERT INTO item_images(id,item_id,image_url) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',
      [imageId,itemId,'/images/' + fixture.image]);
    if (fixture.suffix === '2') {
      for (const index of [2,3,4]) {
        await client.query('INSERT INTO item_images(id,item_id,image_url) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',
          ['40000000-0000-4000-8000-00000000000' + index,itemId,'/images/porsche-carrera-gt-' + index + '.jpg']);
      }
    }
    await client.query(`INSERT INTO auctions(id,item_id,visibility,starting_price,current_price,minimum_increment,start_time,end_time,status)
      VALUES($1,$2,'PUBLIC',$3,$3,1000,now()-interval '1 minute',now()+interval '3 days','ACTIVE')
      ON CONFLICT(id) DO NOTHING`, [auctionId,itemId,fixture.price]);
  }
  await client.query('COMMIT');
  console.log('Three Figma design fixtures prepared in the local test database; no real bids or commitments created.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
