import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { testDatabase } from '../tests/helpers/qa-fixtures.js';

// Opt-in synthetic seed, in a NEW schema only. Never seed bank SUCCESS here.
const url=testDatabase(process.env.TEST_DATABASE_URL);
const schema=process.argv[2] || 'qa_seed';
if(!/^qa_seed(?:_[a-z0-9_]+)?$/.test(schema)) throw new Error('Use qa_seed or qa_seed_<suffix>');
const password=process.env.QA_SEED_PASSWORD || 'Local-QA-Only-2026';
if(Buffer.byteLength(password)<8 || Buffer.byteLength(password)>72) throw new Error('Seed password must be 8–72 UTF-8 bytes');
const pool=new pg.Pool({connectionString:url.toString()});
const client=await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public');
  // CREATE SCHEMA intentionally fails if it exists: no overwrite or destructive reset.
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET LOCAL search_path TO "${schema}",public`);
  await client.query(await readFile(new URL('../../database/migrations/001_schema.sql',import.meta.url),'utf8'));
  await client.query(await readFile(new URL('../../database/seeds/001_categories.sql',import.meta.url),'utf8'));
  const hash=await bcrypt.hash(password,12);
  const users={};
  for(const [name,role,email] of [
    ['QA Seller','USER','qa.seller@example.invalid'],
    ['QA Bidder','USER','qa.bidder@example.invalid'],
    ['QA Second Bidder','USER','qa.second@example.invalid'],
    ['QA Administrator','ADMIN','qa.admin@example.invalid'],
  ]) users[email]=(await client.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',[name,email,hash,role])).rows[0].id;
  const category=(await client.query("SELECT id FROM categories WHERE name='Rare Vehicles'")).rows[0].id;
  const listingIds={},auctionIds={};
  for(const [name,status] of [['pending','PENDING_REVIEW'],['rejected','REJECTED'],['approved','APPROVED'],['private','APPROVED'],['ended','APPROVED'],['future','APPROVED']]) {
    listingIds[name]=(await client.query(`INSERT INTO items(seller_id,category_id,title,description,status,review_reason,reviewed_by,reviewed_at,category_fields)
      VALUES($1,$2,$3,'Fictional QA fixture. No actual item, customer or market facts.',$4,$5,$6,$7,'{"qaFixture":true}') RETURNING id`,
    [users['qa.seller@example.invalid'],category,'QA '+name+' listing',status,status==='REJECTED'?'Correct the description.':null,
      status==='PENDING_REVIEW'?null:users['qa.admin@example.invalid'],status==='PENDING_REVIEW'?null:new Date()])).rows[0].id;
  }
  const privateCode='Local-private-code-only';
  const codeHash=await bcrypt.hash(privateCode,12);
  for(const [name,visibility,start,end] of [
    ['approved','PUBLIC','-1 hour','1 day'],['private','PRIVATE','-1 hour','1 day'],
    ['ended','PUBLIC','-2 hours','-1 hour'],['future','PUBLIC','1 day','2 days'],
  ]) auctionIds[name]=(await client.query(`INSERT INTO auctions(item_id,visibility,access_code_hash,starting_price,current_price,minimum_increment,start_time,end_time)
    VALUES($1,$2,$3,1000,1000,50,clock_timestamp()+$4::interval,clock_timestamp()+$5::interval) RETURNING id`,
  [listingIds[name],visibility,visibility==='PRIVATE'?codeHash:null,start,end])).rows[0].id;
  const bidder=users['qa.bidder@example.invalid'];
  await client.query('INSERT INTO private_auction_access(auction_id,user_id) VALUES($1,$2)',[auctionIds.private,bidder]);
  await client.query("INSERT INTO bid_commitments(auction_id,user_id,status,sandbox_reference) VALUES($1,$2,'PENDING','LOCAL_QA_FIXTURE_NOT_BANK_VERIFIED'),($3,$2,'FAILED','LOCAL_QA_FIXTURE_NOT_BANK_VERIFIED')",
    [auctionIds.approved,bidder,auctionIds.private]);
  await client.query('COMMIT');
  console.log(JSON.stringify({schema,accountEmails:Object.keys(users),listingIds,auctionIds,
    password:'Use QA_SEED_PASSWORD or the documented LOCAL-ONLY default; no password logged',
    privateCode,bankSuccessRecords:0,bidRecords:0,resultRecords:0,
    notice:'All records are synthetic. Existing tables/data are untouched. Use this schema explicitly in DATABASE_URL options.'},null,2));
} catch(error) {
  await client.query('ROLLBACK');
  console.error('Seed failed; transaction rolled back:',error.code || error.message);
  process.exitCode=1;
} finally { client.release(); await pool.end(); }
