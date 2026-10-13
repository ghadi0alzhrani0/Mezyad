import React, { useEffect, useState } from 'react';
import { AccountPanel } from './auth/AccountPanel.jsx';
import { useAuth } from './auth/AuthProvider.jsx';
import { SiteHeader, SiteFooter } from './ui/SiteChrome.jsx';
import { AuctionDetails, AuctionList, categories } from './ui/Auctions.jsx';
import { ActivityDashboard } from './ui/ActivityDashboard.jsx';

function routeFromHash() {
  const [value, query = ''] = window.location.hash.slice(1).split('?');
  const requestedAuction = new URLSearchParams(query).get('auction');
  const authAuction = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestedAuction || '') ? requestedAuction.toLowerCase() : undefined;
  if (/^auction\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return { view: 'auction', id: value.slice(8).toLowerCase() };
  const [view, category] = value.split('/');
  if (view === 'auctions') return { view, category: categories.some(c => c.key === category) ? category : undefined };
  return { view: ['login', 'register', 'account', 'activity'].includes(view) ? view : 'home', authAuction };
}
const go = value => { window.location.hash = value; };

export function App() {
  const { status } = useAuth();
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const read = () => { setRoute(routeFromHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  useEffect(() => {
    if (status === 'authenticated' && ['login', 'register'].includes(route.view)) {
      go(route.authAuction ? 'auction/' + route.authAuction : 'account');
    }
    if (status === 'guest' && ['account', 'activity'].includes(route.view)) go('login');
  }, [status, route.view, route.authAuction]);
  const accountView = ['login', 'register', 'account'].includes(route.view);
  return <>
    <SiteHeader signedIn={status === 'authenticated'} accountView={accountView}/>
    {route.view === 'activity' ? <ActivityDashboard/> : accountView ? <AccountPanel initialMode={route.view === 'register' ? 'register' : 'login'}
      onModeChange={mode => go((mode === 'register' ? 'register' : 'login') + (route.authAuction ? '?auction=' + route.authAuction : ''))}/>
      : route.view === 'auction' ? <AuctionDetails id={route.id} onRequireLogin={() => go('login?auction=' + route.id)}/>
        : route.view === 'auctions' ? <main className="content-shell browse-page">
          <p className="eyebrow">المزادات / {categories.find(c => c.key === route.category)?.label || 'جميع الأقسام'}</p>
          <h1>المزادات</h1><p className="section-description">تصفح المزادات</p>
          <nav className="category-filters" aria-label="تصفية المزادات">
            <a className={'button ' + (!route.category ? 'primary' : 'secondary')} href="#auctions" aria-current={!route.category ? 'page' : undefined}>الكل</a>
            {categories.map(category => <a key={category.key} href={'#auctions/' + category.key}
              className={'button ' + (route.category === category.key ? 'primary' : 'secondary')}
              aria-current={route.category === category.key ? 'page' : undefined}>{category.label}</a>)}
          </nav>
          <AuctionList category={route.category}/>
          <section className="browse-editorial"><p className="eyebrow">أقسام مِزياد</p><h2>اعثر على ما تبحث عنه</h2>
            <p>يمكنك الانتقال بين الأقسام ومتابعة المزادات بحسب اهتماماتك.</p>
            <a className="button secondary" href="#home">العودة إلى الرئيسية</a></section>
        </main> : <main>
          <section className="home-hero">
            <img className="hero-photo" src="/images/home-interior.jpg" alt="مساحة داخلية سعودية بتفاصيل معمارية هادئة"/>
            <div className="hero-panel"><h1>مزادات مختارة<br/>لمعروضات عالية القيمة</h1>
              <p>استكشف مزادات الإبل والعقارات والسيارات النادرة واللوحات المميزة.</p>
              <a className="button primary" href="#auctions">استكشف المزادات</a></div>
          </section>
          <section className="auction-section content-shell"><h2>مزادات جارية</h2>
            <p className="section-description">استعرض المعروضات المتاحة الآن، ثم افتح المزاد الذي يهمك.</p><AuctionList home/></section>
          <section className="category-section"><div className="content-shell"><p className="eyebrow">تصفح حسب نوع المزادات</p>
            <h2>أقسام المزادات</h2><div className="category-grid">{categories.map((category, index) =>
              <a key={category.key} href={'#auctions/' + category.key}><span dir="ltr">{String(index + 1).padStart(2, '0')}</span><h3>{category.label}</h3></a>)}</div>
          </div></section>
          <section className="journey-section content-shell"><h2>تصفح المزادات، وقدّم مزايدتك</h2>
            <div className="journey-grid">{['تصفح المزادات', 'أضف مزايدتك', 'تابع نتيجة المزاد'].map((label, index) =>
              <div key={label}><span dir="ltr">{String(index + 1).padStart(2, '0')}</span><h3>{label}</h3></div>)}</div>
          </section>
        </main>}
    <SiteFooter/>
  </>;
}
