import React, {useEffect,useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {categories} from '../ui/Auctions.jsx';
import {Page,Field,Feedback,useData,validListing,uuid,navigate} from './common.jsx';

const optionalFields={
  'Camels':[['name','اسم المعروض'],['age','العمر'],['location','الموقع']],
  'Real Estate':[['location','الموقع'],['area','المساحة (م²)']],
  'Rare Vehicles':[['make','الشركة'],['model','الطراز'],['year','سنة الصنع']],
  'Vehicle Plates':[['letters','الحروف'],['number','الرقم']],
  'Luxury Handbags':[['brand','العلامة'],['model','الإصدار']],
};
const labelFor=name=>categories.find(c=>c.name===name)?.label || (name==='Luxury Handbags'?'الحقائب الفاخرة':name);
export function ListingForm({id}){
  const {request,session}=useAuth();
  const catalog=useData('/api/v1/categories',v=>Array.isArray(v)&&v.every(c=>uuid(c.id)&&typeof c.name==='string'));
  const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[category,setCategory]=useState(''),[details,setDetails]=useState({});
  const [step,setStep]=useState(0),[photos,setPhotos]=useState([]),[previews,setPreviews]=useState([]),[failure,setFailure]=useState(''),[loading,setLoading]=useState(!!id),[pending,setPending]=useState(false),[loaded,setLoaded]=useState(!id);
  useEffect(()=>{
    if(!id)return;const controller=new AbortController();setLoading(true);
    request('/api/v1/items/'+id,{signal:controller.signal}).then(value=>{
      if(!validListing(value)||value.id!==id)throw new ApiError('INVALID_RESPONSE');
      if(value.seller_id!==session.user.id||value.status!=='REJECTED')throw new ApiError('FORBIDDEN',403);
      if(!controller.signal.aborted){setTitle(value.title);setDescription(value.description);setCategory(value.category_id);setDetails(value.category_fields||{});setLoaded(true);}
    }).catch(error=>{if(!controller.signal.aborted)setFailure(errorMessage(error));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[id,request,session.user.id]);
  useEffect(()=>{const urls=photos.map(file=>URL.createObjectURL(file));setPreviews(urls);return()=>urls.forEach(url=>URL.revokeObjectURL(url));},[photos]);
  const selected=catalog.data?.find(c=>c.id===category);
  function next(event){event.preventDefault();setFailure('');
    if(!category||!title.trim()||title.trim().length>240||!description.trim()){setFailure('اختر القسم وأدخل عنوانًا من 1 إلى 240 حرفًا ووصفًا للمعروض.');return;}
    setStep(1);
  }
  function choose(event){
    const files=[...event.target.files];const mime=['image/jpeg','image/png','image/webp'];
    if(files.some(file=>!mime.includes(file.type)||! /\.(jpe?g|png|webp)$/i.test(file.name))){setFailure('اختر صورًا بصيغة JPG أو PNG أو WebP.');event.target.value='';return;}
    setFailure('');setPhotos(files);
  }
  async function submit(){
    if(pending)return;setPending(true);setFailure('');
    const form=new FormData();form.set('categoryId',category);form.set('title',title.trim());form.set('description',description.trim());form.set('category_fields',JSON.stringify(details));photos.forEach(photo=>form.append('images',photo,photo.name));
    try{
      const value=await request(id?'/api/v1/items/'+id:'/api/v1/items',{method:id?'PATCH':'POST',body:form});
      if(!validListing(value)||value.status!=='PENDING_REVIEW'||value.seller_id!==session.user.id||(id&&value.id!==id))throw new ApiError('INVALID_RESPONSE');
      navigate('listing/'+value.id);
    }catch(error){setFailure(errorMessage(error));}finally{setPending(false);}
  }
  return <Page title={id?'تعديل الإعلان':'إنشاء إعلان'} trail="مزاداتي / تفاصيل المعروض" node="9:65">
    <p className="section-description">أضف وصفًا واضحًا ومعلومات يمكنك تأكيدها.</p>
    <Feedback loading={loading||catalog.loading} failure={catalog.failure} reload={catalog.reload}/>
    <ol className="workspace-steps" aria-label="خطوات الإعلان">{['تفاصيل المعروض','الصور','مراجعة الإعلان'].map((label,i)=><li key={label} aria-current={step===i?'step':undefined}><span dir="ltr">{i+1}</span> {label}</li>)}</ol>
    {failure&&<p className="feedback error" role="alert">{failure}</p>}
    {!loading&&loaded&&catalog.data&&<section className="workspace-panel form-panel">
      {step===0?<form onSubmit={next} noValidate>
        <Field label="عنوان الإعلان" id="listing-title"><input id="listing-title" value={title} maxLength={240} onChange={e=>setTitle(e.target.value)} required/></Field>
        <Field label="القسم" id="listing-category"><select id="listing-category" value={category} disabled={!!id} onChange={e=>{setCategory(e.target.value);setDetails({});}} required><option value="">اختر نوع المعروض</option>{catalog.data.map(c=><option key={c.id} value={c.id}>{labelFor(c.name)}</option>)}</select></Field>
        {(optionalFields[selected?.name]||[]).map(([key,label])=><Field key={key} label={label} id={'detail-'+key}><input id={'detail-'+key} value={details[key]||''} onChange={e=>setDetails({...details,[key]:e.target.value})}/></Field>)}
        <Field label="وصف المعروض" id="listing-description"><textarea id="listing-description" rows={5} value={description} onChange={e=>setDescription(e.target.value)} required/></Field>
        <button type="button" className="text-action" onClick={()=>setDescription([title,...Object.values(details)].filter(Boolean).join(' — '))}>اقتراح وصف من بياناتي</button>
        <p className="field-hint">راجع الوصف المقترح وتأكد من صحة البيانات قبل الإرسال.</p>
        <div className="workspace-actions"><button className="button primary" type="submit">متابعة إلى الصور</button><a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
      </form>:step===1?<>
        <h2>صور المعروض</h2><p className="section-description">اختر صورًا لنفس المعروض الذي تصفه في الإعلان.</p>
        <Field label="إضافة صور" id="listing-images"><input id="listing-images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={choose}/></Field>
        <div className="upload-previews">{previews.map((url,i)=><figure key={url}><img src={url} alt={'صورة مختارة '+(i+1)}/><figcaption>{photos[i].name}</figcaption></figure>)}</div>
        <div className="workspace-actions"><button className="button primary" disabled={!photos.length} onClick={()=>setStep(2)}>مراجعة الإعلان</button><button className="button secondary" onClick={()=>setStep(0)}>العودة إلى التفاصيل</button></div>
      </>:<>
        <h2>{title}</h2><p className="section-description">{labelFor(selected?.name)}</p><p className="review-copy">{description}</p>
        <dl className="workspace-summary">{Object.entries(details).map(([key,value])=><React.Fragment key={key}><dt>{optionalFields[selected?.name]?.find(f=>f[0]===key)?.[1]||key}</dt><dd>{typeof value==='object'?JSON.stringify(value):String(value)}</dd></React.Fragment>)}</dl>
        <div className="upload-previews">{previews.map((url,i)=><img key={url} src={url} alt={'صورة مختارة '+(i+1)}/>)}</div>
        <p className="section-description">تُراجع معلومات الإعلان قبل إتاحته لإنشاء مزاد.</p>
        <div className="workspace-actions"><button className="button primary" disabled={pending} onClick={submit}>{pending?'جارٍ إرسال الإعلان…':'إرسال للمراجعة'}</button><button className="button secondary" disabled={pending} onClick={()=>setStep(1)}>العودة إلى الصور</button></div>
      </>}
    </section>}
  </Page>;
}
