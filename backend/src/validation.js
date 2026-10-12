import { z } from 'zod';
export const uuid = z.uuid();
export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(10).max(128),
  })
  .strict();
export const loginSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
export const listingSchema = z
  .object({
    category: uuid,
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(5).max(10000),
    category_fields: z
      .record(
        z.string().min(1).max(50),
        z.union([z.string().max(500), z.number().finite(), z.boolean()])
      )
      .refine((v) => Object.keys(v).length <= 20),
  })
  .strict();
export function listingInput(body) {
  let fields = body.category_fields;
  if (typeof fields === 'string') {
    try {
      fields = JSON.parse(fields);
    } catch {
      fields = null;
    }
  }
  return listingSchema.parse({
    category: body.category,
    title: body.title,
    description: body.description,
    category_fields: fields,
  });
}
export const moneySchema = z
  .union([z.string(), z.number().finite()])
  .transform(String)
  .refine(
    (v) => /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(v),
    'Use a decimal amount with at most two fractional digits.'
  )
  .transform((v) => {
    const [whole, fraction = ''] = v.split('.');
    return whole + '.' + fraction.padEnd(2, '0');
  })
  .refine((v) => v !== '0.00', 'Amount must be positive.');
export function cents(value) {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
export function decimal(value) {
  return String(value / 100n) + '.' + String(value % 100n).padStart(2, '0');
}
export const auctionSchema = z
  .object({
    itemId: uuid,
    visibility: z.enum(['PUBLIC', 'PRIVATE']),
    startingPrice: moneySchema,
    minimumIncrement: moneySchema,
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine((x) => new Date(x.endTime) > new Date(x.startTime), 'End must follow start.');
export const bidSchema = z.object({ amount: moneySchema, requestId: uuid }).strict();
export const reviewSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((x) => x.decision !== 'REJECTED' || Boolean(x.reason), 'Rejection requires a reason.');
export const accessSchema = z.object({ accessCode: z.string().min(1).max(128) }).strict();
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
