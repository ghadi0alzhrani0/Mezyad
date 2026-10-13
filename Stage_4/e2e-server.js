import {createRequire} from 'node:module';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
const requireBackend=createRequire(new URL('../../backend/package.json',import.meta.url));
const {Pool}=requireBackend('pg'),bcrypt=requireBackend('bcryptjs');
if(!process.env.TEST_DATABASE_URL)throw new Error('Set a disposable TEST_DATABASE_URL ending in _test');
const url=new URL(process.env.TEST_DATABASE_URL);if(!url.pathname.endsWith('_test'))throw new Error('Database name must end in _test');
const schema='frontend_browser_'+randomBytes(6).toString('hex'),control=new Pool({connectionString:url.toString()});
await control.query('CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public');await control.query(`CREATE SCHEMA "${schema}"`);
url.searchParams.set('options',`-c search_path=${schema},public`);process.env.DATABASE_URL=url.toString();process.env.FRONTEND_ORIGIN='http://127.0.0.1:44018';
const {app}=await import('../../backend/src/app.js'),{pool}=await import('../../backend/src/db.js');
await pool.query(await readFile(new URL('../../database/migrations/001_schema.sql',import.meta.url),'utf8'));
const hash=await bcrypt.hash('Browser-QA-Only-2026',12),users={};
for(const role of ['seller','bidder','admin'])users[role]=(await pool.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',
  ['Synthetic '+role,role+'@example.invalid',hash,role==='admin'?'ADMIN':'USER'])).rows[0].id;
const category=(await pool.query("INSERT INTO categories(name) VALUES('Rare Vehicles') RETURNING id")).rows[0].id;
const fixtures={schema,users,category,auctions:{},items:{},password:'Browser-QA-Only-2026',notice:'Synthetic local fixtures only; SUCCESS commitments are NOT BANK VERIFIED.'};
for(const [key,status,visibility,end,commitment] of [['public','APPROVED','PUBLIC','1 hour',false],['private','APPROVED','PRIVATE','1 hour',false],['eligible','APPROVED','PUBLIC','1 hour',true],['empty','APPROVED','PUBLIC','-1 second',false],['pending','PENDING_REVIEW',null,null,false],['rejected','REJECTED',null,null,false],['approved','APPROVED',null,null,false]]){
  const item=(await pool.query("INSERT INTO items(seller_id,category_id,title,description,status,review_reason) VALUES($1,$2,$3,'Synthetic fixture; no real item or customer',$4,$5) RETURNING id",[users.seller,category,'QA '+key,status,status==='REJECTED'?'Correct the description.':null])).rows[0].id;fixtures.items[key]=item;
  if(!visibility)continue;
  await pool.query("INSERT INTO item_images(item_id,image_url) VALUES($1,'/images/porsche-carrera-gt.jpg')",[item]);
  const auction=(await pool.query(`INSERT INTO auctions(item_id,visibility,access_code_hash,starting_price,current_price,minimum_increment,start_time,end_time,status) VALUES($1,$2,$3,1000,1000,50,clock_timestamp()-interval '1 hour',clock_timestamp()+$4::interval,'ACTIVE') RETURNING id`,[item,visibility,visibility==='PRIVATE'?await bcrypt.hash('local-private-qa',12):null,end])).rows[0].id;fixtures.auctions[key]=auction;
  if(commitment)await pool.query("INSERT INTO bid_commitments(auction_id,user_id,status,sandbox_reference) VALUES($1,$2,'SUCCESS','LOCAL_BROWSER_FIXTURE_NOT_BANK_VERIFIED')",[auction,users.bidder]);
}
const output=process.env.E2E_FIXTURE_FILE||path.join(os.tmpdir(),'frontend-browser-fixtures.json');await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(fixtures,null,2));
const server=app.listen(44017,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const vite=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),'--host','127.0.0.1','--port','44018','--strictPort'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,VITE_API_URL:'http://127.0.0.1:44017'},stdio:'inherit'});
let stopping=false;
async function stop(){if(stopping)return;stopping=true;vite.kill('SIGTERM');server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await pool.end();await control.query(`DROP SCHEMA "${schema}" CASCADE`);await control.end();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);vite.on('exit',()=>{if(!stopping)stop();});
