import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 });
  return 'scrypt$' + salt + '$' + key.toString('hex');
}
export async function verifyPassword(password, value) {
  const [algorithm, salt, hash] = value.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const key = await scrypt(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 });
  const stored = Buffer.from(hash, 'hex');
  return stored.length === key.length && timingSafeEqual(stored, key);
}
export function hashToken(token, secret) {
  return createHmac('sha256', secret).update(token).digest('hex');
}
export function randomToken() {
  return randomBytes(32).toString('base64url');
}
export function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}
