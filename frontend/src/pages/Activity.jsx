import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useResource } from '../hooks.js';
import { api, money } from '../api.js';
import { Feedback, Pagination, Status, AssetDetails } from '../components.jsx';
export function Activity() {
  const [page, setPage] = useState(1),
    [auctionPage, setAuctionPage] = useState(1);
  const items = useResource(`/me/items?page=${page}`),
    auctions = useResource(`/me/auctions?page=${auctionPage}`);
  return (
    <>
      <div className="page-heading">
        <h1>نشاطي</h1>
        <p>إعلاناتك ومزاداتك ومزايداتك من حساب واحد.</p>
        <Link className="button" to="/listings/new">
          إنشاء إعلان
        </Link>
      </div>
      <section className="section">
        <h2>إعلاناتي</h2>
        <Feedback loading={items.loading} error={items.error}>
          {items.data?.items.length ? (
            <div className="activity-grid">
              {items.data.items.map((item) => (
                <article key={item.id} className="panel">
                  <h3>
                    <Link to={`/listings/${item.id}`}>{item.title}</Link>
                  </h3>
                  <Status value={item.status} />
                  {item.review_reason && <p>سبب الرفض: {item.review_reason}</p>}
                  {item.auction_id ? (
                    <p>
                      <Link to={`/auctions/${item.auction_id}`}>عرض المزاد</Link>
                    </p>
                  ) : item.status === 'APPROVED' ? (
                    <p>
                      <Link to={`/listings/${item.id}/auction`}>إنشاء المزاد</Link>
                    </p>
                  ) : item.status === 'REJECTED' ? (
                    <p>
                      <Link to={`/listings/${item.id}/edit`}>تعديل وإعادة إرسال</Link>
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">لم تضف إعلانات بعد.</p>
          )}
          <Pagination pagination={items.data?.pagination} onChange={setPage} />
        </Feedback>
      </section>
      <section className="section">
        <h2>مزاداتي ومزايداتي</h2>
        <Feedback loading={auctions.loading} error={auctions.error}>
          {auctions.data?.auctions.length ? (
            <div className="activity-grid">
              {auctions.data.auctions.map((auction) => (
                <article key={auction.id} className="panel">
                  <h3>
                    <Link to={`/auctions/${auction.id}`}>{auction.title}</Link>
                  </h3>
                  <Status value={auction.status} />
                  <p>
                    {auction.is_owner
                      ? 'مزادك'
                      : auction.my_bid
                        ? 'شاركت بالمزايدة'
                        : 'لديك دعوة لهذا المزاد'}
                  </p>
                  <p>
                    السعر الحالي: <span dir="ltr">{money(auction.current_price)} ر.س</span>
                  </p>
                  {auction.my_bid && (
                    <p>
                      أعلى مزايدة لك: <span dir="ltr">{money(auction.my_bid)} ر.س</span>
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">لا توجد مزادات في نشاطك بعد.</p>
          )}
          <Pagination pagination={auctions.data?.pagination} onChange={setAuctionPage} />
        </Feedback>
      </section>
    </>
  );
}
export function PrivateAccess() {
  const location = useLocation(),
    navigate = useNavigate(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    setError('');
    try {
      await api(`/auctions/${form.auctionId}/access`, {
        method: 'POST',
        body: { accessCode: form.accessCode },
      });
      navigate(`/auctions/${form.auctionId}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="panel narrow">
      <h1>دخول مزاد خاص</h1>
      <p>أدخل معرّف المزاد ورمز الدعوة اللذين شاركهما معك صاحب المزاد.</p>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <label>
        معرّف المزاد
        <input
          name="auctionId"
          defaultValue={location.state?.auctionId || ''}
          pattern="[0-9a-fA-F-]{36}"
          required
          dir="ltr"
        />
      </label>
      <label>
        رمز الدعوة
        <input name="accessCode" required maxLength={128} dir="ltr" autoComplete="off" />
      </label>
      <button disabled={busy}>{busy ? 'جارٍ التحقق…' : 'دخول المزاد'}</button>
      <Link to="/auctions">العودة للمزادات</Link>
    </form>
  );
}
export function AdminReview() {
  const [page, setPage] = useState(1),
    [filter, setFilter] = useState('PENDING_REVIEW'),
    list = useResource(`/items?status=${filter}&page=${page}`),
    [selected, setSelected] = useState(null),
    [reason, setReason] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function open(id) {
    setError('');
    try {
      setSelected(await api(`/items/${id}`));
      setReason('');
    } catch (error) {
      setError(error.message);
    }
  }
  async function review(decision) {
    if (decision === 'REJECTED' && !reason.trim())
      return setError('اكتب سبب الرفض ليتمكن صاحب الإعلان من تصحيحه.');
    setBusy(true);
    setError('');
    try {
      await api(`/admin/items/${selected.id}/review`, {
        method: 'POST',
        body: { decision, ...(decision === 'REJECTED' ? { reason } : {}) },
      });
      setSelected(null);
      list.reload();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <h1>مراجعة الإعلانات</h1>
        <p>افحص التفاصيل والصور قبل تسجيل قرار المراجعة.</p>
      </div>
      <label className="filters">
        حالة المراجعة
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
            setSelected(null);
          }}
        >
          <option value="PENDING_REVIEW">بانتظار المراجعة</option>
          <option value="APPROVED">معتمد</option>
          <option value="REJECTED">مرفوض</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <Feedback loading={list.loading} error={list.error}>
        {list.data?.items.length ? (
          <div className="activity-grid">
            {list.data.items.map((item) => (
              <article className="panel" key={item.id}>
                <h2>{item.title}</h2>
                <Status value={item.status} />
                <p>
                  <button className="secondary" onClick={() => open(item.id)}>
                    مراجعة التفاصيل
                  </button>
                </p>
                {item.auction_id && <Link to={`/auctions/${item.auction_id}`}>متابعة المزاد</Link>}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">لا توجد إعلانات بهذه الحالة.</p>
        )}
        <Pagination pagination={list.data?.pagination} onChange={setPage} />
      </Feedback>
      {selected && (
        <section className="panel review-panel">
          <h2>{selected.title}</h2>
          <AssetDetails item={selected} />
          <div className="gallery">
            {selected.images.map((image) => (
              <a key={image.id} href={image.url} target="_blank" rel="noreferrer">
                <img src={image.url} alt={selected.title} />
              </a>
            ))}
          </div>
          {selected.status === 'PENDING_REVIEW' && (
            <>
              <label>
                سبب الرفض
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={2000}
                />
              </label>
              <div className="actions">
                <button disabled={busy} onClick={() => review('APPROVED')}>
                  اعتماد الإعلان
                </button>
                <button className="danger" disabled={busy} onClick={() => review('REJECTED')}>
                  رفض الإعلان
                </button>
              </div>
            </>
          )}
          <button className="secondary" onClick={() => setSelected(null)}>
            إغلاق التفاصيل
          </button>
        </section>
      )}
    </>
  );
}
