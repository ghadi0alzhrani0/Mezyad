import React from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {Page,Feedback,useData,validListing,uuid,listingStatus} from './common.jsx';
import {statusLabel} from '../ui/Auctions.jsx';

export function Activity(){
  const {session}=useAuth();
  const listings=useData('/api/v1/me/items',v=>Array.isArray(v)&&v.every(validListing),5000);
  const auctions=useData('/api/v1/me/auctions',v=>Array.isArray(v)&&v.every(a=>uuid(a.id)&&typeof a.title==='string'&&['ACTIVE','SCHEDULED','CLOSED'].includes(a.status)),5000);
  return <Page title="مزاداتي ونشاطي" trail="حسابي / نشاطي" node="9:3">
    <p className="section-description">أضف معروضًا جديدًا وتابع حالة الإعلانات والمزادات.</p>
    <div className="workspace-actions"><a className="button primary" href="#listing/new">أنشئ إعلانًا جديدًا</a><a className="button secondary" href="#private">الدخول إلى مزاد خاص</a>{session.user.role==='ADMIN'&&<a className="button secondary" href="#admin">مراجعة الإعلانات</a>}</div>
    <section className="activity-section"><h2>إعلاناتي</h2><Feedback {...listings}/>{listings.data?.length===0&&<p className="empty-state">لم تضف إعلانًا بعد.</p>}
      {listings.data?.map(item=><article className="activity-row" key={item.id}><div><h3>{item.title}</h3><p className="status-pill">{listingStatus(item.status)}</p>{item.review_reason&&<p>{item.review_reason}</p>}</div><a className="button secondary" href={'#listing/'+item.id}>عرض الإعلان</a></article>)}
    </section>
    <section className="activity-section"><h2>المزادات المرتبطة بحسابي</h2><p className="section-description">المزادات التي أنشأتها أو شاركت فيها بمزايدة.</p><Feedback {...auctions}/>{auctions.data?.length===0&&<p className="empty-state">لا يوجد نشاط في المزادات حتى الآن.</p>}
      {auctions.data?.map(a=><article className="activity-row" key={a.id}><div><h3>{a.title}</h3><p className="status-pill">{statusLabel(a.status)}</p></div><a className="button secondary" href={'#auction/'+a.id}>عرض المزاد</a></article>)}
    </section>
  </Page>;
}
export function ListingDetails({id,admin=false}){
  const {session}=useAuth();const item=useData('/api/v1/items/'+id,v=>validListing(v)&&v.id===id);
  if(item.data&&item.data.seller_id!==session.user.id&&!admin)return <Page title="الإعلان غير متاح"><p role="alert">لا تملك صلاحية عرض هذا الإعلان.</p></Page>;
  return <Page title="تفاصيل الإعلان" trail="مزاداتي / الإعلان" node="421:103"><Feedback {...item}/>{item.data&&<section className="workspace-panel">
    <h2>{item.data.title}</h2><p className="status-pill">{listingStatus(item.data.status)}</p><p className="review-copy">{item.data.description}</p>
    {item.data.review_reason&&<p className="feedback">سبب الرفض: {item.data.review_reason}</p>}
    <div className="workspace-actions">{item.data.status==='APPROVED'&&<a className="button primary" href={'#auction-new/'+id}>إعداد المزاد</a>}{item.data.status==='REJECTED'&&<a className="button primary" href={'#listing-edit/'+id}>تعديل وإعادة إرسال</a>}<a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
  </section>}</Page>;
}
