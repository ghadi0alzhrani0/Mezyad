import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useResource } from '../hooks.js';
import { api, money, date, decimalCents } from '../api.js';
import { useAuth } from '../auth.jsx';
import {
  AssetDetails,
  Gallery,
  Feedback,
  Status,
  Countdown,
  AuctionResult,
  Pagination,
} from '../components.jsx';
function Confirmation({ amount, onConfirm, onCancel, busy }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={onCancel} aria-labelledby="confirm-title">
      <h2 id="confirm-title">تأكيد المزايدة</h2>
      <p>
        هل تؤكد تقديم مزايدة بقيمة <b dir="ltr">{money(amount)} ر.س</b>؟
      </p>
      <p className="muted">يعتمد قبول الطلب على سعر المزاد ووقته عند وصوله للخادم.</p>
      <div className="actions">
        <button disabled={busy} onClick={onConfirm}>
          {busy ? 'جارٍ الإرسال…' : 'تأكيد المزايدة'}
        </button>
        <button className="secondary" disabled={busy} onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </dialog>
  );
}
export function Auction() {
  const { id } = useParams(),
    { user } = useAuth();
  const details = useResource(`/auctions/${id}`, 3000);
  const [page, setPage] = useState(1),
    history = useResource(`/auctions/${id}/bids?page=${page}&limit=10`, 3000);
  const commitment = useResource(`/auctions/${id}/commitment`, 3000);
  const [amount, setAmount] = useState(''),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const requestId = useRef(null);
  useEffect(() => {
    setAmount('');
    setConfirm(false);
    setMessage('');
    setError('');
    requestId.current = null;
  }, [id]);
  async function bid() {
    setBusy(true);
    setError('');
    requestId.current ||= crypto.randomUUID();
    try {
      await api(`/auctions/${id}/bids`, {
        method: 'POST',
        body: { amount, requestId: requestId.current },
      });
      setMessage('تم قبول مزايدتك.');
      setConfirm(false);
      setAmount('');
      requestId.current = null;
      details.reload();
      history.reload();
    } catch (error) {
      setError(error.message);
      setConfirm(false);
      if (error.status) requestId.current = null;
      details.reload();
    } finally {
      setBusy(false);
    }
  }
  function prepare(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (
      !/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(amount) ||
      decimalCents(amount) < decimalCents(details.data.minimumNextBid)
    )
      return setError(`أدخل مبلغًا لا يقل عن ${money(details.data.minimumNextBid)} ر.س.`);
    setConfirm(true);
  }
  const auction = details.data;
  return (
    <Feedback loading={details.loading} error={details.error}>
      {!auction ? (
        <p>
          <Link to="/private-access" state={{ auctionId: id }}>
            دخول مزاد خاص
          </Link>{' '}
          · <Link to="/auctions">العودة للمزادات</Link>
        </p>
      ) : (
        <>
          <div className="page-heading">
            <Link to="/auctions">المزادات</Link>
            <h1>{auction.item.title}</h1>
            <Status value={auction.status} />
            {auction.visibility === 'PRIVATE' && <span className="badge">مزاد خاص</span>}
          </div>
          <div className="auction-layout">
            <section>
              <Gallery item={auction.item} />
              <section className="panel">
                <h2>تفاصيل المعروض</h2>
                <AssetDetails item={auction.item} />
              </section>
            </section>
            <aside className="panel bid-panel">
              <h2>{auction.result?.winner_bid_id ? 'سعر المزايدة الفائزة' : 'السعر الحالي'}</h2>
              <p className="price" dir="ltr">
                {money(auction.current_price)} ر.س
              </p>
              <dl className="details">
                <div>
                  <dt>بداية المزاد</dt>
                  <dd>{date(auction.start_time)}</dd>
                </div>
                <div>
                  <dt>نهاية المزاد</dt>
                  <dd>{date(auction.end_time)}</dd>
                </div>
                <div>
                  <dt>الحد الأدنى للزيادة</dt>
                  <dd dir="ltr">{money(auction.minimum_increment)} ر.س</dd>
                </div>
              </dl>
              {auction.status === 'ACTIVE' && (
                <>
                  <span>الوقت المتبقي</span>
                  <Countdown endTime={auction.end_time} serverTime={auction.serverTime} />
                  <p className="muted">تُحدّث البيانات دوريًا؛ يحدد الخادم وقت قبول المزايدة.</p>
                </>
              )}
              {auction.status === 'SCHEDULED' && <p>يبدأ المزاد في الموعد الموضح أعلاه.</p>}
              {auction.status === 'CLOSED' ? (
                <AuctionResult result={auction.result} isOwner={auction.isOwner} />
              ) : auction.isOwner ? (
                <p>هذا مزادك؛ يمكنك متابعة المزايدات دون المشاركة فيها.</p>
              ) : !user ? (
                <Link className="button" to="/login" state={{ from: `/auctions/${id}` }}>
                  سجّل الدخول للمزايدة
                </Link>
              ) : user.role === 'ADMIN' ? (
                <p>وضع متابعة المشرف.</p>
              ) : (
                <>
                  {commitment.data?.commitment?.status === 'APPROVED' && (
                    <p className="notice">
                      اكتمل الالتزام باستخدام خدمة اختبار محلية؛ لا يوجد حجز أو تحويل أموال.
                    </p>
                  )}
                  {commitment.data?.commitment?.status !== 'APPROVED' ? (
                    <Link className="button" to={`/auctions/${id}/commitment`}>
                      أكمل خطوة الالتزام
                    </Link>
                  ) : (
                    auction.status === 'ACTIVE' && (
                      <form onSubmit={prepare}>
                        <label>
                          مبلغ المزايدة
                          <input
                            value={amount}
                            onChange={(e) => {
                              setAmount(e.target.value);
                              requestId.current = null;
                            }}
                            inputMode="decimal"
                            dir="ltr"
                            required
                            pattern="[0-9]+(\.[0-9]{1,2})?"
                            aria-describedby="next-bid"
                          />
                        </label>
                        <p id="next-bid">
                          الحد الأدنى: <b dir="ltr">{money(auction.minimumNextBid)} ر.س</b>
                        </p>
                        <button disabled={busy}>أضف مزايدتك</button>
                      </form>
                    )
                  )}
                </>
              )}
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="notice" role="status">
                  {message}
                </p>
              )}
            </aside>
          </div>
          <section className="section">
            <h2>سجل المزايدات المقبولة</h2>
            <Feedback loading={history.loading} error={history.error}>
              {history.data?.bids.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>المزايد</th>
                        <th>المبلغ</th>
                        <th>الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.data.bids.map((bid) => (
                        <tr key={bid.id}>
                          <td>{bid.is_mine ? 'مزايدتك' : 'مزايد'}</td>
                          <td dir="ltr">{money(bid.amount)} ر.س</td>
                          <td>{date(bid.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty">لم تُقبل أي مزايدات بعد.</p>
              )}
              <Pagination pagination={history.data?.pagination} onChange={setPage} />
            </Feedback>
          </section>
          {confirm && (
            <Confirmation
              amount={amount}
              busy={busy}
              onConfirm={bid}
              onCancel={() => setConfirm(false)}
            />
          )}
        </>
      )}
    </Feedback>
  );
}
export function Commitment() {
  const { id } = useParams(),
    state = useResource(`/auctions/${id}/commitment`, 3000);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function start() {
    setBusy(true);
    setError('');
    try {
      await api(`/auctions/${id}/commitment`, { method: 'POST', body: {} });
      state.reload();
    } catch (error) {
      setError(error.message);
      state.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel narrow">
      <h1>الالتزام بالمزايدة</h1>
      <Feedback loading={state.loading} error={state.error}>
        {state.data && (
          <>
            <p>هذه الخطوة تحدد أهلية حسابك للمشاركة في هذا المزاد.</p>
            <p className="notice">
              {state.data.mode === 'mock'
                ? 'خدمة اختبار محلية فقط؛ لا تتصل ببنك ولا تتحقق من رصيد مالي ولا تحجز أموالًا.'
                : 'تكامل الـSandbox البنكي غير متاح حاليًا. يلزم اعتماد العملية وتوفير صلاحيات الوصول.'}
            </p>
            {state.data.commitment && (
              <p>
                الحالة: <Status value={state.data.commitment.status} context="commitment" />
              </p>
            )}
            {state.data.commitment?.status === 'APPROVED' ? (
              <Link className="button" to={`/auctions/${id}`}>
                العودة للمزايدة
              </Link>
            ) : (
              <button
                onClick={start}
                disabled={
                  busy || state.data.mode !== 'mock' || state.data.commitment?.status === 'PENDING'
                }
              >
                {busy ? 'جارٍ التحقق…' : 'تجربة خطوة الالتزام'}
              </button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <p>
          <Link to={`/auctions/${id}`}>العودة لتفاصيل المزاد</Link>
        </p>
      </Feedback>
    </section>
  );
}
