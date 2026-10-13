import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { errorMessage, ApiError } from '../api.js';

export const categories = [
  { key: 'camels', label: 'الإبل', name: 'Camels' },
  { key: 'property', label: 'العقارات', name: 'Real Estate' },
  { key: 'cars', label: 'السيارات النادرة', name: 'Rare Vehicles' },
  { key: 'plates', label: 'اللوحات المميزة', name: 'Vehicle Plates' },
];
export const amount = value => Number.isFinite(Number(value))
  ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value)) : '—';
export const statusLabel = status => ({ ACTIVE: 'جارٍ', SCHEDULED: 'قريبًا', CLOSED: 'منتهي' }[status] || '—');
const validAuction = value => value && typeof value.id === 'string'
  && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value.id)
  && typeof value.title === 'string' && !!value.title.trim()
  && Number(value.current_price) > 0 && Number.isFinite(Number(value.current_price))
  && ['ACTIVE', 'SCHEDULED', 'CLOSED'].includes(value.status);

export function Countdown({ endTime }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const deadline = Date.parse(endTime);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const time = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
  return <p className="countdown" role="timer" aria-live="off" dir="ltr">
    {!Number.isFinite(deadline) ? '—' : seconds === 0 ? 'انتهى المزاد' : time}
  </p>;
}
export function safeImage(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { if (new URL(value).protocol === 'https:') return value; } catch { /* Invalid URL. */ }
  return null;
}

export function AuctionCard({ auction, index = 0 }) {
  const image = safeImage(auction.image_url);
  return <article className="auction-card">
    <a className="auction-image-link" href={'#auction/' + auction.id} aria-label={'عرض مزاد ' + auction.title}>
      {image ? <img src={image} alt={auction.title}/> : <div className="image-placeholder">لا تتوفر صورة</div>}
    </a>
    <div className="card-title"><h3>{auction.title}</h3><span dir="ltr">{String(index + 1).padStart(2, '0')}</span></div>
    <div className="price"><span>{Number(auction.bid_count) > 0 ? 'أعلى مزايدة' : 'السعر الافتتاحي'}</span>
      <strong><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</strong></div>
    <a className="button secondary" href={'#auction/' + auction.id}>
      {auction.status === 'SCHEDULED' ? 'اعرض تفاصيل المزاد' : 'عرض المزاد'}
    </a>
  </article>;
}

export function AuctionList({ category, home = false }) {
  const { request } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [failure, setFailure] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const data = await request('/api/v1/auctions', { signal: controller.signal });
        if (!Array.isArray(data) || !data.every(validAuction)) throw new ApiError('INVALID_RESPONSE');
        if (!controller.signal.aborted) { setAuctions(data); setFailure(''); }
      } catch (error) {
        if (!controller.signal.aborted) setFailure(errorMessage(error));
      } finally {
        busy = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [request]);
  const selectedCategory = categories.find(value => value.key === category);
  const visible = auctions.filter(value => !selectedCategory || value.category_name === selectedCategory.name);
  const displayed = home ? visible.filter(auction => auction.status === 'ACTIVE').slice(0, 3) : visible;
  return <>
    {failure && <p className="feedback error" role="alert">{failure}</p>}
    <div className="auction-grid" aria-busy={loading}>
      {loading ? <p className="empty-state" role="status">جارٍ تحميل المزادات…</p>
        : displayed.length ? displayed.map((auction, index) => <AuctionCard key={auction.id} auction={auction} index={index}/>)
          : <p className="empty-state">لا توجد مزادات متاحة في هذا القسم حاليًا.</p>}
    </div>
  </>;
}

