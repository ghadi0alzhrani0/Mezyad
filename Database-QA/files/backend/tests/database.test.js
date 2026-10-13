import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setupQa, databaseSkip, expectSqlCode } from './helpers/qa-fixtures.js';

let q;
before(async () => { if (!databaseSkip) q = await setupQa('database'); });
after(async () => { if (q) await q.shutdown(); });
const check = (name, fn) => test(name, { skip: databaseSkip }, fn);

check('DB-01: migration creates exactly the ten Stage 3 core tables, each with a primary key', async () => {
  const result = await q.pool.query(`SELECT t.table_name, count(c.constraint_name)::int AS primary_keys
    FROM information_schema.tables t LEFT JOIN information_schema.table_constraints c
    ON c.table_schema=t.table_schema AND c.table_name=t.table_name AND c.constraint_type='PRIMARY KEY'
    WHERE t.table_schema=$1 AND t.table_type='BASE TABLE' GROUP BY t.table_name ORDER BY t.table_name`, [q.schema]);
  assert.deepEqual(result.rows.map(r => r.table_name), ['auction_results','auctions','bid_commitments','bids','categories','item_images','items','private_auction_access','user_sessions','users']);
  assert.ok(result.rows.every(row => row.primary_keys === 1));
});

check('DB-02: account, category and session identifiers are unique; account roles are constrained', async () => {
  const email = (await q.pool.query('SELECT email FROM users WHERE id=$1', [q.seller.id])).rows[0].email;
  await assert.rejects(q.pool.query("INSERT INTO users(name,email,password_hash) VALUES('Duplicate',$1,'fixture')", [email]), expectSqlCode('23505'));
  await assert.rejects(q.pool.query("UPDATE users SET role='SELLER' WHERE id=$1", [q.seller.id]), expectSqlCode('23514'));
  await assert.rejects(q.pool.query("INSERT INTO categories(name) VALUES('QA synthetic category')"), expectSqlCode('23505'));
  await assert.rejects(q.pool.query('INSERT INTO user_sessions(user_id,token_hash,expires_at) SELECT user_id,token_hash,expires_at FROM user_sessions LIMIT 1'), expectSqlCode('23505'));
});

check('DB-03: foreign keys reject orphan listings, images, sessions, bids and grants', async () => {
  const a = await q.auction();
  const orphan = randomUUID();
  const statements = [
    ["INSERT INTO items(seller_id,category_id,title,description) VALUES($1,$2,'Orphan','Fixture')", [orphan,q.category.id]],
    ["INSERT INTO items(seller_id,category_id,title,description) VALUES($1,$2,'Orphan','Fixture')", [q.seller.id,orphan]],
    ["INSERT INTO item_images(item_id,image_url) VALUES($1,'/qa/not-real.jpg')", [orphan]],
    ["INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES($1,'orphan',now())", [orphan]],
    ['INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,1000,$3)', [orphan,q.bidder.id,randomUUID()]],
    ['INSERT INTO private_auction_access(auction_id,user_id) VALUES($1,$2)', [a.id,orphan]],
  ];
  for (const [sql, params] of statements) await assert.rejects(q.pool.query(sql, params), expectSqlCode('23503'));
});

check('DB-04: all listing, auction, visibility and commitment status enums reject invalid values', async () => {
  const a = await q.auction();
  const c = await q.commitment(a);
  for (const [sql, params] of [
    ["UPDATE items SET status='SOLD' WHERE id=$1", [a.item_id]],
    ["UPDATE auctions SET status='PAUSED' WHERE id=$1", [a.id]],
    ["UPDATE auctions SET visibility='VIP' WHERE id=$1", [a.id]],
    ["UPDATE bid_commitments SET status='APPROVED' WHERE id=$1", [c.id]],
  ]) await assert.rejects(q.pool.query(sql, params), expectSqlCode('23514'));
});

check('DB-05: prices/increments are positive and auction end must follow start', async () => {
  const a = await q.auction();
  for (const sql of [
    'UPDATE auctions SET starting_price=0 WHERE id=$1',
    'UPDATE auctions SET current_price=-1 WHERE id=$1',
    'UPDATE auctions SET minimum_increment=0 WHERE id=$1',
    'UPDATE auctions SET end_time=start_time WHERE id=$1',
  ]) await assert.rejects(q.pool.query(sql, [a.id]), expectSqlCode('23514'));
  await assert.rejects(q.pool.query('INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,0,$3)', [a.id,q.bidder.id,randomUUID()]), expectSqlCode('23514'));
});

