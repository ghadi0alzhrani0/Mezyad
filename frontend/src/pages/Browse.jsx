import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../hooks.js';
import { Feedback, AuctionCard, Pagination } from '../components.jsx';
import { categories } from '../../../shared/catalog.js';
export function Browse({ home = false }) {
  const [category, setCategory] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(1);
  const { data, loading, error, reload } = useResource(
    `/auctions?limit=${home ? 6 : 9}&page=${page}${category ? `&category=${category}` : ''}${status ? `&status=${status}` : ''}`
  );
  return (
    <>
      {home ? (
        <section className="hero">
          <span className="eyebrow">مزادات مختارة</span>
          <h1>قيمة تستحق المزايدة</h1>
          <p>
            استكشف مزادات الإبل والعقارات والسيارات واللوحات المميزة. تفاصيل واضحة، ومزايدة بخطوات
            محددة.
          </p>
          <Link className="button" to="/auctions">
            تصفح المزادات
          </Link>
          <div className="hero-mark" aria-hidden="true">
            مِزياد
          </div>
        </section>
      ) : (
        <div className="page-heading">
          <span className="eyebrow">مِزياد</span>
          <h1>المزادات</h1>
          <p>اختر القسم والحالة للوصول إلى المزاد المناسب.</p>
        </div>
      )}
      <section className="section">
        <div className="section-title">
          <h2>{home ? 'المزادات المعروضة' : 'نتائج المزادات'}</h2>
          <Link to="/private-access">دخول مزاد خاص</Link>
        </div>
        {!home && (
          <div className="filters">
            <label>
              القسم
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">جميع الأقسام</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              حالة المزاد
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">جميع الحالات</option>
                <option value="ACTIVE">قائم</option>
                <option value="SCHEDULED">قريبًا</option>
                <option value="CLOSED">منتهٍ</option>
              </select>
            </label>
          </div>
        )}
        <Feedback loading={loading} error={error}>
          {error && <button onClick={reload}>إعادة المحاولة</button>}
          {data &&
            (!data.auctions.length ? (
              <p className="empty">لا توجد مزادات مطابقة حاليًا.</p>
            ) : (
              <div className="card-grid">
                {data.auctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ))}
          <Pagination pagination={data?.pagination} onChange={setPage} />
        </Feedback>
      </section>
    </>
  );
}
