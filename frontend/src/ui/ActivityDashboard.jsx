import React, { useEffect, useMemo, useState } from 'react';
import { ApiError, errorMessage } from '../api.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { statusLabel } from './Auctions.jsx';

const listingStatus = { PENDING_REVIEW: 'قيد المراجعة', APPROVED: 'مقبول', REJECTED: 'مُعاد للتعديل' };
const validList = value => Array.isArray(value);
const validAuction = value => typeof value?.id === 'string' && typeof value?.title === 'string' && typeof value?.status === 'string';
const validItem = value => typeof value?.id === 'string' && typeof value?.title === 'string' && typeof value?.status === 'string';

export function ActivityDashboard() {
  const { request } = useAuth();
  const [items, setItems] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [itemData, auctionData] = await Promise.all([request('/api/v1/me/items', { signal: controller.signal }), request('/api/v1/me/auctions', { signal: controller.signal })]);
        if (!validList(itemData) || !validList(auctionData) || !itemData.every(validItem) || !auctionData.every(validAuction)) throw new ApiError('INVALID_RESPONSE');
        if (!controller.signal.aborted) { setItems(itemData); setAuctions(auctionData); setFailure(''); }
      } catch (error) { if (!controller.signal.aborted) setFailure(errorMessage(error)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, []);
  const summary = useMemo(() => ({ listed: items.length, review: items.filter(item => item.status === 'PENDING_REVIEW').length, active: auctions.filter(auction => auction.status === 'ACTIVE').length }), [items, auctions]);
  return <section className="activity-dashboard" aria-labelledby="activity-heading">
    <div className="workspace-intro"><p className="eyebrow">حسابي / النشاط</p><h1 id="activity-heading">نشاطي</h1><p className="section-description">راجعي المعروضات التي أرسلتِها والمزادات المرتبطة بحسابك.</p></div>
    {failure && <p className="feedback error" role="alert">{failure}</p>}
    <div className="activity-stats" aria-label="ملخص النشاط"><div><span>المعروضات</span><strong>{summary.listed}</strong></div><div><span>قيد المراجعة</span><strong>{summary.review}</strong></div><div><span>مزادات جارية</span><strong>{summary.active}</strong></div></div>
    <div className="activity-columns">
      <section aria-labelledby="my-listings-heading"><div className="panel-heading"><div><p className="eyebrow">البيع</p><h2 id="my-listings-heading">معروضاتي</h2></div><a className="text-link" href="#sell">أضف معروضًا</a></div>{loading ? <p role="status">جارٍ تحميل المعروضات…</p> : items.length ? <div className="activity-list">{items.map(item => <article key={item.id}><div><h3>{item.title}</h3>{item.review_reason && <p>ملاحظة المراجع: {item.review_reason}</p>}</div><span className={'status-chip status-' + item.status.toLowerCase()}>{listingStatus[item.status] || item.status}</span></article>)}</div> : <p className="empty-state">لم ترسلي أي معروض بعد.</p>}</section>
      <section aria-labelledby="my-auctions-heading"><div className="panel-heading"><div><p className="eyebrow">المشاركة</p><h2 id="my-auctions-heading">مزاداتي</h2></div><a className="text-link" href="#auctions">استكشف المزادات</a></div>{loading ? <p role="status">جارٍ تحميل المزادات…</p> : auctions.length ? <div className="activity-list">{auctions.map(auction => <article key={auction.id}><div><h3>{auction.title}</h3><p>{auction.end_time ? 'ينتهي ' + new Date(auction.end_time).toLocaleString('ar-SA-u-nu-latn', { calendar: 'gregory' }) : 'لا يوجد موعد نهاية مسجّل'}</p></div><a className="status-chip" href={'#auction/' + auction.id}>{statusLabel(auction.status)}</a></article>)}</div> : <p className="empty-state">لا توجد مزادات مرتبطة بحسابك حتى الآن.</p>}</section>
    </div>
  </section>;
}
