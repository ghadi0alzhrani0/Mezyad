import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const entries = await readdir('backend/src', { recursive: true });
for (const path of entries.filter((p) => p.endsWith('.js')))
  execFileSync(process.execPath, ['--check', 'backend/src/' + path], { stdio: 'inherit' });
console.log('Backend source syntax checked.');
