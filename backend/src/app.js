import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { root } from './config.js';
import { authentication } from './auth.js';
import { listingRoutes, reviewRoute } from './listings.js';
import { auctionRoutes, activityRoutes } from './auctions.js';
import { createBankAdapter } from './banking.js';
import { errorHandler, fail } from './errors.js';
export function createApp({ pool, config, bank = createBankAdapter(config), limits = true }) {
  const app = express();
  const allowedOrigins = new Set([config.frontendOrigin]);
  if (config.nodeEnv === 'development') {
    const frontend = new URL(config.frontendOrigin);
    for (const host of ['localhost', '127.0.0.1']) {
      allowedOrigins.add(`http://${host}:${config.port}`);
      if (['localhost', '127.0.0.1'].includes(frontend.hostname))
        allowedOrigins.add(`${frontend.protocol}//${host}:${frontend.port}`);
    }
  }
  app.disable('x-powered-by');
  app.use(helmet(), express.json({ limit: '32kb' }), cookieParser());
  app.use((req, _res, next) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.get('origin') &&
      !allowedOrigins.has(req.get('origin'))
    )
      return next(fail(403, 'INVALID_ORIGIN', 'مصدر الطلب غير مسموح.'));
    next();
  });
  const auth = authentication(pool, config);
  app.use(auth.optional);
  const limiter = (limit, windowMs) =>
    limits
      ? rateLimit({
          windowMs,
          limit,
          standardHeaders: 'draft-8',
          legacyHeaders: false,
          handler: (_req, res) =>
            res.status(429).json({
              error: {
                code: 'RATE_LIMITED',
                message: 'طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا.',
              },
            }),
        })
      : (_req, _res, next) => next();
  app.use('/api/v1/auth', limiter(30, 60000), auth.routes);
  app.use('/api/v1/items', listingRoutes(pool, auth, config));
  app.post(
    '/api/v1/admin/items/:id/review',
    auth.requireUser,
    auth.role('ADMIN'),
    reviewRoute(pool)
  );
  app.use('/api/v1/auctions', auctionRoutes(pool, auth, config, bank, limiter(10, 60000)));
  app.use('/api/v1/me', activityRoutes(pool, auth));
  app.get('/uploads/:filename', async (req, res) => {
    if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(req.params.filename))
      throw fail(404, 'NOT_FOUND', 'الصورة غير متاحة.');
    const { rows } = await pool.query(
      `SELECT 1 FROM item_images im JOIN items i ON i.id=im.item_id LEFT JOIN auctions a ON a.item_id=i.id WHERE im.image_url=$1 AND (i.seller_id=$2 OR $3='ADMIN' OR a.visibility='PUBLIC' OR EXISTS(SELECT 1 FROM private_auction_access p WHERE p.auction_id=a.id AND p.user_id=$2))`,
      [`/uploads/${req.params.filename}`, req.user?.id || null, req.user?.role || null]
    );
    if (!rows.length) throw fail(404, 'NOT_FOUND', 'الصورة غير متاحة.');
    res
      .set('Cache-Control', 'private, no-store')
      .sendFile(path.join(config.uploadDir, req.params.filename), (error) => {
        if (error && !res.headersSent)
          res.status(404).json({ error: { code: 'NOT_FOUND', message: 'الصورة غير متاحة.' } });
      });
  });
  app.use('/api', (_req, _res, next) => next(fail(404, 'NOT_FOUND', 'المسار غير موجود.')));
  const dist = path.join(root, 'frontend/dist');
  if (existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use((_req, _res, next) => next(fail(404, 'NOT_FOUND', 'المسار غير موجود.')));
  app.use(errorHandler);
  return app;
}
