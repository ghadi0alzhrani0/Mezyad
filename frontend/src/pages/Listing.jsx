import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useResource } from '../hooks.js';
import { Feedback, AssetDetails, Gallery, Status } from '../components.jsx';
import { categories } from '../../../shared/catalog.js';
export function imageError(files) {
  if (files.length > 6) return 'الحد الأقصى 6 صور.';
  if (
    files.some(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
    )
  )
    return 'استخدم صور JPEG أو PNG أو WebP، بحد أقصى 5 MB لكل صورة.';
  return '';
}
function ListingForm({ item }) {
  const navigate = useNavigate(),
    [categoryId, setCategoryId] = useState(item?.category_id || categories[0].id),
    [fields, setFields] = useState(item?.category_fields || {}),
    [title, setTitle] = useState(item?.title || ''),
    [description, setDescription] = useState(item?.description || ''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const category = categories.find((c) => c.id === categoryId);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      files = form.getAll('images').filter((file) => file.size);
    const invalid = imageError(files);
    if (invalid) return setError(invalid);
    if (!item && !files.length) return setError('أضف صورة واحدة على الأقل.');
    if (!Object.values(fields).some((value) => String(value).trim()))
      return setError('أضف تفاصيل المعروض الخاصة بالقسم.');
    setBusy(true);
    setError('');
    form.delete('images');
    for (const file of files) form.append('images', file);
    form.set(
      'category_fields',
      JSON.stringify(
        Object.fromEntries(Object.entries(fields).filter(([, value]) => String(value).trim()))
      )
    );
    try {
      const data = await api(item ? `/items/${item.id}` : '/items', {
        method: item ? 'PATCH' : 'POST',
        body: form,
      });
      navigate(`/listings/${data.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  function suggest() {
    const details = category.fields
      .filter(([key]) => String(fields[key] ?? '').trim())
      .map(([key, label]) => `${label}: ${fields[key]}`)
      .join('، ');
    setDescription(
      `${title.trim() || 'معروض جديد'} ضمن قسم ${category.name}.${details ? ` ${details}.` : ''}`
    );
  }
  return (
    <form onSubmit={submit} className="panel listing-form">
      <h1>{item ? 'تعديل الإعلان وإعادة إرساله' : 'إنشاء إعلان للمزاد'}</h1>
      <p>يراجع المشرف إعلانك قبل أن تتمكن من إنشاء المزاد.</p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <label>
        عنوان الإعلان
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={200}
        />
      </label>
      <label>
        القسم
        <select
          name="category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setFields({});
          }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>تفاصيل {category.name}</legend>
        <div className="form-grid">
          {category.fields.map(([key, label, type]) => (
            <label key={key}>
              {label}
              <input
                type={type || 'text'}
                value={fields[key] ?? ''}
                min={type === 'number' ? 0 : undefined}
                maxLength={type !== 'number' ? 500 : undefined}
                onChange={(e) => setFields((previous) => ({ ...previous, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        الوصف
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={5}
          maxLength={10000}
          rows={5}
        />
      </label>
      <button type="button" className="secondary" onClick={suggest}>
        اقترح وصفًا من التفاصيل
      </button>
      <p className="muted">يمكنك تعديل النص المقترح؛ لا تُضاف معلومات لم تدخلها.</p>
      {item && <p>تبقى الصور الحالية مرفقة. يمكنك إضافة صور حتى يصبح المجموع 6.</p>}
      <label>
        صور المعروض
        <input
          name="images"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => setError(imageError(Array.from(e.target.files)))}
        />
      </label>
      <p className="muted">حتى 6 صور؛ 5 MB للصورة. يتحقق الخادم من نوع الملف أيضًا.</p>
      <button type="submit" disabled={busy}>
        {busy ? 'جارٍ الإرسال…' : item ? 'إعادة إرسال للمراجعة' : 'إرسال للمراجعة'}
      </button>
      <Link to="/activity">العودة لنشاطي</Link>
    </form>
  );
}
export function CreateListing() {
  return <ListingForm />;
}
export function EditListing() {
  const { id } = useParams(),
    state = useResource(`/items/${id}`);
  return (
    <Feedback loading={state.loading} error={state.error}>
      {state.data &&
        (state.data.status === 'REJECTED' ? (
          <ListingForm key={id} item={state.data} />
        ) : (
          <p>الإعلان غير متاح للتعديل.</p>
        ))}
    </Feedback>
  );
}
export function Listing() {
  const { id } = useParams(),
    state = useResource(`/items/${id}`);
  return (
    <Feedback loading={state.loading} error={state.error}>
      {state.data && (
        <section className="panel">
          <h1>{state.data.title}</h1>
          <Status value={state.data.status} />
          {state.data.review_reason && (
            <p className="notice">سبب الرفض: {state.data.review_reason}</p>
          )}
          <Gallery item={state.data} />
          <AssetDetails item={state.data} />
          <div className="actions">
            {state.data.auction_id ? (
              <Link className="button" to={`/auctions/${state.data.auction_id}`}>
                عرض المزاد
              </Link>
            ) : state.data.status === 'APPROVED' ? (
              <Link className="button" to={`/listings/${id}/auction`}>
                إنشاء المزاد
              </Link>
            ) : state.data.status === 'REJECTED' ? (
              <Link className="button" to={`/listings/${id}/edit`}>
                تعديل وإعادة إرسال
              </Link>
            ) : (
              <p>بانتظار قرار المشرف.</p>
            )}
            <Link to="/activity">العودة لنشاطي</Link>
          </div>
        </section>
      )}
    </Feedback>
  );
}
const localDate = (value) =>
  new Date(value - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 19);
export function CreateAuction() {
  const { id } = useParams(),
    state = useResource(`/items/${id}`),
    navigate = useNavigate();
  const [visibility, setVisibility] = useState('PUBLIC'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [created, setCreated] = useState(null),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    setCreated(null);
  }, [id]);
  async function submit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (new Date(form.endTime) <= new Date(form.startTime))
      return setError('يجب أن يكون وقت النهاية بعد وقت البداية.');
    setBusy(true);
    setError('');
    try {
      const data = await api('/auctions', {
        method: 'POST',
        body: {
          ...form,
          itemId: id,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        },
      });
      if (data.accessCode) setCreated(data);
      else navigate(`/auctions/${data.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (created)
    return (
      <section className="panel narrow">
        <h1>تم إنشاء المزاد الخاص</h1>
        <p>احفظ رمز الدعوة الآن؛ يُعرض مرة واحدة فقط.</p>
        <label>
          رمز الدعوة
          <input readOnly value={created.accessCode} dir="ltr" />
        </label>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(created.accessCode);
              setCopied(true);
            } catch {
              setError('انسخ الرمز يدويًا من الحقل.');
            }
          }}
        >
          نسخ الرمز
        </button>
        {copied && <p role="status">تم النسخ.</p>}
        {error && <p role="alert">{error}</p>}
        <p>
          رابط المزاد: <Link to={`/auctions/${created.id}`}>{created.id}</Link>
        </p>
        <Link className="button" to={`/auctions/${created.id}`}>
          عرض المزاد
        </Link>
      </section>
    );
  return (
    <Feedback loading={state.loading} error={state.error}>
      {state.data &&
        (state.data.status !== 'APPROVED' || state.data.auction_id ? (
          <p>يلزم إعلان معتمد لم يُنشأ له مزاد.</p>
        ) : (
          <form onSubmit={submit} className="panel narrow">
            <h1>إنشاء مزاد</h1>
            <h2>{state.data.title}</h2>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <label>
              نوع المزاد
              <select
                name="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="PUBLIC">عام</option>
                <option value="PRIVATE">خاص برمز دعوة</option>
              </select>
            </label>
            <label>
              سعر البداية (ر.س)
              <input name="startingPrice" type="number" min="0.01" step="0.01" required dir="ltr" />
            </label>
            <label>
              الحد الأدنى للزيادة (ر.س)
              <input
                name="minimumIncrement"
                type="number"
                min="0.01"
                step="0.01"
                required
                dir="ltr"
              />
            </label>
            <label>
              بداية المزاد
              <input
                name="startTime"
                type="datetime-local"
                step="1"
                defaultValue={localDate(Date.now())}
                required
                dir="ltr"
              />
            </label>
            <label>
              نهاية المزاد
              <input
                name="endTime"
                type="datetime-local"
                step="1"
                defaultValue={localDate(Date.now() + 86400000)}
                required
                dir="ltr"
              />
            </label>
            <button disabled={busy}>{busy ? 'جارٍ الإنشاء…' : 'إنشاء المزاد'}</button>
            <Link to={`/listings/${id}`}>العودة للإعلان</Link>
          </form>
        ))}
    </Feedback>
  );
}
