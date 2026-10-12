import { Router } from 'express';
import { hashPassword, verifyPassword, hashToken, randomToken, publicUser } from './security.js';
import { registerSchema, loginSchema } from './validation.js';
import { fail } from './errors.js';

export function authentication(pool, config) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/',
    maxAge: 7 * 86400000,
  };
  const optional = async (req, _res, next) => {
    try {
      const token = req.cookies.mezyad_session;
      if (typeof token === 'string' && token.length <= 128) {
        const { rows } = await pool.query(
          `SELECT u.id,u.name,u.email,u.role FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>clock_timestamp()`,
          [hashToken(token, config.sessionSecret)]
        );
        req.user = rows[0];
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  const requireUser = (req, _res, next) => {
    if (!req.user) return next(fail(401, 'UNAUTHENTICATED', 'سجّل الدخول للمتابعة.'));
    next();
  };
  const role = (expected) => (req, _res, next) => {
    if (req.user?.role !== expected)
      return next(fail(403, 'FORBIDDEN', 'ليست لديك صلاحية لهذا الإجراء.'));
    next();
  };
  const routes = Router();
  routes.post('/register', async (req, res) => {
    const input = registerSchema.parse(req.body);
    const password = await hashPassword(input.password);
    try {
      const { rows } = await pool.query(
        'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role',
        [input.name, input.email, password]
      );
      res.status(201).json({ data: publicUser(rows[0]) });
    } catch (error) {
      if (error.code === '23505')
        throw fail(409, 'EMAIL_EXISTS', 'البريد الإلكتروني مسجّل مسبقًا.');
      throw error;
    }
  });
  routes.post('/login', async (req, res) => {
    const input = loginSchema.parse(req.body);
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [input.email]);
    // Use a real dummy hash to avoid skipping expensive verification for unknown email.
    const dummy = config.dummyPasswordHash ?? (await hashPassword(randomToken()));
    const valid = await verifyPassword(input.password, rows[0]?.password_hash ?? dummy);
    if (!valid || !rows[0])
      throw fail(401, 'INVALID_CREDENTIALS', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    const token = randomToken();
    await pool.query(
      "INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES($1,$2,clock_timestamp()+interval '7 days')",
      [rows[0].id, hashToken(token, config.sessionSecret)]
    );
    res.cookie('mezyad_session', token, cookieOptions).json({ data: publicUser(rows[0]) });
  });
  routes.post('/logout', requireUser, async (req, res) => {
    await pool.query('DELETE FROM user_sessions WHERE token_hash=$1', [
      hashToken(req.cookies.mezyad_session, config.sessionSecret),
    ]);
    res
      .clearCookie('mezyad_session', { ...cookieOptions, maxAge: undefined })
      .json({ data: { signedOut: true } });
  });
  return { optional, requireUser, role, routes };
}
