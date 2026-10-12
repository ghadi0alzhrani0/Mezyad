import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from './api.js';
import { Protected, useAuth } from './auth.jsx';
import { Account } from './pages/Account.jsx';
import { Browse } from './pages/Browse.jsx';
import { Auction, Commitment } from './pages/Auction.jsx';
import { CreateListing, EditListing, Listing, CreateAuction } from './pages/Listing.jsx';
import { Activity, PrivateAccess, AdminReview } from './pages/Activity.jsx';
export default function App() {
  const { user, setUser, error } = useAuth(),
    navigate = useNavigate(),
    [logoutError, setLogoutError] = useState('');
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      navigate('/');
      setLogoutError('');
    } catch (error) {
      setLogoutError(error.message);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        انتقل للمحتوى
      </a>
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="مزياد — الرئيسية">
          مِزياد
        </Link>
        <nav aria-label="التنقل الرئيسي">
          <NavLink to="/">الرئيسية</NavLink>
          <NavLink to="/auctions">المزادات</NavLink>
          {user?.role === 'USER' && <NavLink to="/activity">نشاطي</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin">المراجعة</NavLink>}
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <button className="text-button" onClick={logout}>
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">تسجيل الدخول</NavLink>
              <NavLink className="button secondary" to="/register">
                إنشاء حساب
              </NavLink>
            </>
          )}
        </nav>
      </header>
      {(error || logoutError) && (
        <p className="notice error" role="alert">
          {error || logoutError}
        </p>
      )}
      <main id="main">
        <Routes>
          <Route path="/" element={<Browse home />} />
          <Route path="/register" element={<Account register />} />
          <Route path="/login" element={<Account />} />
          <Route path="/auctions" element={<Browse />} />
          <Route path="/auctions/:id" element={<Auction />} />
          <Route
            path="/auctions/:id/commitment"
            element={
              <Protected>
                <Commitment />
              </Protected>
            }
          />
          <Route
            path="/private-access"
            element={
              <Protected>
                <PrivateAccess />
              </Protected>
            }
          />
          <Route
            path="/activity"
            element={
              <Protected>
                <Activity />
              </Protected>
            }
          />
          <Route
            path="/listings/new"
            element={
              <Protected>
                <CreateListing />
              </Protected>
            }
          />
          <Route
            path="/listings/:id"
            element={
              <Protected>
                <Listing />
              </Protected>
            }
          />
          <Route
            path="/listings/:id/edit"
            element={
              <Protected>
                <EditListing />
              </Protected>
            }
          />
          <Route
            path="/listings/:id/auction"
            element={
              <Protected>
                <CreateAuction />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected admin>
                <AdminReview />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <section className="panel">
                <h1>الصفحة غير موجودة</h1>
                <Link to="/">العودة للرئيسية</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer className="site-footer">
        <Link className="wordmark" to="/">
          مِزياد
        </Link>
        <p>مزادات الإبل والعقارات والسيارات واللوحات المميزة.</p>
        <nav aria-label="روابط التذييل">
          <Link to="/auctions">تصفح المزادات</Link>
          <Link to="/private-access">مزاد خاص</Link>
          <Link to={user?.role === 'ADMIN' ? '/admin' : '/activity'}>
            {user?.role === 'ADMIN' ? 'مراجعة الإعلانات' : 'نشاطي'}
          </Link>
        </nav>
      </footer>
    </>
  );
}
