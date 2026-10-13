import { afterEach, expect, test, vi } from 'vitest';
import { ApiError, errorMessage, requestApi } from '../src/api.js';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

test('API client uses the configured response contract and authorization header', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: { signedOut: true } }) })));
  expect(await requestApi('/api/v1/auth/logout', { method: 'POST', token: 'test-token' })).toEqual({ signedOut: true });
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  expect(fetch.mock.calls[0][1].cache).toBe('no-store');
});

test('HTTP errors keep their code and status without exposing a raw server message', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ error: { code: 'FORBIDDEN', message: 'secret internals' } }) })));
  await expect(requestApi('/api/v1/me/items')).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  expect(errorMessage(new ApiError('FORBIDDEN', 403))).toBe('لا تملك صلاحية تنفيذ هذا الإجراء.');
});

test('invalid successful response does not create a false success', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ unexpected: true }) })));
  await expect(requestApi('/api/v1/auth/login')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});

test('network failures receive a clear, recoverable error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('connection refused'); }));
  await expect(requestApi('/api/v1/auth/login')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
});

test('slow requests are aborted and reported as a timeout', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  })));
  const promise = expect(requestApi('/api/v1/auth/login', { timeout: 50 })).rejects.toMatchObject({ code: 'TIMEOUT' });
  await vi.advanceTimersByTimeAsync(51);
  await promise;
});
