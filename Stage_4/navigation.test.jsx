import React from 'react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.jsx';
import { AuthProvider } from '../src/auth/AuthProvider.jsx';
import { saveSession } from '../src/auth/session.js';
import { Countdown, AuctionList } from '../src/ui/Auctions.jsx';

const car = { id: '20000000-0000-4000-8000-000000000002', title: 'بورش كاريرا GT — 2005', category_name: 'Rare Vehicles', image_url: '/images/porsche-carrera-gt.jpg', images: ['/images/porsche-carrera-gt.jpg'], current_price: '4200000', status: 'ACTIVE', bid_count: 0, end_time: '2030-01-01T00:00:00Z', description: 'وصف السيارة' };
const villa = { ...car, id: '20000000-0000-4000-8000-000000000001', title: 'فيلا في حي حطين', category_name: 'Real Estate', image_url: '/images/hittin-villa.jpg', images: ['/images/hittin-villa.jpg'] };
const session = { token: 'a'.repeat(64), user: { id: '10000000-0000-4000-8000-000000000009', name: 'Test User', email: 'qa@example.invalid', role: 'USER' } };
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => status < 400 ? { data } : { error: data } });
const mount = () => render(<AuthProvider><App/></AuthProvider>);

beforeEach(() => {
  window.history.replaceState(null, '', '/#home');
  sessionStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    if (url.endsWith('/auth/login')) return response(session);
    if (url.endsWith('/me/items')) return response([]);
    if (url.endsWith('/auctions')) return response([villa, car]);
    if (url.endsWith('/auctions/' + car.id)) return response(car);
    if (url.endsWith('/auctions/' + villa.id)) return response(villa);
    if (url.endsWith('/bids') && options.method === 'GET') return response([]);
    if (url.endsWith('/commitment') && options.method === 'GET') return response({ code: 'NOT_FOUND' }, 404);
    if (url.endsWith('/commitment') && options.method === 'POST') return response({ code: 'BANK_SANDBOX_UNAVAILABLE' }, 503);
    throw Error('Unexpected request in navigation test');
  }));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('approved navigation opens separate login and registration screens', async () => {
  const actor = userEvent.setup(); mount();
  await actor.click(screen.getByRole('link', { name: 'تسجيل الدخول', exact: true }));
  expect(await screen.findByRole('heading', { name: 'مرحبًا بعودتك' })).toBeVisible();
  await actor.click(screen.getByRole('button', { name: 'إنشاء حساب', exact: true }));
  expect(await screen.findByRole('heading', { name: 'أنشئ حسابك' })).toBeVisible();
  expect(window.location.hash).toBe('#register');
  expect(screen.getByLabelText('رقم الجوال')).toBeDisabled();
});

test('a Porsche card opens Porsche details with its image, never the villa', async () => {
  const actor = userEvent.setup(); mount();
  await actor.click(await screen.findByRole('link', { name: 'عرض مزاد ' + car.title }));
  expect(await screen.findByRole('heading', { name: car.title })).toBeVisible();
  expect(window.location.hash).toBe('#auction/' + car.id);
  expect(screen.getAllByAltText(car.title)[0]).toHaveAttribute('src', car.image_url);
  expect(screen.queryByRole('heading', { name: villa.title })).not.toBeInTheDocument();
});

test('category selection filters the API records without swapping item identity', async () => {
  const actor = userEvent.setup(); mount();
  await actor.click(screen.getByRole('link', { name: 'المزادات', exact: true }));
  await screen.findByRole('heading', { name: car.title });
  await actor.click(screen.getByRole('link', { name: 'العقارات', exact: true }));
  expect(await screen.findByRole('heading', { name: villa.title })).toBeVisible();
  expect(screen.queryByRole('heading', { name: car.title })).not.toBeInTheDocument();
  expect(window.location.hash).toBe('#auctions/property');
});

test('signing in from a specific auction returns to that same auction', async () => {
  window.history.replaceState(null, '', '/#auction/' + car.id);
  const actor = userEvent.setup(); mount();
  await actor.click(await screen.findByRole('button', { name: 'أضف مزايدتك', exact: true }));
  await screen.findByRole('heading', { name: 'مرحبًا بعودتك' });
  await actor.type(screen.getByLabelText('البريد الإلكتروني'), session.user.email);
  await actor.type(screen.getByLabelText('كلمة المرور'), 'Account-test-2026');
  await actor.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  await waitFor(() => expect(window.location.hash).toBe('#auction/' + car.id));
  expect(await screen.findByRole('heading', { name: car.title })).toBeVisible();
});

test('the auction destination survives a reload of the login URL', async () => {
  window.history.replaceState(null, '', '/#login?auction=' + car.id);
  const actor = userEvent.setup(); mount();
  await actor.type(screen.getByLabelText('البريد الإلكتروني'), session.user.email);
  await actor.type(screen.getByLabelText('كلمة المرور'), 'Account-test-2026');
  await actor.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  await waitFor(() => expect(window.location.hash).toBe('#auction/' + car.id));
  expect(await screen.findByRole('heading', { name: car.title })).toBeVisible();
});

test('unavailable banking does not pretend that participation or a bid succeeded', async () => {
  saveSession(session);
  window.history.replaceState(null, '', '/#auction/' + car.id);
  const actor = userEvent.setup(); mount();
  await screen.findByRole('link', { name: 'حسابي', exact: true });
  await actor.click(await screen.findByRole('button', { name: 'أضف مزايدتك', exact: true }));
  await actor.click(await screen.findByRole('button', { name: 'ابدأ تأكيد المشاركة', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('لم يتم اعتماد المشاركة أو إرسال مزايدة.');
  expect(fetch.mock.calls.some(([url,options]) => url.endsWith('/bids')&&options.method==='POST')).toBe(false);
});

test('a mismatched details response is rejected instead of showing another product', async () => {
  window.history.replaceState(null, '', '/#auction/' + car.id);
  fetch.mockImplementation(async () => response(villa));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة الخادم.');
  expect(screen.queryByRole('heading', { name: villa.title })).not.toBeInTheDocument();
});

test('polling refreshes displayed auction prices from the API', async () => {
  vi.useFakeTimers();
  fetch.mockResolvedValueOnce(response([car])).mockResolvedValue(response([{ ...car, current_price: '4200100' }]));
  render(<AuthProvider><AuctionList/></AuthProvider>);
  await act(async () => {});
  expect(screen.getByText('4,200,000')).toBeVisible();
  await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  expect(screen.getByText('4,200,100')).toBeVisible();
});

test('countdown uses English digits and stops at zero', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-13T12:00:00Z'));
  render(<Countdown endTime="2026-10-13T12:01:01Z"/>);
  expect(screen.getByRole('timer')).toHaveTextContent('00:01:01');
  await act(async () => { await vi.advanceTimersByTimeAsync(61000); });
  expect(screen.getByRole('timer')).toHaveTextContent('انتهى المزاد');
});
