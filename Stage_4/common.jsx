import React, { useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage } from '../api.js';
import { useAuth } from '../auth/AuthProvider.jsx';

export const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export const listingStatus = value => ({PENDING_REVIEW:'قيد المراجعة',APPROVED:'معتمد',REJECTED:'يحتاج إلى تعديل'}[value] || 'غير محدد');
export const validListing = value => value && uuid(value.id) && typeof value.title==='string' && typeof value.description==='string' && ['PENDING_REVIEW','APPROVED','REJECTED'].includes(value.status);
export const validAuction = value => value && uuid(value.id) && typeof value.title==='string' && Number(value.current_price)>0 && ['ACTIVE','SCHEDULED','CLOSED'].includes(value.status);
export const money = value => /^\d+(?:\.\d{1,2})?$/.test(String(value)) && Number(value)>0 && Number(value)<=999999999999.99;
export const navigate = value => { window.location.hash=value; };

export function useData(path, validate, poll=0) {
  const {request}=useAuth();
  const [data,setData]=useState(null),[failure,setFailure]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
  const validator=useRef(validate);validator.current=validate;
  useEffect(()=>{
    const controller=new AbortController();let busy=false;
    setData(null);setFailure('');setLoading(true);
    async function load(){
      if(busy)return;busy=true;
      try{const value=await request(path,{signal:controller.signal});if(!validator.current(value))throw new ApiError('INVALID_RESPONSE');
        if(!controller.signal.aborted){setData(value);setFailure('');}}
      catch(error){if(!controller.signal.aborted)setFailure(errorMessage(error));}
      finally{busy=false;if(!controller.signal.aborted)setLoading(false);}
    }
    load();const timer=poll?setInterval(load,poll):null;
    return()=>{controller.abort();if(timer)clearInterval(timer);};
  },[path,request,poll,revision]);
  return {data,failure,loading,reload:()=>setRevision(x=>x+1)};
}
export function Feedback({failure,loading,reload}) {
  return <>{loading&&<p role="status">جارٍ تحميل البيانات…</p>}{failure&&<div className="feedback error" role="alert"><p>{failure}</p>{reload&&<button type="button" className="button secondary" onClick={reload}>إعادة المحاولة</button>}</div>}</>;
}
export function Page({title,trail,children,node}) {
  return <main className="content-shell workspace-page" data-design-node={node}><p className="eyebrow">{trail}</p><h1>{title}</h1>{children}</main>;
}
export function Field({label,id,error,children}) {
  return <div className="workspace-field"><label htmlFor={id}>{label}</label>{children}{error&&<p className="field-error" id={id+'-error'}>{error}</p>}</div>;
}
export function Confirm({title,children,pending,onConfirm,onCancel}) {
  const ref=useRef(null),previous=useRef(null);
  useEffect(()=>{previous.current=document.activeElement;ref.current?.focus();return()=>previous.current?.focus();},[]);
  const keys=event=>{
    if(event.key==='Escape'&&!pending)onCancel();
    if(event.key==='Tab'){
      const elements=[...ref.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled)')];
      const first=elements[0],last=elements.at(-1);
      if(!elements.length){event.preventDefault();return;}
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  };
  return <div className="dialog-shade"><section className="confirm-dialog" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="confirmation-title" onKeyDown={keys}>
    <h2 id="confirmation-title">{title}</h2>{children}<div className="workspace-actions"><button className="button primary" disabled={pending} onClick={onConfirm}>{pending?'جارٍ الإرسال…':'تأكيد'}</button><button className="button secondary" disabled={pending} onClick={onCancel}>إلغاء</button></div>
  </section></div>;
}
