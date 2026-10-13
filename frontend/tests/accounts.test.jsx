import React from 'react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../src/auth/AuthProvider.jsx';
import { AccountPanel } from '../src/auth/AccountPanel.jsx';
import { SESSION_KEY, saveSession } from '../src/auth/session.js';

const summary = { id: '00000000-0000-4000-8000-000000000001', name: 'غدي', email: 'ghadi@example.invalid', role: 'USER' };
const session = { token: 'a'.repeat(64), user: summary };
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => status < 400 ? { data } : { error: data } });
const mount = () => render(<AuthProvider><AccountPanel/></AuthProvider>);
const user = () => userEvent.setup();

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async url => {
    if (url.endsWith('/auth/register')) return response(summary, 201);
    if (url.endsWith('/auth/login')) return response(session);
    if (url.endsWith('/auth/logout')) return response({ signedOut: true });
    if (url.endsWith('/me/items')) return response([]);
    throw Error('Unexpected test request: ' + url);
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function fillLogin(actor, password = 'Account-test-2026') {
  await actor.type(screen.getByLabelText('البريد الإلكتروني'), 'ghadi@example.invalid');
  await actor.type(screen.getByLabelText('كلمة المرور'), password);
}

async function fillRegistration(actor) {
  await actor.click(screen.getByRole('button', { name: 'إنشاء حساب', exact: true }));
  await actor.type(screen.getByLabelText('الاسم الكامل'), '  غدي  ');
  await fillLogin(actor);
}

test('empty login validates fields and focuses the first error without sending a request', async () => {
  mount();
  await user().click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  expect(screen.getByLabelText('البريد الإلكتروني')).toHaveFocus();
  expect(screen.getByLabelText('البريد الإلكتروني')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('أدخل كلمة المرور.')).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});

test('registration submits the documented fields, then shows login with a cleared password', async () => {
  const actor = user(); mount(); await fillRegistration(actor);
  await actor.click(screen.getByRole('button', { name: 'إنشاء الحساب', exact: true }));
  expect(await screen.findByText('تم إنشاء حسابك. سجّل الدخول للمتابعة.')).toBeVisible();
  expect(screen.getByLabelText('البريد الإلكتروني')).toHaveValue('ghadi@example.invalid');
  expect(screen.getByLabelText('كلمة المرور')).toHaveValue('');
  const [url, options] = fetch.mock.calls[0];
  expect(url).toMatch(/\/api\/v1\/auth\/register$/);
  expect(JSON.parse(options.body)).toEqual({ name: 'غدي', email: 'ghadi@example.invalid', password: 'Account-test-2026' });
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
});

test('short registration password is rejected without an API request', async () => {
  const actor = user(); mount(); await fillRegistration(actor);
  await actor.clear(screen.getByLabelText('كلمة المرور'));
  await actor.type(screen.getByLabelText('كلمة المرور'), 'short');
  await actor.click(screen.getByRole('button', { name: 'إنشاء الحساب', exact: true }));
  expect(screen.getByText('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.')).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});

test('an invalid registration response does not claim that an account was created', async () => {
  fetch.mockResolvedValue(response(null, 201));
  const actor = user(); mount(); await fillRegistration(actor);
  await actor.click(screen.getByRole('button', { name: 'إنشاء الحساب', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة الخادم.');
  expect(screen.queryByText('تم إنشاء حسابك. سجّل الدخول للمتابعة.')).not.toBeInTheDocument();
  expect(screen.getByLabelText('الاسم الكامل')).toBeVisible();
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
});

test('an invalid login response cannot establish an authenticated session', async () => {
  fetch.mockResolvedValue(response({ token: 'invalid', user: summary }));
  const actor = user(); mount(); await fillLogin(actor);
  await actor.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة الخادم.');
  expect(screen.queryByText('مرحبًا، غدي')).not.toBeInTheDocument();
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
});

test('QA-01: duplicate email shows natural Arabic and keeps the registration form', async () => {
  fetch.mockResolvedValue(response({ code: 'DUPLICATE_EMAIL', message: 'Internal raw message' }, 409));
  const actor = user(); mount(); await fillRegistration(actor);
  await actor.click(screen.getByRole('button', { name: 'إنشاء الحساب', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('هذا البريد الإلكتروني مسجل بالفعل.');
  expect(screen.getByLabelText('الاسم الكامل')).toHaveValue('  غدي  ');
  expect(screen.queryByText('Internal raw message')).not.toBeInTheDocument();
});

test('successful login stores a safe session summary and shows the real account name', async () => {
  const actor = user(); mount(); await fillLogin(actor);
  await actor.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  expect(await screen.findByText('مرحبًا، غدي')).toBeVisible();
  expect(screen.getByRole('button', { name: 'تسجيل الخروج', exact: true })).toBeEnabled();
  expect(JSON.parse(sessionStorage.getItem(SESSION_KEY))).toEqual(session);
  expect(sessionStorage.getItem(SESSION_KEY)).not.toContain('Account-test-2026');
});

test('QA-02: invalid credentials show a useful Arabic message without creating a session', async () => {
  fetch.mockResolvedValue(response({ code: 'INVALID_CREDENTIALS' }, 401));
  const actor = user(); mount(); await fillLogin(actor);
  await actor.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
});

test('pending login disables duplicate submission and shows loading feedback', async () => {
  let finish;
  fetch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const actor = user(); mount(); await fillLogin(actor);
  await actor.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  const pending = screen.getByRole('button', { name: 'جارٍ تسجيل الدخول…', exact: true });
  expect(pending).toBeDisabled();
  await actor.click(pending);
  expect(fetch).toHaveBeenCalledTimes(1);
  finish(response(session));
  expect(await screen.findByText('مرحبًا، غدي')).toBeVisible();
});

test('logout sends the current token, clears storage and returns to login', async () => {
  saveSession(session); mount();
  await screen.findByText('مرحبًا، غدي');
  await user().click(screen.getByRole('button', { name: 'تسجيل الخروج', exact: true }));
  expect(await screen.findByText('تم تسجيل الخروج.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true })).toBeEnabled();
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  const [, options] = fetch.mock.calls.find(([url]) => url.endsWith('/auth/logout'));
  expect(options.headers.Authorization).toBe('Bearer ' + session.token);
});

test('failed logout preserves the session and allows a retry', async () => {
  saveSession(session); mount(); await screen.findByText('مرحبًا، غدي');
  fetch.mockRejectedValueOnce(new TypeError('Network unavailable'));
  await user().click(screen.getByRole('button', { name: 'تسجيل الخروج', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('تعذر الاتصال بالخادم.');
  expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
  expect(screen.getByRole('button', { name: 'تسجيل الخروج', exact: true })).toBeEnabled();
  expect(screen.queryByText('تم تسجيل الخروج.')).not.toBeInTheDocument();
});

test('page reload validates the stored token on the server before showing the account', async () => {
  saveSession(session); let finish;
  fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  mount();
  expect(screen.getByRole('status')).toHaveTextContent('جارٍ التحقق من جلسة الدخول…');
  expect(screen.queryByText('مرحبًا، غدي')).not.toBeInTheDocument();
  finish(response([]));
  expect(await screen.findByText('مرحبًا، غدي')).toBeVisible();
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer ' + session.token);
});

test('expired stored session is cleared and presents login with an explanation', async () => {
  saveSession(session);
  fetch.mockResolvedValueOnce(response({ code: 'UNAUTHORIZED' }, 401));
  mount();
  expect(await screen.findByText('انتهت جلسة الدخول. سجّل الدخول مجددًا.')).toBeVisible();
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  expect(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true })).toBeEnabled();
});

test('unavailable session validation offers retry rather than pretending the user is authenticated', async () => {
  saveSession(session); fetch.mockRejectedValueOnce(new TypeError('Offline')); mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('تعذر التحقق من جلسة الدخول.');
  expect(screen.queryByText('مرحبًا، غدي')).not.toBeInTheDocument();
  expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
  await user().click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
  expect(await screen.findByText('مرحبًا، غدي')).toBeVisible();
});

test('malformed stored session is ignored safely', async () => {
  sessionStorage.setItem(SESSION_KEY, '{broken'); mount();
  expect(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true })).toBeEnabled();
  expect(fetch).not.toHaveBeenCalled();
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
});

test('password visibility is explicit and changing account mode clears the password', async () => {
  const actor = user(); mount(); await fillLogin(actor);
  const input = screen.getByLabelText('كلمة المرور');
  expect(input).toHaveAttribute('type', 'password');
  await actor.click(screen.getByRole('button', { name: 'إظهار كلمة المرور' }));
  expect(input).toHaveAttribute('type', 'text');
  await actor.click(screen.getByRole('button', { name: 'إنشاء حساب', exact: true }));
  expect(screen.getByLabelText('كلمة المرور')).toHaveValue('');
  expect(screen.getByLabelText('كلمة المرور')).toHaveAttribute('type', 'password');
});
