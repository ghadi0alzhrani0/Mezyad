import React, { useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage, requestApi } from '../api.js';
import { useAuth } from './AuthProvider.jsx';
import { validUser } from './session.js';

const initialForm = { name: '', email: '', password: '' };

function validate(form, mode) {
  const errors = {};
  if (mode === 'register' && (!form.name.trim() || [...form.name.trim()].length > 160)) {
    errors.name = 'أدخل اسمًا من 1 إلى 160 حرفًا.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.trim().length > 254) {
    errors.email = 'أدخل بريدًا إلكترونيًا صحيحًا.';
  }
  if (!form.password || (mode === 'register' && form.password.length < 8)) {
    errors.password = mode === 'register' ? 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.' : 'أدخل كلمة المرور.';
  } else if (new TextEncoder().encode(form.password).length > 72) {
    errors.password = 'كلمة المرور طويلة جدًا. استخدم كلمة أقصر.';
  }
  return errors;
}

export function AccountPanel({ initialMode = 'login', onModeChange, children }) {
  const { session, status, notice, signIn, signOut, verifySession } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fields = useRef({});

  const changeMode = next => {
    setMode(next);
    onModeChange?.(next);
    setForm(value => ({ ...value, password: '' }));
    setErrors({}); setFailure(''); setSuccess(''); setShowPassword(false);
  };

  // Mirror explicit page navigation without discarding registration success.
  useEffect(() => {
    if (initialMode !== mode) {
      setMode(initialMode);
      setForm(value => ({ ...value, password: '' }));
      setErrors({}); setFailure(''); setSuccess(''); setShowPassword(false);
    }
  }, [initialMode]);

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const invalid = validate(form, mode);
    setErrors(invalid); setFailure(''); setSuccess('');
    const first = Object.keys(invalid)[0];
    if (first) { fields.current[first]?.focus(); return; }
    setPending(true);
    try {
      if (mode === 'register') {
        const created = await requestApi('/api/v1/auth/register', {
          method: 'POST', body: { name: form.name.trim(), email: form.email.trim(), password: form.password },
        });
        if (!validUser(created) || created.role !== 'USER') throw new ApiError('INVALID_RESPONSE');
        setMode('login');
        onModeChange?.('login');
        setForm({ name: '', email: form.email.trim(), password: '' });
        setShowPassword(false);
        setSuccess('تم إنشاء حسابك. سجّل الدخول للمتابعة.');
      } else {
        await signIn(form.email.trim(), form.password);
        setForm(initialForm); setShowPassword(false);
      }
    } catch (error) { setFailure(errorMessage(error)); }
    finally { setPending(false); }
  }

  async function logout() {
    setPending(true); setFailure(''); setSuccess('');
    try { await signOut(); }
    catch (error) { setFailure(errorMessage(error)); }
    finally { setPending(false); }
  }

  if (status === 'authenticated') return <main className="content-shell account-page">
    <p className="eyebrow">حسابي / نظرة عامة</p>
    <h1>مرحبًا، {session.user.name}</h1><p className="section-description">تابع مزايداتك ومزاداتك من مكان واحد.</p>
    {(notice || success) && <p className="feedback success" role="status">{success || notice}</p>}
    {failure && <p className="feedback error" role="alert">{failure}</p>}
    <div className="account-summary">
      <div className="account-avatar" aria-label="رمز الحساب">{[...session.user.name.trim()][0]}</div>
      <div><h2>{session.user.name}</h2><p className="account-email" dir="ltr">{session.user.email}</p></div>
      <button className="button secondary logout-button" type="button" onClick={logout} disabled={pending}>
        {pending ? 'جارٍ تسجيل الخروج…' : 'تسجيل الخروج'}
      </button>
    </div>
    {children}
  </main>;

  return <main className={'auth-view ' + (mode === 'register' ? 'signup-view' : 'login-view')}>
    <img className="auth-photo" src={mode === 'register' ? '/images/signup-interior.png' : '/images/signin-interior.png'} alt=""/>
    <section className="auth-panel" aria-labelledby="account-heading" aria-busy={status === 'checking'}>
      {status === 'checking' ? <><h1 id="account-heading">حسابي</h1><p role="status">جارٍ التحقق من جلسة الدخول…</p></>
        : status === 'unavailable' ? <><h1 id="account-heading">حسابي</h1>
          <p className="feedback error" role="alert">تعذر التحقق من جلسة الدخول. أعد المحاولة عند توفر الاتصال.</p>
          <button className="button primary" type="button" onClick={verifySession}>إعادة المحاولة</button></> : <>
          <p className="eyebrow">{mode === 'register' ? 'حساب جديد' : 'حساب مِزياد'}</p>
          <h1 id="account-heading">{mode === 'register' ? 'أنشئ حسابك' : 'مرحبًا بعودتك'}</h1>
          <p className="auth-description">{mode === 'register' ? 'أنشئ حسابًا للمتابعة والمشاركة في المزادات.' : 'سجّل دخولك لمتابعة مزايداتك ومزاداتك.'}</p>
          {(notice || success) && <p className="feedback success" role="status">{success || notice}</p>}
          {failure && <p className="feedback error" role="alert">{failure}</p>}
          <form onSubmit={submit} noValidate aria-busy={pending}>
            {mode === 'register' && <div className="account-field">
              <label htmlFor="account-name">الاسم الكامل</label>
              <input id="account-name" ref={element => { fields.current.name = element; }} autoComplete="name" placeholder="اكتب اسمك الكامل"
                value={form.name} disabled={pending} required aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                onChange={event => setForm({ ...form, name: event.target.value })}/>
              {errors.name && <p id="name-error" className="field-error">{errors.name}</p>}
            </div>}
            <div className="account-field">
              <label htmlFor="account-email">البريد الإلكتروني</label>
              <input id="account-email" ref={element => { fields.current.email = element; }} type="email" autoComplete="username"
                placeholder="أدخل بريدك الإلكتروني" value={form.email} disabled={pending} required aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                onChange={event => setForm({ ...form, email: event.target.value })}/>
              {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
            </div>
            {mode === 'register' && <div className="account-field">
              <label htmlFor="account-phone">رقم الجوال</label>
              <input id="account-phone" type="tel" placeholder="05xxxxxxxx" disabled aria-describedby="phone-status"/>
              <p className="field-hint" id="phone-status">غير مفعّل حاليًا، ولا يلزم لإنشاء الحساب.</p>
            </div>}
            <div className="account-field">
              <label htmlFor="account-password">كلمة المرور</label>
              <div className="password-field">
                <input id="account-password" ref={element => { fields.current.password = element; }}
                  type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'register' ? 'أنشئ كلمة مرور' : 'أدخل كلمة المرور'}
                  value={form.password} disabled={pending} required aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  onChange={event => setForm({ ...form, password: event.target.value })}/>
                <button type="button" className="password-toggle" disabled={pending}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-controls="account-password" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'إخفاء' : 'عرض'}
                </button>
              </div>
              {errors.password && <p id="password-error" className="field-error">{errors.password}</p>}
            </div>
            {mode === 'login' && <button className="text-action" type="button" disabled title="استعادة كلمة المرور لم تُفعّل بعد">نسيت كلمة المرور؟</button>}
            <button className="button primary account-submit" type="submit" disabled={pending}>
              {pending ? mode === 'register' ? 'جارٍ إنشاء الحساب…' : 'جارٍ تسجيل الدخول…' : mode === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول'}
            </button>
          </form>
          {mode === 'login' && <p className="account-prompt">ليس لديك حساب؟</p>}
          <button className="button secondary account-switch" type="button" disabled={pending} onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>
        </>}
    </section>
  </main>;
}
