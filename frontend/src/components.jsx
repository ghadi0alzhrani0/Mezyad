import { Link } from 'react-router-dom';
import { money, date } from './api.js';
import { useCountdown } from './hooks.js';
import { statusLabels, fieldLabels } from '../../shared/catalog.js';
export function Feedback({ loading, error, children }) {
  if (loading)
    return (
      <p role="status" className="notice">
        جارٍ التحميل…
      </p>
    );
  return (
    <>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {children}
    </>
  );
}
export function Status({ value, context }) {
  const commitmentLabels = {
    APPROVED: 'مكتمل',
    REJECTED: 'لم يُقبل',
    FAILED: 'تعذر الإكمال',
    PENDING: 'جارٍ التحقق',
  };
  return (
    <span className={`badge status-${value}`}>
      {(context === 'commitment' ? commitmentLabels[value] : statusLabels[value]) || value}
    </span>
  );
}
export function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.total <= pagination.limit) return null;
  const pages = Math.ceil(pagination.total / pagination.limit);
  return (
    <nav aria-label="صفحات النتائج" className="pagination">
      <button disabled={pagination.page === 1} onClick={() => onChange(pagination.page - 1)}>
        السابق
      </button>
      <span>
        {pagination.page} / {pages}
      </span>
      <button disabled={pagination.page === pages} onClick={() => onChange(pagination.page + 1)}>
        التالي
      </button>
    </nav>
  );
}
export function AuctionCard({ auction }) {
  return (
    <article className="auction-card">
      <Link
        to={`/auctions/${auction.id}`}
        aria-label={`عرض ${auction.title}`}
        className="card-image"
      >
        {auction.image_url ? (
          <img src={auction.image_url} alt={auction.title} />
        ) : (
          <div className="image-empty">مِزياد</div>
        )}
      </Link>
      <div className="card-content">
        <div className="card-meta">
          <span>{auction.category_name}</span>
          <Status value={auction.status} />
        </div>
        <h2>{auction.title}</h2>
        <p className="price" dir="ltr">
          {money(auction.current_price)} <span>ر.س</span>
        </p>
        <p className="muted">ينتهي: {date(auction.end_time)}</p>
        <Link className="button" to={`/auctions/${auction.id}`}>
          {auction.status === 'ACTIVE' ? 'أضف مزايدتك' : 'اعرض تفاصيل المزاد'}
        </Link>
      </div>
    </article>
  );
}
export function Countdown({ endTime, serverTime }) {
  const remaining = useCountdown(endTime, serverTime);
  const days = Math.floor(remaining / 86400),
    hours = Math.floor((remaining % 86400) / 3600),
    minutes = Math.floor((remaining % 3600) / 60),
    seconds = remaining % 60;
  return (
    <p className="countdown" aria-label="الوقت المتبقي" dir="ltr">
      {days ? `${days}d ` : ''}
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </p>
  );
}
export function AssetDetails({ item }) {
  return (
    <>
      <p className="description">{item.description}</p>
      <dl className="details">
        {Object.entries(item.category_fields).map(([key, value]) => (
          <div key={key}>
            <dt>{fieldLabels[key] || key}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
export function Gallery({ item }) {
  return item.images.length ? (
    <div className="gallery">
      {item.images.map((image) => (
        <a key={image.id} href={image.url} target="_blank" rel="noreferrer">
          <img src={image.url} alt={`${item.title} — صورة المعروض`} />
        </a>
      ))}
    </div>
  ) : (
    <div className="image-empty gallery-empty">لا توجد صور مرفقة</div>
  );
}
export function AuctionResult({ result, isOwner }) {
  if (!result) return <p role="status">جارٍ تسجيل نتيجة المزاد…</p>;
  return (
    <section className="panel result" aria-label="نتيجة المزاد">
      <h2>نتيجة المزاد</h2>
      {result.winner_bid_id ? (
        <>
          <p>
            {result.isWinner
              ? 'فزت بالمزاد'
              : isOwner
                ? 'انتهى مزادك بمزايدة فائزة'
                : 'انتهى المزاد بمزايدة فائزة'}
          </p>
          <p className="price" dir="ltr">
            {money(result.amount)} ر.س
          </p>
          <p className="muted">تعرض هذه النتيجة المزايدة الفائزة؛ لا تشمل إجراءات دفع أو تسليم.</p>
        </>
      ) : (
        <p>انتهى المزاد دون مزايدات مقبولة.</p>
      )}
    </section>
  );
}
