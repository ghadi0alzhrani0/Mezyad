import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api('/items?limit=1')
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((error) => {
        if (active && error.status !== 401) setError('تعذر الاتصال بالخادم. حاول تحديث الصفحة.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, ready, error }}>{children}</AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
export function Protected({ admin = false, children }) {
  const { user, ready } = useAuth(),
    location = useLocation();
  if (!ready) return <p role="status">جارٍ التحقق من الحساب…</p>;
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && user.role !== 'ADMIN') return <p role="alert">هذه الصفحة مخصصة للمشرف.</p>;
  if (!admin && user.role !== 'USER') return <p role="alert">هذه الصفحة مخصصة لحساب المستخدم.</p>;
  return children;
}
