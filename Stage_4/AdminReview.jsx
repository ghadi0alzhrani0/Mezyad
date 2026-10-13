import React,{useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {Page,Feedback,useData,validListing,Confirm,navigate} from './common.jsx';

export function AdminReview({id}){
  const {request,session}=useAuth();
  const data=useData(id?'/api/v1/items/'+id:'/api/v1/items?status=PENDING_REVIEW',v=>id?validListing(v)&&v.id===id:Array.isArray(v)&&v.every(validListing));
  const [decision,setDecision]=useState(null),[reason,setReason]=useState(''),[pending,setPending]=useState(false),[failure,setFailure]=useState('');
  if(session.user.role!=='ADMIN')return <Page title="لا تملك صلاحية الوصول"><p role="alert">هذه الصفحة مخصصة للمشرف.</p><a className="button secondary" href="#account">العودة إلى حسابي</a></Page>;
  async function review(){
    if(decision==='REJECTED'&&!reason.trim()){setFailure('أدخل سببًا واضحًا لرفض الإعلان.');setDecision(null);return;}
    setPending(true);setFailure('');
    try{const value=await request('/api/v1/admin/items/'+id+'/review',{method:'POST',body:{decision,...(decision==='REJECTED'?{reason:reason.trim()}: {})}});
      if(!validListing(value)||value.id!==id||value.status!==decision)throw new ApiError('INVALID_RESPONSE');navigate('admin');
    }catch(error){setFailure(errorMessage(error));}finally{setPending(false);setDecision(null);}
  }
  return <Page title={id?'مراجعة الإعلان':'الإعلانات قيد المراجعة'} trail="لوحة المشرف / مراجعة الإعلانات" node={id?'421:52':'421:2'}>
    <p className="section-description">راجع المعلومات المتاحة قبل قبول الإعلان أو رفضه.</p><Feedback {...data}/>{failure&&<p className="feedback error" role="alert">{failure}</p>}
    {!id&&data.data?.length===0&&<p className="empty-state">لا توجد إعلانات بانتظار المراجعة.</p>}
    {!id&&data.data?.map(item=><article className="activity-row" key={item.id}><div><h3>{item.title}</h3><p className="status-pill">قيد المراجعة</p></div><a className="button secondary" href={'#admin/'+item.id}>مراجعة الإعلان</a></article>)}
    {id&&data.data&&<section className="workspace-panel"><h2>{data.data.title}</h2><p className="review-copy">{data.data.description}</p>
      <dl className="workspace-summary">{Object.entries(data.data.category_fields||{}).map(([key,value])=><React.Fragment key={key}><dt>{key}</dt><dd>{typeof value==='object'?JSON.stringify(value):String(value)}</dd></React.Fragment>)}</dl>
      <p className="field-hint">الصور غير متاحة في بيانات الإعلان الحالية. تحقق من اكتمالها قبل الاعتماد.</p>
      {data.data.status==='PENDING_REVIEW'?<><label htmlFor="review-reason">سبب الرفض عند الحاجة</label><textarea id="review-reason" rows={3} value={reason} onChange={e=>setReason(e.target.value)}/><div className="workspace-actions"><button className="button primary" onClick={()=>setDecision('APPROVED')}>اعتماد الإعلان</button><button className="button secondary" onClick={()=>{if(reason.trim())setDecision('REJECTED');else setFailure('أدخل سببًا واضحًا لرفض الإعلان.');}}>رفض الإعلان</button></div></>:<p>هذا الإعلان لم يعد قيد المراجعة.</p>}
      <a className="button secondary" href="#admin">العودة إلى قائمة المراجعة</a>
    </section>}
    {decision&&<Confirm title={decision==='APPROVED'?'تأكيد اعتماد الإعلان':'تأكيد رفض الإعلان'} pending={pending} onConfirm={review} onCancel={()=>setDecision(null)}><p>{data.data?.title}</p>{decision==='REJECTED'&&<p>{reason}</p>}</Confirm>}
  </Page>;
}
