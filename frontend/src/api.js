export class ApiError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const messages = {
  DUPLICATE_EMAIL: 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول باستخدامه.',
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  INVALID_INPUT: 'تحقق من البيانات المدخلة وحاول مجددًا.',
  UNAUTHORIZED: 'انتهت جلسة الدخول. سجّل الدخول مجددًا.',
  FORBIDDEN: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
  NETWORK_ERROR: 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مجددًا.',
  TIMEOUT: 'استغرق الاتصال وقتًا أطول من المتوقع. حاول مجددًا.',
  INVALID_RESPONSE: 'تعذر قراءة استجابة الخادم. حاول مجددًا.',
  NOT_FOUND: 'المزاد المطلوب غير متاح.',
  BANK_SANDBOX_UNAVAILABLE: 'تأكيد المشاركة غير متاح حاليًا. لم يتم اعتماد المشاركة أو إرسال مزايدة.',
};

export const errorMessage = error => messages[error?.code]
  || 'تعذر إتمام الطلب. حاول مجددًا.';

export async function requestApi(path, { token, body, signal, method = 'GET', timeout = 10000 } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
  try {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
      cache: 'no-store',
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new ApiError('INVALID_RESPONSE', response.status); }
    if (!response.ok) throw new ApiError(payload?.error?.code || 'INTERNAL_ERROR', response.status);
    if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
      throw new ApiError('INVALID_RESPONSE', response.status);
    }
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('TIMEOUT');
    if (signal?.aborted) throw error;
    throw new ApiError('NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
