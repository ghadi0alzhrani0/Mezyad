import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { transaction } from './db.js';
import {
  uuid,
  auctionSchema,
  accessSchema,
  bidSchema,
  pageSchema,
  cents,
  decimal,
} from './validation.js';
import { hashToken, randomToken } from './security.js';
import { fail } from './errors.js';
import { verifiedOperation } from './banking.js';
import { listingDetails } from './listings.js';

export async function lockedAuction(db, id, user) {
  const { rows } = await db.query(
    `SELECT a.*,i.seller_id FROM auctions a JOIN items i ON i.id=a.item_id WHERE a.id=$1 FOR UPDATE OF a`,
    [id]
  );
  const auction = rows[0];
  if (!auction || !(await authorized(db, auction, user)))
    throw fail(404, 'NOT_FOUND', 'المزاد غير متاح.');
  return auction;
}
async function authorized(db, auction, user) {
  if (auction.visibility === 'PUBLIC' || user?.id === auction.seller_id || user?.role === 'ADMIN')
    return true;
  if (!user) return false;
  const grant = await db.query(
    'SELECT 1 FROM private_auction_access WHERE auction_id=$1 AND user_id=$2',
    [auction.id, user.id]
  );
  return Boolean(grant.rowCount);
}
export async function serverNow(db) {
  return (await db.query('SELECT clock_timestamp() AS now')).rows[0].now;
}
export function effectiveStatus(auction, now) {
  if (auction.status === 'CLOSED' || now >= auction.end_time) return 'CLOSED';
  return now < auction.start_time ? 'SCHEDULED' : 'ACTIVE';
}
async function finalize(db, auction, now) {
  if (auction.status !== 'CLOSED' && now >= auction.end_time) {
    const winner = await db.query(
      'SELECT id FROM bids WHERE auction_id=$1 ORDER BY amount DESC,created_at,id LIMIT 1',
      [auction.id]
    );
    await db.query(
      'INSERT INTO auction_results(auction_id,winner_bid_id) VALUES($1,$2) ON CONFLICT(auction_id) DO NOTHING',
      [auction.id, winner.rows[0]?.id || null]
    );
    await db.query("UPDATE auctions SET status='CLOSED' WHERE id=$1", [auction.id]);
    auction.status = 'CLOSED';
  } else if (auction.status !== 'CLOSED') {
    const status = effectiveStatus(auction, now);
    if (auction.status !== status)
      await db.query('UPDATE auctions SET status=$2 WHERE id=$1', [auction.id, status]);
    auction.status = status;
  }
}
function hideHash(auction) {
  const { access_code_hash: _hash, ...safe } = auction;
  return safe;
}
export function auctionRoutes(pool, auth, config, bank, accessLimiter) {
  const routes = Router();
  routes.get('/', async (req, res) => {
    const { page, limit } = pageSchema.parse(req.query);
    const category = req.query.category ? uuid.parse(req.query.category) : null;
    const status = req.query.status
      ? z.enum(['SCHEDULED', 'ACTIVE', 'CLOSED']).parse(req.query.status)
      : null;
    const condition = `a.visibility='PUBLIC' AND ($1::uuid IS NULL OR i.category_id=$1) AND ($2::text IS NULL OR CASE WHEN a.status='CLOSED' OR a.end_time<=clock_timestamp() THEN 'CLOSED' WHEN a.start_time>clock_timestamp() THEN 'SCHEDULED' ELSE 'ACTIVE' END=$2)`;
    const { rows } = await pool.query(
      `SELECT a.id,a.visibility,a.current_price,a.starting_price,a.minimum_increment,a.start_time,a.end_time,
      CASE WHEN a.status='CLOSED' OR a.end_time<=clock_timestamp() THEN 'CLOSED' WHEN a.start_time>clock_timestamp() THEN 'SCHEDULED' ELSE 'ACTIVE' END AS status,
      i.title,i.category_id,c.name AS category_name,
      (SELECT im.image_url FROM item_images im WHERE im.item_id=i.id ORDER BY im.id LIMIT 1) AS image_url
      FROM auctions a JOIN items i ON i.id=a.item_id JOIN categories c ON c.id=i.category_id WHERE ${condition}
      ORDER BY a.end_time,a.id LIMIT $3 OFFSET $4`,
      [category, status, limit, (page - 1) * limit]
    );
    const count = await pool.query(
      `SELECT count(*) FROM auctions a JOIN items i ON i.id=a.item_id WHERE ${condition}`,
      [category, status]
    );
    res.json({
      data: {
        auctions: rows,
        pagination: { page, limit, total: Number(count.rows[0].count) },
        serverTime: await serverNow(pool),
      },
    });
  });
  routes.post('/', auth.requireUser, auth.role('USER'), async (req, res) => {
    const input = auctionSchema.parse(req.body);
    const code = input.visibility === 'PRIVATE' ? randomToken() : null;
    const auction = await transaction(pool, async (db) => {
      const { rows } = await db.query('SELECT * FROM items WHERE id=$1 FOR UPDATE', [input.itemId]);
      const item = rows[0];
      if (!item) throw fail(404, 'NOT_FOUND', 'الإعلان غير موجود.');
      if (item.seller_id !== req.user.id)
        throw fail(403, 'FORBIDDEN', 'لا يمكنك إنشاء مزاد لإعلان شخص آخر.');
      if (item.status !== 'APPROVED')
        throw fail(409, 'LISTING_NOT_APPROVED', 'يلزم اعتماد الإعلان قبل إنشاء المزاد.');
      const now = await serverNow(db);
      if (new Date(input.endTime) <= now)
        throw fail(400, 'INVALID_SCHEDULE', 'يجب أن ينتهي المزاد في وقت لاحق.');
      const result = await db.query(
        `INSERT INTO auctions(item_id,visibility,access_code_hash,starting_price,current_price,minimum_increment,start_time,end_time,status) VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8) RETURNING *`,
        [
          input.itemId,
          input.visibility,
          code ? hashToken(code, config.sessionSecret) : null,
          input.startingPrice,
          input.minimumIncrement,
          input.startTime,
          input.endTime,
          new Date(input.startTime) > now ? 'SCHEDULED' : 'ACTIVE',
        ]
      );
      return hideHash(result.rows[0]);
    });
    res.status(201).json({ data: { ...auction, ...(code ? { accessCode: code } : {}) } });
  });
  routes.get('/:id', async (req, res) => {
    const id = uuid.parse(req.params.id);
    const result = await transaction(pool, async (db) => {
      const auction = await lockedAuction(db, id, req.user),
        now = await serverNow(db);
      await finalize(db, auction, now);
      const latest = await db.query(
        'SELECT amount FROM bids WHERE auction_id=$1 ORDER BY amount DESC LIMIT 1',
        [id]
      );
      const saved = await db.query(
        `SELECT r.*,b.amount,b.bidder_id FROM auction_results r LEFT JOIN bids b ON b.id=r.winner_bid_id WHERE r.auction_id=$1`,
        [id]
      );
      return {
        ...hideHash(auction),
        item: await listingDetails(db, auction.item_id),
        minimumNextBid: latest.rowCount
          ? decimal(cents(latest.rows[0].amount) + cents(auction.minimum_increment))
          : auction.starting_price,
        result: saved.rows[0]
          ? {
              auction_id: id,
              winner_bid_id: saved.rows[0].winner_bid_id,
              amount: saved.rows[0].amount,
              closed_at: saved.rows[0].closed_at,
              isWinner: Boolean(req.user && saved.rows[0].bidder_id === req.user.id),
            }
          : null,
        isOwner: req.user?.id === auction.seller_id,
        serverTime: now,
        bankMode: bank.mode,
        realIntegrationVerified: false,
      };
    });
    res.json({ data: result });
  });
  routes.post(
    '/:id/access',
    auth.requireUser,
    auth.role('USER'),
    accessLimiter,
    async (req, res) => {
      const id = uuid.parse(req.params.id),
        input = accessSchema.parse(req.body);
      await transaction(pool, async (db) => {
        const { rows } = await db.query('SELECT * FROM auctions WHERE id=$1 FOR UPDATE', [id]);
        const auction = rows[0],
          hash = hashToken(input.accessCode, config.sessionSecret);
        if (
          !auction ||
          auction.visibility !== 'PRIVATE' ||
          !timingSafeEqual(Buffer.from(hash), Buffer.from(auction.access_code_hash))
        )
          throw fail(404, 'NOT_FOUND', 'المزاد أو رمز الدعوة غير صحيح.');
        await db.query(
          'INSERT INTO private_auction_access(auction_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
          [id, req.user.id]
        );
      });
      res.json({ data: { accessGranted: true } });
    }
  );
  routes.get('/:id/commitment', auth.requireUser, auth.role('USER'), async (req, res) => {
    const id = uuid.parse(req.params.id);
    const commitment = await transaction(pool, async (db) => {
      await lockedAuction(db, id, req.user);
      return (
        (
          await db.query(
            'SELECT id,status,created_at FROM bid_commitments WHERE auction_id=$1 AND user_id=$2',
            [id, req.user.id]
          )
        ).rows[0] || null
      );
    });
    res.json({ data: { commitment, mode: bank.mode, realIntegrationVerified: false } });
  });
  routes.post('/:id/commitment', auth.requireUser, auth.role('USER'), async (req, res) => {
    const id = uuid.parse(req.params.id);
    const input =
      bank.mode === 'mock'
        ? z
            .object({
              scenario: z
                .enum(['success', 'rejected', 'timeout', 'error', 'auth-error', 'invalid-response'])
                .default('success'),
            })
            .strict()
            .parse(req.body || {})
        : z
            .object({})
            .strict()
            .parse(req.body || {});
    const state = await transaction(pool, async (db) => {
      const auction = await lockedAuction(db, id, req.user);
      if (auction.seller_id === req.user.id)
        throw fail(403, 'OWN_AUCTION', 'لا يمكنك المزايدة في مزادك.');
      if (effectiveStatus(auction, await serverNow(db)) === 'CLOSED')
        throw fail(409, 'AUCTION_ENDED', 'انتهى المزاد.');
      const existing = (
        await db.query(
          'SELECT * FROM bid_commitments WHERE auction_id=$1 AND user_id=$2 FOR UPDATE',
          [id, req.user.id]
        )
      ).rows[0];
      if (existing && ['APPROVED', 'PENDING'].includes(existing.status))
        return { commitment: existing, start: false };
      const { rows } = await db.query(
        `INSERT INTO bid_commitments(auction_id,user_id,status) VALUES($1,$2,'PENDING') ON CONFLICT(auction_id,user_id) DO UPDATE SET status='PENDING',sandbox_reference=NULL,created_at=clock_timestamp() RETURNING *`,
        [id, req.user.id]
      );
      return { commitment: rows[0], start: true };
    });
    if (!state.start)
      return res.json({
        data: { commitment: state.commitment, mode: bank.mode, realIntegrationVerified: false },
      });
    try {
      const outcome = await verifiedOperation(
        bank,
        { ...input, userId: req.user.id, auctionId: id },
        config.bankTimeoutMs
      );
      const { rows } = await pool.query(
        'UPDATE bid_commitments SET status=$2,sandbox_reference=$3 WHERE id=$1 RETURNING id,status,created_at',
        [state.commitment.id, outcome.eligible ? 'APPROVED' : 'REJECTED', outcome.reference]
      );
      res
        .status(201)
        .json({ data: { commitment: rows[0], mode: bank.mode, realIntegrationVerified: false } });
    } catch (error) {
      await pool.query(
        "UPDATE bid_commitments SET status='FAILED',sandbox_reference=NULL WHERE id=$1",
        [state.commitment.id]
      );
      throw error;
    }
  });
  routes.post('/:id/bids', auth.requireUser, auth.role('USER'), async (req, res) => {
    const id = uuid.parse(req.params.id),
      input = bidSchema.parse(req.body);
    const bid = await transaction(pool, async (db) => {
      const auction = await lockedAuction(db, id, req.user);
      if (auction.seller_id === req.user.id)
        throw fail(403, 'OWN_AUCTION', 'لا يمكنك المزايدة في مزادك.');
      const now = await serverNow(db);
      if (effectiveStatus(auction, now) !== 'ACTIVE')
        throw fail(
          409,
          now < auction.start_time ? 'AUCTION_NOT_STARTED' : 'AUCTION_ENDED',
          'المزاد غير متاح للمزايدة الآن.'
        );
      if ((await db.query('SELECT 1 FROM bids WHERE request_id=$1', [input.requestId])).rowCount)
        throw fail(409, 'DUPLICATE_REQUEST', 'تم إرسال هذا الطلب سابقًا.');
      const commitment = await db.query(
        "SELECT 1 FROM bid_commitments WHERE auction_id=$1 AND user_id=$2 AND status='APPROVED'",
        [id, req.user.id]
      );
      if (!commitment.rowCount)
        throw fail(403, 'COMMITMENT_REQUIRED', 'أكمل خطوة الالتزام قبل المزايدة.');
      const latest = await db.query(
        'SELECT amount FROM bids WHERE auction_id=$1 ORDER BY amount DESC LIMIT 1',
        [id]
      );
      const minimum = latest.rowCount
        ? cents(latest.rows[0].amount) + cents(auction.minimum_increment)
        : cents(auction.starting_price);
      if (cents(input.amount) < minimum)
        throw fail(409, 'BID_TOO_LOW', `الحد الأدنى للمزايدة هو ${decimal(minimum)} ر.س.`);
      const { rows } = await db.query(
        'INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,$3,$4) RETURNING id,amount,created_at',
        [id, req.user.id, input.amount, input.requestId]
      );
      await db.query("UPDATE auctions SET current_price=$2,status='ACTIVE' WHERE id=$1", [
        id,
        input.amount,
      ]);
      return {
        bidId: rows[0].id,
        amount: rows[0].amount,
        currentPrice: rows[0].amount,
        createdAt: rows[0].created_at,
      };
    });
    res.status(201).json({ data: bid });
  });
  routes.get('/:id/bids', async (req, res) => {
    const id = uuid.parse(req.params.id),
      { page, limit } = pageSchema.parse(req.query);
    const result = await transaction(pool, async (db) => {
      await lockedAuction(db, id, req.user);
      const { rows } = await db.query(
        `SELECT id,amount,created_at,CASE WHEN bidder_id=$2 THEN true ELSE false END AS is_mine FROM bids WHERE auction_id=$1 ORDER BY amount DESC,created_at,id LIMIT $3 OFFSET $4`,
        [id, req.user?.id || null, limit, (page - 1) * limit]
      );
      const count = await db.query('SELECT count(*) FROM bids WHERE auction_id=$1', [id]);
      return { bids: rows, pagination: { page, limit, total: Number(count.rows[0].count) } };
    });
    res.json({ data: result });
  });
  return routes;
}
export function activityRoutes(pool, auth) {
  const routes = Router();
  routes.use(auth.requireUser, auth.role('USER'));
  routes.get('/items', async (req, res) => {
    const { page, limit } = pageSchema.parse(req.query);
    const { rows } = await pool.query(
      `SELECT i.*,a.id AS auction_id FROM items i LEFT JOIN auctions a ON a.item_id=i.id WHERE i.seller_id=$1 ORDER BY i.id LIMIT $2 OFFSET $3`,
      [req.user.id, limit, (page - 1) * limit]
    );
    const count = await pool.query('SELECT count(*) FROM items WHERE seller_id=$1', [req.user.id]);
    res.json({
      data: { items: rows, pagination: { page, limit, total: Number(count.rows[0].count) } },
    });
  });
  routes.get('/auctions', async (req, res) => {
    const { page, limit } = pageSchema.parse(req.query);
    const condition = `i.seller_id=$1 OR EXISTS(SELECT 1 FROM bids b WHERE b.auction_id=a.id AND b.bidder_id=$1) OR EXISTS(SELECT 1 FROM private_auction_access p WHERE p.auction_id=a.id AND p.user_id=$1)`;
    const { rows } = await pool.query(
      `SELECT a.id,a.visibility,a.current_price,a.start_time,a.end_time,i.title,i.seller_id=$1 AS is_owner,
      CASE WHEN a.status='CLOSED' OR a.end_time<=clock_timestamp() THEN 'CLOSED' WHEN a.start_time>clock_timestamp() THEN 'SCHEDULED' ELSE 'ACTIVE' END AS status,
      (SELECT max(b.amount) FROM bids b WHERE b.auction_id=a.id AND b.bidder_id=$1) AS my_bid
      FROM auctions a JOIN items i ON i.id=a.item_id WHERE ${condition} ORDER BY a.end_time,a.id LIMIT $2 OFFSET $3`,
      [req.user.id, limit, (page - 1) * limit]
    );
    const count = await pool.query(
      `SELECT count(*) FROM auctions a JOIN items i ON i.id=a.item_id WHERE ${condition}`,
      [req.user.id]
    );
    res.json({
      data: { auctions: rows, pagination: { page, limit, total: Number(count.rows[0].count) } },
    });
  });
  return routes;
}
