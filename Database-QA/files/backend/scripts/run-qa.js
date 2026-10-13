import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import pg from 'pg';
import { testDatabase } from '../tests/helpers/qa-fixtures.js';

const backend=fileURLToPath(new URL('../',import.meta.url));
const database=testDatabase(process.env.TEST_DATABASE_URL);
const reportFile=new URL('../../Stage_3/Report.MD',import.meta.url);
const checksum=async()=>createHash('sha256').update(await readFile(reportFile)).digest('hex');
const originalChecksum=await checksum();
const timestamp=new Date().toISOString();
const output=path.resolve(process.argv[2] || path.join(os.tmpdir(),'database-qa-'+timestamp.replace(/[:.]/g,'-')));
await mkdir(output,{recursive:true});
const evidence=path.join(output,'junit.xml');
const pool=new pg.Pool({connectionString:database.toString()});
let postgres;
try {
  postgres=(await pool.query('SHOW server_version')).rows[0].server_version;
  // Initialize only the explicitly selected disposable DB for existing account regression tests.
  await pool.query(await readFile(new URL('../../database/migrations/001_schema.sql',import.meta.url),'utf8'));
} finally { await pool.end(); }
const files=(await readdir(path.join(backend,'tests'))).filter(file=>file.endsWith('.test.js')).sort().map(file=>'tests/'+file);
files.push(...(await readdir(path.join(backend,'tests/acceptance'))).filter(file=>file.startsWith('qa.')&&file.endsWith('.test.js')).sort().map(file=>'tests/acceptance/'+file));
const args=['--test','--test-concurrency=1','--test-reporter=spec','--test-reporter=junit',
  '--test-reporter-destination=stdout','--test-reporter-destination='+evidence,...files];
const started=Date.now();
const result=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,args,{cwd:backend,env:process.env,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  child.stdout.on('data',chunk=>{stdout+=chunk; process.stdout.write(chunk);});
  child.stderr.on('data',chunk=>{stderr+=chunk; process.stderr.write(chunk);});
  child.on('error',reject);
  child.on('close',(code,signal)=>resolve({code,signal,stdout,stderr}));
});
await writeFile(path.join(output,'stdout.txt'),result.stdout);
await writeFile(path.join(output,'stderr.txt'),result.stderr);
const count=name=>Number(result.stdout.match(new RegExp('(?:ℹ|#) '+name+' (\\d+)'))?.[1] ?? NaN);
const finalChecksum=await checksum();
const sourceHashes={};
for(const file of ['src/app.js','src/db.js','src/auth.js','src/accounts.js','src/money.js',...files])
  sourceHashes[file]=createHash('sha256').update(await readFile(path.join(backend,file))).digest('hex');
const summary={dateUtc:timestamp,executor:'Local automated QA execution; individual execution is not inferred',
  node:process.version,postgres,platform:os.platform(),arch:os.arch(),
  command:'node '+args.map(arg=>arg.startsWith('--test-reporter-destination=')&&!arg.endsWith('stdout')?'--test-reporter-destination=<evidence>/junit.xml':arg).join(' '),
  exitCode:result.code,signal:result.signal,durationMs:Date.now()-started,
  runnerEntries:count('tests'),passed:count('pass'),failed:count('fail'),skipped:count('skipped'),cancelled:count('cancelled'),
  countNote:'Runner totals include the existing account integration parent; skipped banking/browser gates are not passes.',
  stage3Sha256Before:originalChecksum,stage3Sha256After:finalChecksum,stage3Unchanged:originalChecksum===finalChecksum,
  banking:'Not tested against a genuine provider. SUCCESS fixtures are synthetic database setup only.',sourceHashes};
await writeFile(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('\nEvidence saved to '+output);
if(originalChecksum!==finalChecksum) throw new Error('Protected Stage 3 changed during QA');
process.exitCode=result.code ?? 1;
