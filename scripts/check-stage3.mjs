import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const expected = 'ddee288e3f33999b62fa044a8babe3b2747596674decfdb28879c1365b492db4';
const actual = createHash('sha256')
  .update(readFileSync(root + 'Stage_3/Report.MD'))
  .digest('hex');
if (actual !== expected)
  throw new Error('Protected Stage 3 checksum changed. Restore the original before proceeding.');
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'Stage_3/Report.MD'], {
  cwd: root,
  stdio: 'inherit',
});
console.log('Stage 3 unchanged: ' + actual);