export function AuctionDetails({ id, onRequireLogin,onParticipate,receipt }) {
  const { request, status } = useAuth();
  const [auction, setAuction] = useState(null);
  const [failure, setFailure] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [participationFailure, setParticipationFailure] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    setAuction(null); setFailure(''); setParticipationFailure(''); setImageIndex(0);
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const data = await request('/api/v1/auctions/' + id, { signal: controller.signal });
        if (!validAuction(data) || data.id !== id || !Array.isArray(data.images)) throw new ApiError('INVALID_RESPONSE');
        if (!controller.signal.aborted) { setAuction(data); setFailure(''); }
      } catch (error) {
        if (!controller.signal.aborted) setFailure(errorMessage(error));
      } finally { busy = false; }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [id, request]);
  async function participation() {
    if (status !== 'authenticated') { onRequireLogin(); return; }
    if(onParticipate){onParticipate();return;}
    setPending(true); setParticipationFailure('');
    try { await request('/api/v1/auctions/' + id + '/commitment', { method: 'POST' }); }
    catch (error) { setParticipationFailure(errorMessage(error)); }
    finally { setPending(false); }
  }
  if (!auction) return <main className="content-shell detail-page">
    {failure ? <p className="feedback error" role="alert">{failure}</p> : <p role="status">جارٍ تحميل تفاصيل المزاد…</p>}
    <a className="button secondary" href="#auctions">العودة إلى المزادات</a>
  </main>;
  const images = (auction.images || []).map(safeImage).filter(Boolean);
  const selectedImage = images[imageIndex] || safeImage(auction.image_url);
  const thumbnails = images.slice(1);
  return <main className="content-shell detail-page">
    <p className="breadcrumb"><a href="#home">الرئيسية</a> / <a href="#auctions">المزادات</a> / {auction.title}</p>
    <div className="detail-grid">
      <section className="detail-summary">
        <p className="eyebrow">{categories.find(value => value.name === auction.category_name)?.label} / مزاد {statusLabel(auction.status)}</p>
        <h1>{auction.title}</h1>
        <div className="detail-price"><p>السعر الحالي</p><strong><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</strong></div>
        <dl className="detail-status"><dt>حالة المزاد</dt><dd>{statusLabel(auction.status)}</dd><dt>نهاية المزاد</dt>
          <dd>{new Date(auction.end_time).toLocaleString('ar-SA-u-nu-latn', { calendar: 'gregory' })}</dd></dl>
        <p className="detail-description">راجع صور المعروض ووصفه قبل المشاركة في المزاد.</p>
        {failure && <p className="feedback error" role="alert">{failure}</p>}
        {participationFailure && <p className="feedback error" role="alert">{participationFailure}</p>}
        <button className="button primary" type="button" disabled={pending || auction.status === 'CLOSED' || Date.parse(auction.start_time) > Date.now()} onClick={participation}>
          {pending ? 'جارٍ التحقق من المشاركة…' : auction.status === 'CLOSED' ? 'انتهى المزاد' : 'أضف مزايدتك'}
        </button>
        <a className="button secondary" href="#auctions">العودة إلى المزادات</a>
      </section>
      <section className="detail-gallery" aria-label="صور المعروض">
        {selectedImage ? <img className="gallery-main" src={selectedImage} alt={auction.title}/> : <div className="gallery-main image-placeholder">لا تتوفر صورة</div>}
        <div className="gallery-thumbs">{Array.from({ length: Math.max(thumbnails.length, 3) }, (_, index) => thumbnails[index]
          ? <button type="button" key={index} aria-label={'عرض الصورة ' + (index + 2)} aria-pressed={imageIndex === index + 1} onClick={() => setImageIndex(index + 1)}><img src={thumbnails[index]} alt={auction.title + ' — الصورة ' + (index + 2)}/></button>
          : <div className="image-placeholder" key={index} aria-label="مكان صورة إضافية"/> )}</div>
        {imageIndex > 0 && <button className="text-action gallery-return" type="button" onClick={() => setImageIndex(0)}>الصورة الرئيسية</button>}
      </section>
    </div>
    {receipt?.auctionId===id&&Number(auction.current_price)>receipt.amount&&<p className="feedback" role="status">تم تجاوز مزايدتك. راجع السعر الحالي قبل إضافة مزايدة جديدة.</p>}
    {status==='authenticated'&&<BidHistory id={id}/>}
    {auction.status==='CLOSED'&&<a className="button primary" href={'#result/'+id}>عرض نتيجة المزاد</a>}
    <section className="item-description"><h2>عن هذا المعروض</h2><p>{auction.description}</p></section>
    <section className="detail-insights" aria-label="متابعة المزاد">
      <div><h2>الوقت المتبقي</h2><Countdown endTime={auction.end_time}/><p>بحسب موعد نهاية المزاد.</p></div>
      <div><h2>السعر الحالي</h2><strong><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</strong><p>السعر المعروض من بيانات المزاد.</p></div>
      <div><h2>ملخص النشاط</h2><strong>{statusLabel(auction.status)}</strong><p>يمكنك متابعة السعر وحالة المزاد هنا.</p></div>
    </section>
    {auction.result && <p className="feedback" role="status">{auction.result.winner_bid_id ? 'انتهى المزاد وتم تحديد المزايدة الفائزة.' : 'انتهى المزاد دون مزايدات.'}</p>}
  </main>;
}

function BidHistory({id}){
  const {request}=useAuth();const [data,setData]=useState(null),[failure,setFailure]=useState('');
  useEffect(()=>{const c=new AbortController();let busy=false;async function load(){if(busy)return;busy=true;try{const value=await request('/api/v1/auctions/'+id+'/bids',{signal:c.signal});if(!Array.isArray(value)||value.some(b=>!b.id||!Number.isFinite(Number(b.amount))))throw new ApiError('INVALID_RESPONSE');if(!c.signal.aborted){setData(value);setFailure('');}}catch(error){if(!c.signal.aborted)setFailure(errorMessage(error));}finally{busy=false;}}load();const timer=setInterval(load,5000);return()=>{c.abort();clearInterval(timer);};},[id,request]);
  return <section className="activity-section"><h2>سجل المزايدات</h2>{failure&&<p className="feedback error" role="alert">{failure}</p>}{!data&&!failure&&<p role="status">جارٍ تحميل السجل…</p>}{data?.length===0&&<p className="empty-state">لم تسجّل مزايدات في هذا المزاد بعد.</p>}{!!data?.length&&<ol className="bid-history">{data.map(b=><li key={b.id}><bdi dir="ltr">{amount(b.amount)}</bdi> ر.س <time dateTime={b.created_at}>{new Date(b.created_at).toLocaleString('ar-SA-u-nu-latn',{calendar:'gregory'})}</time></li>)}</ol>}</section>;
}
