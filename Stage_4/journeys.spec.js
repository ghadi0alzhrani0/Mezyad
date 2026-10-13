import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
const requireBackend=createRequire(new URL('../../backend/package.json',import.meta.url));
const {Pool}=requireBackend('pg');
const fixture=()=>readFile(process.env.E2E_FIXTURE_FILE||path.join(os.tmpdir(),'frontend-browser-fixtures.json'),'utf8').then(JSON.parse);
async function login(page,role){const f=await fixture();await page.goto('/#login');await page.getByLabel('البريد الإلكتروني').fill(role+'@example.invalid');await page.getByLabel('كلمة المرور',{exact:true}).fill(f.password);await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();await expect(page.getByRole('link',{name:'حسابي',exact:true})).toBeVisible();return f;}

test('registration, login return and logout use the real API',async({page})=>{
 const f=await fixture(),email='browser-'+Date.now()+'@example.invalid';await page.goto('/#register');await page.getByLabel('الاسم الكامل').fill('Browser member');await page.getByLabel('البريد الإلكتروني').fill(email);await page.getByLabel('كلمة المرور',{exact:true}).fill(f.password);await page.getByRole('button',{name:'إنشاء الحساب',exact:true}).click();await expect(page.getByText('تم إنشاء حسابك. سجّل الدخول للمتابعة.')).toBeVisible();await page.getByLabel('كلمة المرور',{exact:true}).fill(f.password);await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();await expect(page.getByRole('heading',{name:'مرحبًا، Browser member'})).toBeVisible();await page.getByRole('button',{name:'تسجيل الخروج',exact:true}).click();await expect(page.getByRole('heading',{name:'مرحبًا بعودتك'})).toBeVisible();
});
test('public details preserve identity and bank unavailable does not submit a bid',async({page})=>{
 const f=await login(page,'bidder');let posts=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/bids'))posts++;});await page.goto('/#auction/'+f.auctions.public);await expect(page.getByRole('heading',{name:'QA public'})).toBeVisible();await page.getByRole('button',{name:'أضف مزايدتك',exact:true}).click();await page.getByRole('button',{name:'ابدأ تأكيد المشاركة'}).click();await expect(page.getByRole('alert')).toContainText('لم يتم اعتماد المشاركة');expect(posts).toBe(0);await page.getByRole('link',{name:'العودة إلى تفاصيل المزاد'}).click();await expect(page.getByRole('heading',{name:'QA public'})).toBeVisible();
});
test('private wrong code is denied; correct code opens the same private auction',async({page})=>{
 const f=await login(page,'bidder');await page.goto('/#private/'+f.auctions.private);await page.getByLabel('رمز الوصول').fill('wrong');await page.getByRole('button',{name:'التحقق من الرمز'}).click();await expect(page.getByRole('alert')).toContainText('رمز الوصول غير صحيح');await page.getByLabel('رمز الوصول').fill('local-private-qa');await page.getByRole('button',{name:'التحقق من الرمز'}).click();await expect(page.getByRole('heading',{name:'QA private'})).toBeVisible();expect(page.url()).toContain(f.auctions.private);
});
test('ordinary USER cannot open admin review',async({page})=>{
 await login(page,'bidder');await page.goto('/#admin');await expect(page.getByRole('alert')).toContainText('مخصصة للمشرف');expect(await page.getByRole('button',{name:'اعتماد الإعلان'}).count()).toBe(0);
});
test('administrator reviews and rejects the exact pending listing with confirmation',async({page})=>{
 const f=await login(page,'admin');await page.goto('/#admin');await page.getByRole('link',{name:'مراجعة الإعلان'}).click();await expect(page.getByRole('heading',{name:'QA pending'})).toBeVisible();await page.getByLabel('سبب الرفض عند الحاجة').fill('Please correct the details.');await page.getByRole('button',{name:'رفض الإعلان',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('QA pending');await page.getByRole('button',{name:'تأكيد',exact:true}).click();await expect(page.getByText('لا توجد إعلانات بانتظار المراجعة.')).toBeVisible();
});
test('seller creates private auction from approved listing and receives code',async({page})=>{
 const f=await login(page,'seller');await page.goto('/#auction-new/'+f.items.approved);await page.getByLabel('نوع المزاد').selectOption('PRIVATE');await page.getByLabel('سعر البداية (ر.س)').fill('1500');await page.getByLabel('الحد الأدنى لزيادة المزايدة (ر.س)').fill('50');const start=new Date(Date.now()+3600000).toISOString().slice(0,16),end=new Date(Date.now()+7200000).toISOString().slice(0,16);await page.getByLabel('بداية المزاد').fill(start);await page.getByLabel('نهاية المزاد').fill(end);await page.getByRole('button',{name:'إنشاء المزاد',exact:true}).click();await expect(page.getByLabel('رمز وصول المزاد الخاص')).not.toHaveValue('');await page.getByRole('link',{name:'عرض المزاد',exact:true}).click();await expect(page.getByRole('heading',{name:'QA approved'})).toBeVisible();
});
test('real bid with synthetic eligibility uses confirmation, DB acceptance and history',async({page,request})=>{
 const f=await login(page,'bidder');await page.goto('/#bid/'+f.auctions.eligible);await page.getByLabel('مبلغ مزايدتك (ر.س)').fill('1000');await page.getByRole('button',{name:'مراجعة المزايدة'}).click();await expect(page.getByRole('dialog')).toContainText('QA eligible');await page.getByRole('button',{name:'تأكيد',exact:true}).click();await expect(page.getByRole('status')).toContainText('تم قبول مزايدتك');await page.getByRole('link',{name:'متابعة المزاد'}).click();await expect(page.getByRole('heading',{name:'سجل المزايدات'})).toBeVisible();await expect(page.locator('.bid-history')).toContainText('1,000');
});
test('ended no-bid auction shows no-winner result without settlement claims',async({page})=>{
 const f=await fixture();await page.goto('/#result/'+f.auctions.empty);await expect(page.getByRole('heading',{name:'انتهى المزاد دون مزايدات'})).toBeVisible();expect(await page.getByText('تم البيع',{exact:true}).count()).toBe(0);
});
test('My Activity includes own listings and eligible auction participation',async({page,request})=>{
 const f=await fixture();const auth=await request.post('http://127.0.0.1:44017/api/v1/auth/login',{data:{email:'bidder@example.invalid',password:f.password}});const token=(await auth.json()).data.token;const details=await request.get('http://127.0.0.1:44017/api/v1/auctions/'+f.auctions.eligible);const current=(await details.json()).data;await request.post('http://127.0.0.1:44017/api/v1/auctions/'+f.auctions.eligible+'/bids',{headers:{Authorization:'Bearer '+token},data:{amount:Number(current.current_price)+50,requestId:crypto.randomUUID()}});await login(page,'bidder');await page.goto('/#activity');await expect(page.getByText('لم تضف إعلانًا بعد.')).toBeVisible();await expect(page.getByRole('heading',{name:'QA eligible'})).toBeVisible();
});
test('live multipart upload failure stays visible and creates no false listing',async({page})=>{
 await login(page,'seller');await page.goto('/#listing/new');await page.getByLabel('عنوان الإعلان').fill('QA upload attempt');await page.getByLabel('القسم',{exact:true}).selectOption({label:'السيارات النادرة'});await page.getByLabel('وصف المعروض').fill('Synthetic listing for upload boundary.');await page.getByRole('button',{name:'متابعة إلى الصور'}).click();await page.getByLabel('إضافة صور').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=','base64')});await page.getByRole('button',{name:'مراجعة الإعلان',exact:true}).click();await page.getByRole('button',{name:'إرسال للمراجعة'}).click();await expect(page.getByRole('alert')).toContainText('تحقق من البيانات');expect(page.url()).toContain('#listing/new');
});
test('responsive screens retain labels and stay inside 320/390/768/1440 px viewports',async({page})=>{
 const f=await login(page,'bidder');for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.goto('/#private/'+f.auctions.private);await expect(page.getByLabel('رمز الوصول')).toBeVisible();const geometry=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,input:document.querySelector('#private-code').getBoundingClientRect().toJSON(),rtl:document.documentElement.dir}));expect(geometry.document).toBeLessThanOrEqual(geometry.width);expect(geometry.input.x).toBeGreaterThanOrEqual(0);expect(geometry.input.right).toBeLessThanOrEqual(width);expect(geometry.rtl).toBe('rtl');}
});

test('accepted bid closes with a matching winner in the same browser journey',async({page})=>{
 const f=await login(page,'bidder');await page.goto('/#bid/'+f.auctions.eligible);await expect(page.getByLabel('مبلغ مزايدتك (ر.س)')).toBeEnabled();await page.getByLabel('مبلغ مزايدتك (ر.س)').fill('1500');await page.getByRole('button',{name:'مراجعة المزايدة'}).click();await page.getByRole('button',{name:'تأكيد',exact:true}).click();await expect(page.getByRole('status')).toContainText('تم قبول مزايدتك');
 const url=new URL(process.env.TEST_DATABASE_URL);url.searchParams.set('options','-c search_path='+f.schema+',public');const pool=new Pool({connectionString:url.toString()});try{await pool.query("UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id=$1",[f.auctions.eligible]);}finally{await pool.end();}
 await page.getByRole('link',{name:'عرض نتيجة المزاد'}).click();await expect(page.getByRole('heading',{name:'فزت بالمزاد'})).toBeVisible();await expect(page.locator('.outcome-panel')).toContainText('QA eligible');
});
