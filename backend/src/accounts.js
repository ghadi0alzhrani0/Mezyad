import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { auth, hashToken, newToken } from './auth.js';

export const accounts = Router();
accounts.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const failure = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });
const validEmail = email => typeof email === 'string'
  && email.trim().length <= 254
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const validPassword = password => typeof password === 'string'
  && password.length >= 8 && Buffer.byteLength(password, 'utf8') <= 72;

accounts.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || [...name.trim()].length > 160
      || !validEmail(email) || !validPassword(password)) {
      return failure(res, 400, 'INVALID_INPUT',
        'Name, a valid email and a password of 8+ characters (maximum 72 UTF-8 bytes) are required');
    }
    const hash = await bcrypt.hash(password, 12);
    // Public registration always creates USER, regardless of submitted role.
    const { rows } = await query(
      "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'USER') RETURNING id,name,email,role",
      [name.trim(), email.trim().toLowerCase(), hash],
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return failure(res, 409, 'DUPLICATE_EMAIL', 'Email already registered');
    }
    next(error);
  }
});

accounts.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== 'string' || !password
      || Buffer.byteLength(password, 'utf8') > 72) {
      return failure(res, 400, 'INVALID_INPUT', 'Valid email and password required');
    }
    const { rows } = await query('SELECT * FROM users WHERE email=$1', [email.trim().toLowerCase()]);
    if (!rows.length || !await bcrypt.compare(password, rows[0].password_hash)) {
      return failure(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }
    const token = newToken();
    const user = rows[0];
    await query(
      "INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '7 days')",
      [user.id, hashToken(token)],
    );
    res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (error) {
    next(error);
  }
});

accounts.post('/logout', auth, async (req, res, next) => {
  try {
    await query('DELETE FROM user_sessions WHERE token_hash=$1 AND user_id=$2',
      [hashToken(req.token), req.user.id]);
    res.json({ data: { signedOut: true } });
  } catch (error) {
    next(error);
  }
});
