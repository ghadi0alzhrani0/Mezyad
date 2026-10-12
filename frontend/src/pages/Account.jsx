import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
export function Account({ register = false }) {
  const { setUser } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      body = Object.fromEntries(form.entries());
    if (register && body.password.length < 10)
      return setError('كلمة المرور يجب أن تتكون من 10 أحرف على الأقل.');
    setBusy(true);
    setError('');
    try {
      const data = await api(register ? '/auth/register' : '/auth/login', { method: 'POST', body });
      if (register) navigate('/login', { state: { registered: true, from: location.state?.from } });
      else {
        setUser(data);
        const from = location.state?.from;
        navigate(
          from?.startsWith('/') && !from.startsWith('//')
            ? from
            : data.role === 'ADMIN'
              ? '/admin'
              : '/activity',
          { replace: true }
        );
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-layout">
      <div className="account-intro">
        <span className="eyebrow">مِزياد</span>
        <h1>{register ? 'حساب واحد، فرص متعددة' : 'مرحبًا بعودتك'}</h1>
        <p>تابع مزاداتك، واعرض مقتنياتك، وشارك في المزايدة من حساب واحد.</p>
      </div>
      <form className="panel account-form" onSubmit={submit}>
        <h2>{register ? 'إنشاء حساب' : 'تسجيل الدخول'}</h2>
        {location.state?.registered && <p role="status">تم إنشاء حسابك. سجّل الدخول للمتابعة.</p>}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        {register && (
          <label>
            الاسم
            <input name="name" required maxLength={120} autoComplete="name" />
          </label>
        )}
        <label>
          البريد الإلكتروني
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            dir="ltr"
            autoComplete="email"
          />
        </label>
        <label>
          كلمة المرور
          <input
            name="password"
            type="password"
            required
            minLength={register ? 10 : 1}
            maxLength={128}
            autoComplete={register ? 'new-password' : 'current-password'}
          />
        </label>
        {register && <p className="muted">10 أحرف على الأقل.</p>}
        <button disabled={busy} type="submit">
          {busy ? 'جارٍ المتابعة…' : register ? 'إنشاء حساب' : 'تسجيل الدخول'}
        </button>
        <p>
          {register ? 'لديك حساب؟' : 'ليس لديك حساب؟'}{' '}
          <Link to={register ? '/login' : '/register'} state={location.state}>
            {register ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </Link>
        </p>
      </form>
    </section>
  );
}
