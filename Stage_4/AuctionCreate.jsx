import React,{useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {Page,Field,Feedback,useData,validListing,uuid,money} from './common.jsx';

export function AuctionCreate({id}){
  const {request,session}=useAuth();const item=useData('/api/v1/items/'+id,v=>validListing(v)&&v.id===id);
  const [form,setForm]=useState({visibility:'PUBLIC',startingPrice:'',minimumIncrement:'',startTime:'',endTime:''}),[pending,setPending]=useState(false),[failure,setFailure]=useState(''),[created,setCreated]=useState(null),[copyFailure,setCopyFailure]=useState('');
  const update=e=>setForm({...form,[e.target.name]:e.target.value});
  async function submit(e){
    e.preventDefault();setFailure('');
    if(!money(form.startingPrice)||!money(form.minimumIncrement)||!form.startTime||!form.endTime||!Number.isFinite(Date.parse(form.startTime))||Date.parse(form.endTime)<=Date.parse(form.startTime)){setFailure('أدخل سعرًا وزيادة موجبين، وحدد نهاية للمزاد بعد وقت البداية.');return;}
    setPending(true);
    try{const value=await request('/api/v1/auctions',{method:'POST',body:{...form,itemId:id,startingPrice:Number(form.startingPrice),minimumIncrement:Number(form.minimumIncrement),startTime:new Date(form.startTime).toISOString(),endTime:new Date(form.endTime).toISOString()}});
      if(!uuid(value?.id)||value.item_id!==id||value.visibility!==form.visibility||(form.visibility==='PRIVATE'&&typeof value.accessCode!=='string'))throw new ApiError('INVALID_RESPONSE');setCreated(value);
    }catch(error){setFailure(errorMessage(error));}finally{setPending(false);}
  }
  const allowed=item.data?.status==='APPROVED'&&item.data.seller_id===session.user.id;
  return <Page title={created?'تم إنشاء المزاد':'إعداد المزاد'} trail="مزاداتي / إعلان معتمد / إعداد المزاد" node="421:199"><Feedback {...item}/>{failure&&<p className="feedback error" role="alert">{failure}</p>}
    {item.data&&!allowed&&<p role="alert">يمكن إعداد مزاد لإعلان معتمد تملكه فقط.</p>}
    {created?<section className="workspace-panel"><h2>{item.data.title}</h2><p role="status">تم إنشاء المزاد بحسب المواعيد التي حددتها.</p>
      {created.visibility==='PRIVATE'&&<><Field label="رمز وصول المزاد الخاص" id="private-created-code"><input id="private-created-code" value={created.accessCode} readOnly dir="ltr"/></Field><p className="field-hint">احفظ هذا الرمز وشاركه مع المدعوين. لا يظهر لاحقًا ضمن تفاصيل المزاد.</p><button className="button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(created.accessCode);setCopyFailure('تم نسخ الرمز.');}catch{setCopyFailure('تعذر النسخ. يمكنك تحديد الرمز ونسخه يدويًا.');}}}>نسخ رمز الوصول</button><p role="status">{copyFailure}</p><p>رابط الدخول: <a href={'#private/'+created.id}>الدخول إلى هذا المزاد الخاص</a></p></>}
      <div className="workspace-actions"><a className="button primary" href={'#auction/'+created.id}>عرض المزاد</a><a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
    </section>:allowed&&<form className="workspace-panel form-panel" onSubmit={submit} noValidate><h2>{item.data.title}</h2><p className="section-description">حدّد طريقة الوصول وسعر البداية ومواعيد المزاد.</p>
      <Field label="نوع المزاد" id="auction-visibility"><select id="auction-visibility" name="visibility" value={form.visibility} onChange={update} disabled={pending}><option value="PUBLIC">عام</option><option value="PRIVATE">خاص</option></select></Field>
      <Field label="سعر البداية (ر.س)" id="auction-starting"><input id="auction-starting" name="startingPrice" inputMode="decimal" dir="ltr" value={form.startingPrice} onChange={update} disabled={pending} required/></Field>
      <Field label="الحد الأدنى لزيادة المزايدة (ر.س)" id="auction-increment"><input id="auction-increment" name="minimumIncrement" inputMode="decimal" dir="ltr" value={form.minimumIncrement} onChange={update} disabled={pending} required/></Field>
      <div className="form-columns"><Field label="بداية المزاد" id="auction-start"><input id="auction-start" name="startTime" type="datetime-local" lang="en" dir="ltr" value={form.startTime} onChange={update} disabled={pending} required/></Field><Field label="نهاية المزاد" id="auction-end"><input id="auction-end" name="endTime" type="datetime-local" lang="en" dir="ltr" value={form.endTime} onChange={update} disabled={pending} required/></Field></div>
      <p className="field-hint">المزاد الخاص لا يظهر للعامة ويتطلب رمز وصول. الأوقات وفق المنطقة الزمنية لجهازك.</p>
      <div className="workspace-actions"><button className="button primary" disabled={pending}>{pending?'جارٍ إنشاء المزاد…':'إنشاء المزاد'}</button><a className="button secondary" href={'#listing/'+id}>العودة إلى الإعلان المعتمد</a></div>
    </form>}
  </Page>;
}
