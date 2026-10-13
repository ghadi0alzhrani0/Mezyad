import React,{useEffect,useState,useRef} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {amount, safeImage} from '../ui/Auctions.jsx';
import {Page,Field,Feedback,Confirm,useData,validAuction,uuid,money,navigate} from './common.jsx';

export function PrivateAccess({id}){
  const {request}=useAuth();const [auctionId,setAuctionId]=useState(id||''),[code,setCode]=useState(''),[pending,setPending]=useState(false),[failure,setFailure]=useState('');
  async function submit(e){e.preventDefault();setFailure('');let target=auctionId;try{if(!uuid(target)){const link=new URL(target,window.location.origin);target=link.hash.match(/^#(?:private|auction)\/([a-f0-9-]{36})$/i)?.[1]||target;}}catch{}if(!uuid(target)||!code.trim()){setFailure('أدخل رابط المزاد أو معرّفه الصحيح ورمز الوصول.');return;}setPending(true);
    try{const result=await request('/api/v1/auctions/'+target+'/access',{method:'POST',body:{accessCode:code.trim()}});if(result?.accessGranted!==true)throw new ApiError('INVALID_RESPONSE');setCode('');navigate('auction/'+target.toLowerCase());}
    catch(error){setFailure(errorMessage(error));}finally{setPending(false);}
  }
  return <Page title="الدخول إلى المزاد الخاص" trail="مزاد خاص" node="422:176"><form className="workspace-panel narrow-panel" onSubmit={submit} noValidate><p className="section-description">أدخل رمز الوصول الذي شاركه معك البائع.</p>
    {!id&&<Field label="رابط المزاد أو معرّفه" id="private-id"><input id="private-id" value={auctionId} onChange={e=>setAuctionId(e.target.value)} dir="ltr" disabled={pending}/></Field>}
    <Field label="رمز الوصول" id="private-code"><input id="private-code" value={code} onChange={e=>setCode(e.target.value)} dir="ltr" autoComplete="off" disabled={pending} required/></Field>
    {failure&&<p role="alert" className="feedback error">{failure}</p>}<div className="workspace-actions"><button className="button primary" disabled={pending}>{pending?'جارٍ التحقق…':'التحقق من الرمز'}</button><a className="button secondary" href="#auctions">العودة إلى المزادات</a></div>
  </form></Page>;
}

export function Commitment({id}){
  const {request,session}=useAuth();const auction=useData('/api/v1/auctions/'+id,v=>validAuction(v)&&v.id===id);
  const [status,setStatus]=useState(null),[failure,setFailure]=useState(''),[checking,setChecking]=useState(true),[pending,setPending]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{const c=new AbortController();setChecking(true);setStatus(null);setFailure('');request('/api/v1/auctions/'+id+'/commitment',{signal:c.signal}).then(value=>{
    if(!uuid(value?.id)||!['PENDING','SUCCESS','FAILED'].includes(value.status))throw new ApiError('INVALID_RESPONSE');if(!c.signal.aborted)setStatus(value.status);
  }).catch(error=>{if(!c.signal.aborted&&error.status!==404)setFailure(errorMessage(error));}).finally(()=>{if(!c.signal.aborted)setChecking(false);});return()=>c.abort();},[id,request,retry]);
  async function start(){if(pending)return;setPending(true);setFailure('');try{const value=await request('/api/v1/auctions/'+id+'/commitment',{method:'POST'});if(!uuid(value?.id)||!['PENDING','SUCCESS','FAILED'].includes(value.status))throw new ApiError('INVALID_RESPONSE');setStatus(value.status);}catch(error){setFailure(errorMessage(error));}finally{setPending(false);}}
  const owner=auction.data?.seller_id===session.user.id;
  return <Page title="تأكيد المشاركة" trail="المزادات / تأكيد المشاركة" node="422:289"><Feedback {...auction}/>{auction.data&&<section className="workspace-panel narrow-panel"><h2>{auction.data.title}</h2><p className="detail-price"><bdi dir="ltr">{amount(auction.data.current_price)}</bdi> ر.س</p>
    {checking?<p role="status">جارٍ التحقق من حالة المشاركة…</p>:<><p className="status-pill">{({SUCCESS:'تأكيد المشاركة مكتمل',PENDING:'تأكيد المشاركة قيد المعالجة',FAILED:'لم يكتمل تأكيد المشاركة'})[status]||'لم يبدأ التأكيد بعد'}</p>{failure&&<p className="feedback error" role="alert">{failure}</p>}
      {owner?<p role="alert">لا يمكنك المشاركة في مزاد تملكه.</p>:status==='SUCCESS'?<a className="button primary" href={'#bid/'+id}>متابعة إلى المزايدة</a>:<button className="button primary" disabled={pending} onClick={start}>{pending?'جارٍ تأكيد المشاركة…':'ابدأ تأكيد المشاركة'}</button>}
      <button className="button secondary" disabled={pending} onClick={()=>setRetry(x=>x+1)}>تحديث حالة المشاركة</button>
    </>}<div className="workspace-actions"><a className="button secondary" href={'#auction/'+id}>العودة إلى تفاصيل المزاد</a></div>
  </section>}</Page>;
}

export function BidForm({id,onAccepted}){
  const {request,session}=useAuth();const auction=useData('/api/v1/auctions/'+id,v=>validAuction(v)&&v.id===id,5000);
  const history=useData('/api/v1/auctions/'+id+'/bids',v=>Array.isArray(v)&&v.every(b=>uuid(b.id)&&Number(b.amount)>0),5000);
  const commitment=useData('/api/v1/auctions/'+id+'/commitment',v=>uuid(v?.id)&&['SUCCESS','PENDING','FAILED'].includes(v.status));
  const [value,setValue]=useState(''),[confirm,setConfirm]=useState(false),[pending,setPending]=useState(false),[failure,setFailure]=useState('');
  const requestId=useRef(null),draft=useRef('');
  const minimum=auction.data?(history.data?.length?Math.round(Number(auction.data.current_price)*100)+Math.round(Number(auction.data.minimum_increment)*100):Math.round(Number(auction.data.starting_price)*100))/100:0;
  const ended=auction.data&&(auction.data.status==='CLOSED'||Date.parse(auction.data.end_time)<=Date.now()||Date.parse(auction.data.start_time)>Date.now());
  const owner=auction.data?.seller_id===session.user.id;
  function prepare(e){e.preventDefault();setFailure('');if(!money(value)||Number(value)<minimum){setFailure('أدخل مبلغًا لا يقل عن '+amount(minimum)+' ر.س');return;}
    if(draft.current!==value||!requestId.current){requestId.current=crypto.randomUUID();draft.current=value;}setConfirm(true);
  }
  async function send(){if(pending)return;setPending(true);setFailure('');try{
    const accepted=await request('/api/v1/auctions/'+id+'/bids',{method:'POST',body:{amount:Number(value),requestId:requestId.current}});
    if(!uuid(accepted?.bidId)||Number(accepted.amount)!==Number(value)||Number(accepted.currentPrice)!==Number(value))throw new ApiError('INVALID_RESPONSE');
    onAccepted({auctionId:id,bidId:accepted.bidId,amount:Number(accepted.amount),userId:session.user.id});navigate('bid-success/'+id);
  }catch(error){setFailure(errorMessage(error));if(!['TIMEOUT','NETWORK_ERROR','DUPLICATE_REQUEST'].includes(error.code)){requestId.current=null;auction.reload();history.reload();}}finally{setPending(false);setConfirm(false);}}
  const usable=auction.data&&history.data&&commitment.data?.status==='SUCCESS'&&!ended&&!owner&&!auction.failure&&!history.failure;
  const image=safeImage(auction.data?.images?.[0]);
  return <Page title="إضافة مزايدة" trail="المزادات / إضافة مزايدة" node="7:105"><Feedback {...auction}/><Feedback {...history}/><Feedback {...commitment}/>{auction.data&&<div className="bid-layout"><section className="workspace-panel"><h2>{auction.data.title}</h2><p className="section-description">السعر الحالي: <bdi dir="ltr">{amount(auction.data.current_price)}</bdi> ر.س</p><p>الحد الأدنى للمزايدة: <bdi dir="ltr">{amount(minimum)}</bdi> ر.س</p>
      {owner?<p role="alert">لا يمكنك المزايدة على مزاد تملكه.</p>:ended?<p role="status">المزاد غير متاح للمزايدة في الوقت الحالي.</p>:commitment.data&&commitment.data.status!=='SUCCESS'?<a className="button primary" href={'#commitment/'+id}>تأكيد المشاركة أولًا</a>:null}
      {failure&&<p className="feedback error" role="alert">{failure}</p>}
      <form onSubmit={prepare} noValidate><Field label="مبلغ مزايدتك (ر.س)" id="bid-amount"><input id="bid-amount" inputMode="decimal" dir="ltr" value={value} onChange={e=>setValue(e.target.value)} disabled={!usable||pending} required/></Field><button className="button primary" disabled={!usable||pending}>مراجعة المزايدة</button></form><a className="button secondary" href={'#auction/'+id}>العودة إلى تفاصيل المزاد</a>
    </section>{image&&<img className="bid-image" src={image} alt={auction.data.title}/>}</div>}
    {confirm&&<Confirm title="تأكيد المزايدة" pending={pending} onConfirm={send} onCancel={()=>setConfirm(false)}><p>{auction.data.title}</p><p><bdi dir="ltr">{amount(value)}</bdi> ر.س</p><p>يُتحقق من السعر وحالة المزاد عند إرسال المزايدة.</p></Confirm>}
  </Page>;
}

export function BidReceipt({id,receipt}){
  const auction=useData('/api/v1/auctions/'+id,v=>validAuction(v)&&v.id===id);
  return <Page title={receipt?.auctionId===id?'تم تسجيل المزايدة':'متابعة المزايدة'} node="7:136"><Feedback {...auction}/>{auction.data&&<section className="outcome-panel"><h2>{auction.data.title}</h2>{receipt?.auctionId===id?<p role="status">تم قبول مزايدتك بقيمة <bdi dir="ltr">{amount(receipt.amount)}</bdi> ر.س. تابع المزاد لمعرفة النتيجة.</p>:<p>افتح تفاصيل المزاد لمراجعة سجل المزايدات.</p>}<div className="workspace-actions"><a className="button primary" href={'#auction/'+id}>متابعة المزاد</a><a className="button secondary" href={'#result/'+id}>عرض نتيجة المزاد</a></div></section>}</Page>;
}
export function AuctionResult({id,receipt}){
  const {session}=useAuth();const auction=useData('/api/v1/auctions/'+id,v=>validAuction(v)&&v.id===id,5000);
  const winner=auction.data?.result?.winner_bid_id;
  const known=receipt?.auctionId===id&&receipt.userId===session?.user.id;
  const heading=auction.data?.status!=='CLOSED'?'المزاد لم ينتهِ بعد':!winner?'انتهى المزاد دون مزايدات':known?(winner===receipt.bidId?'فزت بالمزاد':'لم تفز بالمزاد'):'تم تحديد المزايدة الفائزة';
  return <Page title="نتيجة المزاد" trail="المزادات / النتيجة" node="424:89"><Feedback {...auction}/>{auction.data&&<section className="outcome-panel"><p className="eyebrow">{auction.data.title}</p><h2>{heading}</h2>
    {auction.data.status==='CLOSED'&&winner&&<p>أعلى مزايدة مقبولة: <bdi dir="ltr">{amount(auction.data.current_price)}</bdi> ر.س</p>}
    <div className="workspace-actions"><a className="button primary" href="#activity">الانتقال إلى نشاطي</a><a className="button secondary" href={'#auction/'+id}>عرض تفاصيل المزاد</a><a className="button secondary" href="#auctions">استكشاف المزادات</a></div>
  </section>}</Page>;
}
