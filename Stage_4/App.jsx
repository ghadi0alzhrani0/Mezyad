import React, { useEffect, useState } from 'react';
import { AccountPanel } from './auth/AccountPanel.jsx';
import { useAuth } from './auth/AuthProvider.jsx';
import { SiteHeader, SiteFooter } from './ui/SiteChrome.jsx';
import { AuctionDetails, AuctionList, categories } from './ui/Auctions.jsx';
import {Activity,ListingDetails} from './marketplace/Activity.jsx';
import {ListingForm} from './marketplace/ListingForm.jsx';
import {AdminReview} from './marketplace/AdminReview.jsx';
import {AuctionCreate} from './marketplace/AuctionCreate.jsx';
import {PrivateAccess,Commitment,BidForm,BidReceipt,AuctionResult} from './marketplace/Participation.jsx';
import {uuid,Page} from './marketplace/common.jsx';
import './marketplace/workspace.css';

const protectedViews=['activity','listing','listing-edit','auction-new','admin','private','commitment','bid','bid-success'];
function safeReturn(value){
 if(['activity','listing/new','admin','private'].includes(value))return value;
 const [view,id]=String(value||'').split('/');
 return protectedViews.includes(view)&&uuid(id)?view+'/'+id.toLowerCase():null;
}

function routeFromHash() {
  const [value, query = ''] = window.location.hash.slice(1).split('?');
  const returnTo=safeReturn(new URLSearchParams(query).get('return'));
  const requestedAuction = new URLSearchParams(query).get('auction');
  const authAuction = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestedAuction || '') ? requestedAuction.toLowerCase() : undefined;
  if (/^auction\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return { view: 'auction', id: value.slice(8).toLowerCase() };
  const [view, category] = value.split('/');
  if (protectedViews.includes(view)||view==='result') {
    if(view==='listing'&&category==='new')return {view:'listing-new'};
    if(['activity','admin','private'].includes(view)&&!category)return {view};
    if(uuid(category))return {view,id:category.toLowerCase()};
  }
  if (view === 'auctions') return { view, category: categories.some(c => c.key === category) ? category : undefined };
  return { view: ['login', 'register', 'account'].includes(view) ? view : 'home', authAuction,returnTo };
}
const go = value => { window.location.hash = value; };

export function App() {
  const { status,session } = useAuth();
  const [receipt,setReceipt]=useState(null);
  useEffect(()=>setReceipt(null),[session?.user.id]);
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const read = () => { setRoute(routeFromHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  useEffect(() => {
    if (status === 'authenticated' && ['login', 'register'].includes(route.view)) {
      go(route.authAuction ? 'auction/' + route.authAuction : route.returnTo||'account');
    }
    if (status === 'guest' && route.view === 'account') go('login');
    if(status==='guest'&&(protectedViews.includes(route.view)||route.view==='listing-new'))go('login?return='+encodeURIComponent(route.view==='listing-new'?'listing/new':route.view+(route.id?'/'+route.id:'')));
  }, [status, route.view, route.authAuction,route.returnTo,route.id]);
  const workspaceView=protectedViews.includes(route.view)||['listing-new','result'].includes(route.view);
  let workspace;
  if(workspaceView){
    if(route.view!=='result'&&status!=='authenticated')workspace=<AccountPanel/>;
    else if(route.view==='admin'&&session.user.role!=='ADMIN')workspace=<Page title="لا تملك صلاحية الوصول"><p role="alert">هذه الصفحة مخصصة للمشرف.</p><a className="button secondary" href="#account">العودة إلى حسابي</a></Page>;
    else workspace=({activity:<Activity/>,listing:<ListingDetails id={route.id}/>, 'listing-new':<ListingForm/>, 'listing-edit':<ListingForm id={route.id}/>, 'auction-new':<AuctionCreate id={route.id}/>,admin:<AdminReview id={route.id}/>,private:<PrivateAccess id={route.id}/>,commitment:<Commitment id={route.id}/>,bid:<BidForm id={route.id} onAccepted={setReceipt}/>, 'bid-success':<BidReceipt id={route.id} receipt={receipt}/>,result:<AuctionResult id={route.id} receipt={receipt}/>})[route.view];
  }
  if(workspaceView)workspace=<React.Fragment key={route.view+'/'+(route.id||'')}>{workspace}</React.Fragment>;
  const accountView = ['login', 'register', 'account'].includes(route.view);
  return <>
    <SiteHeader signedIn={status === 'authenticated'} accountView={accountView}/>
    {workspaceView?workspace:accountView ? <AccountPanel initialMode={route.view === 'register' ? 'register' : 'login'}
      onModeChange={mode => go((mode === 'register' ? 'register' : 'login') + (route.authAuction ? '?auction=' + route.authAuction : route.returnTo?'?return='+encodeURIComponent(route.returnTo):''))}>
        <div className="workspace-actions"><a className="button primary" href="#activity">مزاداتي ونشاطي</a><a className="button secondary" href="#listing/new">إنشاء إعلان</a><a className="button secondary" href="#private">الدخول إلى مزاد خاص</a>{session?.user.role==='ADMIN'&&<a className="button secondary" href="#admin">مراجعة الإعلانات</a>}</div>
      </AccountPanel>
      : route.view === 'auction' ? <AuctionDetails id={route.id} receipt={receipt} onParticipate={()=>go('commitment/'+route.id)} onRequireLogin={() => go('login?auction=' + route.id)}/>
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
