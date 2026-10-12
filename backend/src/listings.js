import { Router } from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { listingInput, uuid, reviewSchema, pageSchema } from './validation.js';
import { categories } from '../../shared/catalog.js';
import { transaction } from './db.js';
import { fail } from './errors.js';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6, fields: 5, fieldSize: 15000 },
}).array('images', 6);

export async function listingDetails(db, id) {
  const { rows } = await db.query(
    `SELECT i.*,c.name AS category_name,a.id AS auction_id,
    COALESCE((SELECT json_agg(json_build_object('id',im.id,'url',im.image_url) ORDER BY im.id) FROM item_images im WHERE im.item_id=i.id),'[]') AS images
    FROM items i JOIN categories c ON c.id=i.category_id LEFT JOIN auctions a ON a.item_id=i.id WHERE i.id=$1`,
    [id]
  );
  return rows[0];
}
function validateFields(input) {
  const category = categories.find((c) => c.id === input.category);
  if (!category) throw fail(400, 'INVALID_CATEGORY', 'اختر قسمًا متاحًا.');
  const definitions = Object.fromEntries(
    category.fields.map(([key, , type]) => [key, type || 'text'])
  );
  if (!Object.keys(input.category_fields).length)
    throw fail(400, 'MISSING_DETAILS', 'أضف تفاصيل المعروض الخاصة بالقسم.');
  for (const [key, value] of Object.entries(input.category_fields)) {
    if (!definitions[key])
      throw fail(400, 'INVALID_DETAILS', 'يوجد حقل لا يتوافق مع القسم المختار.');
    if (
      definitions[key] === 'number' &&
      (!Number.isFinite(Number(value)) || Number(value) < 0 || !String(value).trim())
    )
      throw fail(400, 'INVALID_DETAILS', 'أدخل قيمة رقمية صحيحة.');
    if (definitions[key] === 'text' && (typeof value !== 'string' || !value.trim()))
      throw fail(400, 'INVALID_DETAILS', 'أدخل تفاصيل واضحة للمعروض.');
    if (
      key === 'year' &&
      (!Number.isInteger(Number(value)) ||
        Number(value) < 1886 ||
        Number(value) > new Date().getUTCFullYear() + 1)
    )
      throw fail(400, 'INVALID_DETAILS', 'سنة الصنع غير صالحة.');
  }
}
async function saveImages(files, dir) {
  const validated = [];
  for (const file of files) {
    const type = await fileTypeFromBuffer(file.buffer);
    if (
      !type ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime) ||
      file.mimetype !== type.mime
    )
      throw fail(
        400,
        'INVALID_IMAGE',
        'الصور المسموحة: JPEG وPNG وWebP؛ يجب أن يطابق الملف نوعه المعلن.'
      );
    validated.push({ name: `${randomUUID()}.${type.ext}`, buffer: file.buffer });
  }
  const written = [];
  try {
    await mkdir(dir, { recursive: true });
    for (const file of validated) {
      await writeFile(path.join(dir, file.name), file.buffer, { flag: 'wx' });
      written.push(`/uploads/${file.name}`);
    }
    return written;
  } catch (error) {
    await removeImages(written, dir);
    throw error;
  }
}
async function removeImages(urls, dir) {
  await Promise.all(urls.map((url) => unlink(path.join(dir, path.basename(url))).catch(() => {})));
}
export function listingRoutes(pool, auth, config) {
  const routes = Router();
  routes.use(auth.requireUser);
  routes.get('/', async (req, res) => {
    const { page, limit } = pageSchema.parse(req.query);
    const admin = req.user.role === 'ADMIN';
    const filter = admin ? req.query.status || 'PENDING_REVIEW' : null;
    if (admin && !['PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(filter))
      throw fail(400, 'INVALID_STATUS', 'حالة المراجعة غير صالحة.');
    const condition = admin ? 'i.status=$1' : 'i.seller_id=$1';
    const value = admin ? filter : req.user.id;
    const { rows } = await pool.query(
      `SELECT i.*,a.id AS auction_id,c.name AS category_name FROM items i JOIN categories c ON c.id=i.category_id LEFT JOIN auctions a ON a.item_id=i.id WHERE ${condition} ORDER BY i.id LIMIT $2 OFFSET $3`,
      [value, limit, (page - 1) * limit]
    );
    const count = await pool.query(`SELECT count(*) FROM items i WHERE ${condition}`, [value]);
    res.json({
      data: {
        items: rows,
        user: req.user,
        pagination: { page, limit, total: Number(count.rows[0].count) },
      },
    });
  });
  routes.get('/:id', async (req, res) => {
    const item = await listingDetails(pool, uuid.parse(req.params.id));
    if (!item) throw fail(404, 'NOT_FOUND', 'الإعلان غير موجود.');
    if (item.seller_id !== req.user.id && req.user.role !== 'ADMIN')
      throw fail(403, 'FORBIDDEN', 'لا يمكنك فتح هذا الإعلان.');
    res.json({ data: item });
  });
  routes.post('/', auth.role('USER'), upload, async (req, res) => {
    const input = listingInput(req.body);
    validateFields(input);
    if (!req.files?.length) throw fail(400, 'MISSING_IMAGE', 'أضف صورة واحدة على الأقل.');
    const urls = await saveImages(req.files, config.uploadDir);
    try {
      const item = await transaction(pool, async (db) => {
        const { rows } = await db.query(
          'INSERT INTO items(seller_id,category_id,title,description,category_fields) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [req.user.id, input.category, input.title, input.description, input.category_fields]
        );
        for (const url of urls)
          await db.query('INSERT INTO item_images(item_id,image_url) VALUES($1,$2)', [
            rows[0].id,
            url,
          ]);
        return listingDetails(db, rows[0].id);
      });
      res.status(201).json({ data: item });
    } catch (error) {
      await removeImages(urls, config.uploadDir);
      throw error;
    }
  });
  routes.patch('/:id', auth.role('USER'), upload, async (req, res) => {
    const id = uuid.parse(req.params.id),
      input = listingInput(req.body);
    validateFields(input);
    let urls = [];
    try {
      const item = await transaction(pool, async (db) => {
        const { rows } = await db.query('SELECT * FROM items WHERE id=$1 FOR UPDATE', [id]);
        if (!rows[0]) throw fail(404, 'NOT_FOUND', 'الإعلان غير موجود.');
        if (rows[0].seller_id !== req.user.id)
          throw fail(403, 'FORBIDDEN', 'هذا الإعلان ليس من إعلاناتك.');
        if (rows[0].status !== 'REJECTED')
          throw fail(409, 'LISTING_LOCKED', 'يمكن تعديل الإعلان المرفوض وإعادة إرساله فقط.');
        const count = await db.query('SELECT count(*) FROM item_images WHERE item_id=$1', [id]);
        if (Number(count.rows[0].count) + (req.files?.length || 0) > 6)
          throw fail(400, 'INVALID_IMAGE', 'الحد الأقصى 6 صور للإعلان.');
        urls = await saveImages(req.files || [], config.uploadDir);
        await db.query(
          `UPDATE items SET category_id=$2,title=$3,description=$4,category_fields=$5,status='PENDING_REVIEW',review_reason=NULL,reviewed_by=NULL,reviewed_at=NULL WHERE id=$1`,
          [id, input.category, input.title, input.description, input.category_fields]
        );
        for (const url of urls)
          await db.query('INSERT INTO item_images(item_id,image_url) VALUES($1,$2)', [id, url]);
        return listingDetails(db, id);
      });
      res.json({ data: item });
    } catch (error) {
      await removeImages(urls, config.uploadDir);
      throw error;
    }
  });
  return routes;
}
export function reviewRoute(pool) {
  return async (req, res) => {
    const id = uuid.parse(req.params.id),
      input = reviewSchema.parse(req.body);
    const item = await transaction(pool, async (db) => {
      const { rows } = await db.query('SELECT * FROM items WHERE id=$1 FOR UPDATE', [id]);
      if (!rows[0]) throw fail(404, 'NOT_FOUND', 'الإعلان غير موجود.');
      if (rows[0].status !== 'PENDING_REVIEW')
        throw fail(409, 'ALREADY_REVIEWED', 'تمت مراجعة الإعلان مسبقًا.');
      await db.query(
        'UPDATE items SET status=$2,review_reason=$3,reviewed_by=$4,reviewed_at=clock_timestamp() WHERE id=$1',
        [id, input.decision, input.decision === 'REJECTED' ? input.reason : null, req.user.id]
      );
      return listingDetails(db, id);
    });
    res.json({ data: item });
  };
}
