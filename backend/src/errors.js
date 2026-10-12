export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function fail(status, code, message) {
  return new ApiError(status, code, message);
}
export function errorHandler(error, _req, res, _next) {
  if (error.name === 'ZodError')
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'تحقق من الحقول المطلوبة وصيغة البيانات.' },
    });
  if (error.code?.startsWith('LIMIT_'))
    return res.status(400).json({
      error: { code: 'INVALID_IMAGE', message: 'يسمح بحد أقصى 6 صور، وحجم 5 MB لكل صورة.' },
    });
  if (error.status && error.code)
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  if (error.code === '23505')
    return res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'يوجد سجل سابق بهذه البيانات.' } });
  if (['23503', '23514', '22P02', '22003'].includes(error.code))
    return res
      .status(400)
      .json({ error: { code: 'INVALID_DATA', message: 'البيانات غير صالحة.' } });
  if (error.type === 'entity.parse.failed')
    return res
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'صيغة الطلب غير صالحة.' } });
  console.error(JSON.stringify({ event: 'request_failed', code: error.code || 'INTERNAL_ERROR' }));
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'تعذر إتمام الطلب. حاول مرة أخرى.' } });
}
