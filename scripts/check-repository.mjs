import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from '../backend/src/config.js';
import './check-stage3.mjs';
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);
const failures = [];
const tokenPatterns = [
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{40,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
for (const file of files) {
  if (
    /(^|\/)(node_modules|dist|coverage|uploads|\.env|playwright-report|test-results)(\/|$)/.test(
      file
    )
  )
    failures.push(`${file}: generated/local file included`);
  const info = await stat(path.join(root, file));
  if (!info.isFile() || info.size > 5 * 1024 * 1024) continue;
  const text = await readFile(path.join(root, file), 'utf8');
  if (tokenPatterns.some((pattern) => pattern.test(text)))
    failures.push(`${file}: possible credential (contents redacted)`);
  if (!/\.md$/i.test(file)) continue;
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split(/\s+"/)[0].replace(/^<|>$/g, '');
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const destination = decodeURIComponent(target.split('#')[0]);
    if (destination)
      try {
        await stat(path.resolve(root, path.dirname(file), destination));
      } catch {
        failures.push(`${file}: missing relative link ${destination}`);
      }
  }
}
// SQL files and report are the only schema sources, no generated migration trees.
const migrations = await readdir(path.join(root, 'database/migrations'));
if (!migrations.some((f) => f.endsWith('.sql'))) failures.push('No migrations found');
if (failures.length) throw new Error(failures.join('\n'));
console.log(
  `Checked ${files.length} repository files: relative links, known credential patterns, generated-file exclusions and protected Stage 3.`
);
