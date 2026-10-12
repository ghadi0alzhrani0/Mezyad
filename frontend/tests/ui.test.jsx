import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Feedback, AuctionResult, Countdown, AuctionCard, Status } from '../src/components.jsx';
import { useResource } from '../src/hooks.js';
import { Browse } from '../src/pages/Browse.jsx';
import { Account } from '../src/pages/Account.jsx';
import { CreateListing, imageError } from '../src/pages/Listing.jsx';
import { decimalCents, money } from '../src/api.js';
vi.mock('../src/auth.jsx', () => ({
  useAuth: () => ({ user: null, setUser: vi.fn(), ready: true }),
}));
const response = (data) => ({ ok: true, json: async () => ({ data }) });
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const router = (component) => render(<MemoryRouter>{component}</MemoryRouter>);
describe('UI feedback and forms', () => {
  it('distinguishes listing approval from completed bid commitment', () => {
    render(
      <>
        <Status value="APPROVED" />
        <Status value="APPROVED" context="commitment" />
      </>
    );
    expect(screen.getByText('معتمد للنشر')).toBeVisible();
    expect(screen.getByText('مكتمل')).toBeVisible();
  });
  it('QA-14 renders loading and error states accessibly', () => {
    const view = render(<Feedback loading>Content</Feedback>);
    expect(screen.getByRole('status')).toHaveTextContent('جارٍ التحميل');
    view.rerender(<Feedback error="Network failed">Content</Feedback>);
    expect(screen.getByRole('alert')).toHaveTextContent('Network failed');
  });
  it('QA-14 empty auction results offer a clear state', async () => {
    fetch.mockResolvedValue(
      response({ auctions: [], pagination: { page: 1, limit: 9, total: 0 } })
    );
    router(<Browse />);
    await screen.findByText('لا توجد مزادات مطابقة حاليًا.');
  });
  it('auction fetch error offers retry', async () => {
    fetch.mockRejectedValue(new Error('Connection failed'));
    router(<Browse />);
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeVisible();
  });
  it('registration uses separate fields and shows server duplicate-email error', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: { code: 'EMAIL_EXISTS', message: 'البريد الإلكتروني مسجّل مسبقًا.' },
      }),
    });
    router(<Account register />);
    await user.type(screen.getByLabelText('الاسم'), 'Test Member');
    await user.type(screen.getByLabelText('البريد الإلكتروني'), 'member@example.test');
    await user.type(screen.getByLabelText('كلمة المرور'), 'test-password-42');
    await user.click(screen.getByRole('button', { name: 'إنشاء حساب' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('مسجّل مسبقًا');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      name: 'Test Member',
      email: 'member@example.test',
      password: 'test-password-42',
    });
  });
  it('description suggestion uses seller fields and remains editable', async () => {
    const user = userEvent.setup();
    router(<CreateListing />);
    await user.type(screen.getByLabelText('عنوان الإعلان'), 'ناقة اختبار');
    await user.type(screen.getByLabelText('اللون'), 'رملي');
    await user.click(screen.getByRole('button', { name: 'اقترح وصفًا من التفاصيل' }));
    expect(screen.getByLabelText('الوصف')).toHaveValue('ناقة اختبار ضمن قسم الإبل. اللون: رملي.');
    await user.type(screen.getByLabelText('الوصف'), ' تعديل');
    expect(screen.getByLabelText('الوصف').value).toContain('تعديل');
  });
  it('listing submission rejects missing image without contacting API', async () => {
    const user = userEvent.setup();
    router(<CreateListing />);
    await user.type(screen.getByLabelText('عنوان الإعلان'), 'ناقة اختبار');
    await user.type(screen.getByLabelText('اللون'), 'رملي');
    await user.type(screen.getByLabelText('الوصف'), 'وصف اختبار صالح');
    await user.click(screen.getByRole('button', { name: 'إرسال للمراجعة' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('صورة واحدة');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('validates client image type and size before upload', () => {
    expect(imageError([{ type: 'image/svg+xml', size: 10 }])).not.toBe('');
    expect(imageError([{ type: 'image/png', size: 6 * 1024 * 1024 }])).not.toBe('');
    expect(imageError([{ type: 'image/png', size: 100 }])).toBe('');
  });
  it('card links keep the selected auction ID through navigation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AuctionCard
                auction={{
                  id: 'selected-auction',
                  title: 'السيارة المختارة',
                  status: 'ACTIVE',
                  category_name: 'السيارات',
                  current_price: '100.00',
                  end_time: new Date().toISOString(),
                }}
              />
            }
          />
          <Route path="/auctions/selected-auction" element={<p>Selected auction detail</p>} />
        </Routes>
      </MemoryRouter>
    );
    await user.click(screen.getByRole('link', { name: 'أضف مزايدتك' }));
    expect(await screen.findByText('Selected auction detail')).toBeVisible();
  });
});
describe('Auction updates, time and results', () => {
  it('preserves decimal cents and display above JavaScript safe integer range', () => {
    expect(decimalCents('9007199254740993.01')).toBe(900719925474099301n);
    expect(money('9007199254740993.01')).toBe('9,007,199,254,740,993.01');
  });
  it('stops polling after the server supplies a closed auction', async () => {
    fetch.mockResolvedValue(response({ status: 'CLOSED', current_price: '100.00' }));
    const view = renderHook(() => useResource('/auctions/test', 20));
    await waitFor(() => expect(view.result.current.data?.status).toBe('CLOSED'));
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('countdown follows supplied server time and never becomes negative', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T10:00:00Z'));
    render(<Countdown endTime="2026-10-12T10:01:03Z" serverTime="2026-10-12T10:01:00Z" />);
    expect(screen.getByLabelText('الوقت المتبقي')).toHaveTextContent('00:00:03');
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(screen.getByLabelText('الوقت المتبقي')).toHaveTextContent('00:00:00');
  });
  it('polling refreshes displayed data and cancels on unmount', async () => {
    fetch
      .mockResolvedValueOnce(response({ current_price: '100.00' }))
      .mockResolvedValue(response({ current_price: '110.00' }));
    const view = renderHook(() => useResource('/auctions/test', 30));
    await waitFor(() => expect(view.result.current.data?.current_price).toBe('110.00'));
    const count = fetch.mock.calls.length;
    view.unmount();
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(fetch).toHaveBeenCalledTimes(count);
  });
  it('polling error preserves latest data and recovers on retry', async () => {
    fetch
      .mockResolvedValueOnce(response({ current_price: '100.00' }))
      .mockRejectedValueOnce(new Error('Temporary outage'))
      .mockResolvedValue(response({ current_price: '120.00' }));
    const view = renderHook(() => useResource('/auctions/test', 30));
    await waitFor(() => expect(view.result.current.error).toBe('Temporary outage'));
    expect(view.result.current.data.current_price).toBe('100.00');
    await waitFor(() => expect(view.result.current.data.current_price).toBe('120.00'));
    expect(view.result.current.error).toBe('');
  });
  it('shows winning outcome without claiming sale, payment or handover', () => {
    render(<AuctionResult result={{ winner_bid_id: 'bid', amount: '110.00', isWinner: true }} />);
    expect(screen.getByText('فزت بالمزاد')).toBeVisible();
    expect(screen.getByText(/لا تشمل إجراءات دفع أو تسليم/)).toBeVisible();
    expect(screen.queryByText('تم البيع')).not.toBeInTheDocument();
  });
  it('shows no-bids result', () => {
    render(<AuctionResult result={{ winner_bid_id: null }} />);
    expect(screen.getByText('انتهى المزاد دون مزايدات مقبولة.')).toBeVisible();
  });
});