check('DB-06: one auction per listing; private codes require hashes and public codes must be null', async () => {
  const a = await q.auction();
  await assert.rejects(q.pool.query(`INSERT INTO auctions(item_id,visibility,starting_price,current_price,minimum_increment,start_time,end_time)
    SELECT item_id,visibility,starting_price,current_price,minimum_increment,start_time,end_time FROM auctions WHERE id=$1`, [a.id]), expectSqlCode('23505'));
  await assert.rejects(q.pool.query("UPDATE auctions SET access_code_hash='raw-fixture' WHERE id=$1", [a.id]), expectSqlCode('23514'));
  await assert.rejects(q.pool.query("UPDATE auctions SET visibility='PRIVATE' WHERE id=$1", [a.id]), expectSqlCode('23514'));
  const privateAuction = await q.auction({ visibility: 'PRIVATE' });
  assert.notEqual(privateAuction.access_code_hash, privateAuction.accessCode);
});

check('DB-07: a user can have only one private grant and one commitment per auction', async () => {
  const a = await q.auction({ visibility: 'PRIVATE' });
  await q.grant(a);
  await assert.rejects(q.pool.query('INSERT INTO private_auction_access(auction_id,user_id) VALUES($1,$2)', [a.id,q.bidder.id]), expectSqlCode('23505'));
  await q.commitment(a);
  await assert.rejects(q.pool.query("INSERT INTO bid_commitments(auction_id,user_id,status) VALUES($1,$2,'PENDING')", [a.id,q.bidder.id]), expectSqlCode('23505'));
});

check('DB-08 / QA-09: request UUID is globally unique and money uses numeric(14,2)', async () => {
  const a = await q.auction({ price: 1000.01, increment: 0.01 });
  const request = randomUUID();
  await q.pool.query('INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,1000.01,$3)', [a.id,q.bidder.id,request]);
  await assert.rejects(q.pool.query('INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,1001,$3)', [a.id,q.bidder2.id,request]), expectSqlCode('23505'));
  const fields = (await q.pool.query(`SELECT numeric_precision,numeric_scale FROM information_schema.columns
    WHERE table_schema=$1 AND data_type='numeric'`, [q.schema])).rows;
  assert.equal(fields.length, 4);
  assert.ok(fields.every(field => field.numeric_precision === 14 && field.numeric_scale === 2));
});

check('DB-09 / QA-20: composite foreign key prevents a winner from another auction', async () => {
  const a = await q.auction(), b = await q.auction();
  const bid = (await q.pool.query('INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,1000,$3) RETURNING id', [a.id,q.bidder.id,randomUUID()])).rows[0];
  await assert.rejects(q.pool.query('INSERT INTO auction_results(auction_id,winner_bid_id) VALUES($1,$2)', [b.id,bid.id]), expectSqlCode('23503'));
  await q.pool.query('INSERT INTO auction_results(auction_id,winner_bid_id) VALUES($1,$2)', [a.id,bid.id]);
  assert.equal((await q.state(b)).result_count, 0);
});

check('DB-10 / QA-12/13: nullable winner supports no bids; result is unique per auction', async () => {
  const a = await q.auction();
  await q.pool.query('INSERT INTO auction_results(auction_id,winner_bid_id) VALUES($1,NULL)', [a.id]);
  await assert.rejects(q.pool.query('INSERT INTO auction_results(auction_id) VALUES($1)', [a.id]), expectSqlCode('23505'));
  assert.equal((await q.pool.query('SELECT winner_bid_id FROM auction_results WHERE auction_id=$1', [a.id])).rows[0].winner_bid_id, null);
});

check('DB-11: deleting an unauctioned item cascades its image references; deleting a free account cascades sessions', async () => {
  const listing = await q.item();
  await q.pool.query("INSERT INTO item_images(item_id,image_url) VALUES($1,'/qa/fixture.jpg')", [listing.id]);
  await q.pool.query('DELETE FROM items WHERE id=$1', [listing.id]);
  assert.equal((await q.pool.query('SELECT count(*)::int AS n FROM item_images WHERE item_id=$1', [listing.id])).rows[0].n, 0);
  const user = await q.account();
  await q.pool.query('DELETE FROM users WHERE id=$1', [user.id]);
  assert.equal((await q.pool.query('SELECT count(*)::int AS n FROM user_sessions WHERE user_id=$1', [user.id])).rows[0].n, 0);
});

check('DB-12: timestamps are timezone-aware and the four defined lookup indexes exist', async () => {
  const timestamps = (await q.pool.query("SELECT data_type FROM information_schema.columns WHERE table_schema=$1 AND column_name IN ('created_at','expires_at','start_time','end_time','closed_at','granted_at','reviewed_at')", [q.schema])).rows;
  assert.equal(timestamps.length, 9);
  assert.ok(timestamps.every(field => field.data_type === 'timestamp with time zone'));
  const indexes = (await q.pool.query("SELECT indexname FROM pg_indexes WHERE schemaname=$1 AND indexname LIKE 'idx_%'", [q.schema])).rows.map(row => row.indexname).sort();
  assert.deepEqual(indexes, ['idx_auctions_status_end','idx_bids_auction_time','idx_commitments_user','idx_items_seller']);
});
