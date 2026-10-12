export async function api(path, options = {}) {
  const { body, ...rest } = options;
  const isForm = body instanceof FormData;
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      ...(!isForm && body ? { 'Content-Type': 'application/json' } : {}),
      ...rest.headers,
    },
    ...(body ? { body: isForm ? body : JSON.stringify(body) } : {}),
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('تعذر قراءة استجابة الخادم.');
  }
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'تعذر إتمام الطلب.');
    error.code = payload.error?.code;
    error.status = response.status;
    throw error;
  }
  return payload.data;
}
export const money = (value) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value
  );
export const date = (value) =>
  new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
export function decimalCents(value) {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
