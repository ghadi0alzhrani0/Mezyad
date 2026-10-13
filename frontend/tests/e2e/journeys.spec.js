import { test, expect } from '@playwright/test';
const password = 'E2E-local-only-password';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64'
);
const local = (value) =>
  new Date(value - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 19);
async function login(page, email) {
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور').fill(password);
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible();
}
async function register(page, email, name) {
  await page.goto('/register');
  await page.getByLabel('الاسم', { exact: true }).fill(name);
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور').fill(password);
  await page.getByRole('button', { name: 'إنشاء حساب', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم إنشاء حسابك');
  await login(page, email);
}
async function listing(page, title) {
  await page.goto('/listings/new');
  await page.getByLabel('عنوان الإعلان').fill(title);
  await page
    .getByRole('combobox', { name: 'القسم', exact: true })
    .selectOption('33333333-3333-4333-8333-333333333333');
  await page.getByLabel('الشركة المصنعة').fill('اختبار');
  await page.getByLabel('الطراز').fill('نموذج');
  await page.getByLabel('سنة الصنع').fill('2020');
  await page
    .getByRole('textbox', { name: 'الوصف', exact: true })
    .fill('وصف اصطناعي لاختبار الرحلة الكاملة.');
  await page
    .getByLabel('صور المعروض')
    .setInputFiles({ name: 'asset.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'إرسال للمراجعة', exact: true }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  return page.url().split('/').at(-1);
}
async function review(page, title, decision) {
  await page.goto('/admin');
  const card = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await card.getByRole('button', { name: 'مراجعة التفاصيل' }).click();
  if (decision === 'رفض الإعلان') await page.getByLabel('سبب الرفض').fill('أضف تفاصيل أوضح.');
  await page.getByRole('button', { name: decision, exact: true }).click();
  await expect(page.locator('.review-panel')).toHaveCount(0);
}
async function auction(page, item, privateAuction = false) {
  await page.goto(`/listings/${item}/auction`);
  await page.getByLabel('نوع المزاد').selectOption(privateAuction ? 'PRIVATE' : 'PUBLIC');
  await page.getByLabel('سعر البداية (ر.س)').fill('100');
  await page.getByLabel('الحد الأدنى للزيادة (ر.س)').fill('10');
  await page.getByLabel('بداية المزاد').fill(local(Date.now() - 60000));
  await page.getByLabel('نهاية المزاد').fill(local(Date.now() + 18000));
  await page.getByRole('button', { name: 'إنشاء المزاد', exact: true }).click();
  if (privateAuction) {
    const code = await page.getByLabel('رمز الدعوة').inputValue();
    await page.getByRole('link', { name: 'عرض المزاد', exact: true }).click();
    return { id: page.url().split('/').at(-1), code };
  }
  await expect(page).toHaveURL(/\/auctions\/[a-f0-9-]+$/);
  return { id: page.url().split('/').at(-1) };
}
async function commitAndBid(page, id) {
  await page.goto(`/auctions/${id}`);
  await page.getByRole('link', { name: 'أكمل خطوة الالتزام' }).click();
  await expect(page.getByText(/لا تتصل ببنك/)).toBeVisible();
  await page.getByRole('button', { name: 'تجربة خطوة الالتزام' }).click();
  await page.getByRole('link', { name: 'العودة للمزايدة' }).click();
  await page.getByLabel('مبلغ المزايدة').fill('100');
  await page.getByRole('button', { name: 'أضف مزايدتك' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'تأكيد المزايدة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم قبول مزايدتك');
}
test('QA-17 authentication journey: protected activity redirects, login restores it, and logout clears session', async ({
  page,
}) => {
  const email = `auth-flow-${Date.now()}@example.test`;

  await page.goto('/activity');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('link', { name: 'إنشاء حساب', exact: true }).click();
  await page.getByLabel('الاسم', { exact: true }).fill('مستخدم رحلة الدخول');
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور').fill(password);
  await page.getByRole('button', { name: 'إنشاء حساب', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('status')).toContainText('تم إنشاء حسابك');

  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور').fill(password);
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(/\/activity$/);
  await expect(page.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible();

  await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/activity');
  await expect(page).toHaveURL(/\/login$/);
});

test('QA-15 public journey: register, upload, review, auction, commitment, bid and win', async ({
  browser,
}) => {
  const seller = await browser.newContext(),
    bidder = await browser.newContext(),
    admin = await browser.newContext();
  try {
    const s = await seller.newPage(),
      b = await bidder.newPage(),
      a = await admin.newPage();
    await register(s, 'public-seller@example.test', 'بائع عام');
    await register(b, 'public-bidder@example.test', 'مزايد عام');
    await login(a, 'admin@example.test');
    const item = await listing(s, 'السيارة — رحلة عامة');
    await review(a, 'السيارة — رحلة عامة', 'اعتماد الإعلان');
    const { id } = await auction(s, item);
    await b.goto('/auctions');
    await b.getByRole('link', { name: 'أضف مزايدتك', exact: true }).click();
    await expect(
      b.getByRole('heading', { name: 'السيارة — رحلة عامة', exact: true })
    ).toBeVisible();
    await commitAndBid(b, id);
    await expect(b.getByText('فزت بالمزاد', { exact: true })).toBeVisible({ timeout: 25000 });
    await s.goto(`/auctions/${id}`);
    await expect(s.getByText('انتهى مزادك بمزايدة فائزة')).toBeVisible();
    await b.goto('/activity');
    await expect(b.getByText('شاركت بالمزايدة')).toBeVisible();
  } finally {
    await seller.close();
    await bidder.close();
    await admin.close();
  }
});
test('QA-16 private journey: invitation enforced, commitment, bid and result', async ({
  browser,
}) => {
  const seller = await browser.newContext(),
    bidder = await browser.newContext(),
    admin = await browser.newContext();
  try {
    const s = await seller.newPage(),
      b = await bidder.newPage(),
      a = await admin.newPage();
    await register(s, 'private-seller@example.test', 'بائع خاص');
    await register(b, 'private-bidder@example.test', 'مزايد خاص');
    await login(a, 'admin@example.test');
    const item = await listing(s, 'السيارة — رحلة خاصة');
    await review(a, 'السيارة — رحلة خاصة', 'اعتماد الإعلان');
    const { id, code } = await auction(s, item, true);
    await b.goto(`/auctions/${id}`);
    await expect(b.getByRole('alert')).toContainText('غير متاح');
    await b.goto('/private-access');
    await b.getByLabel('معرّف المزاد').fill(id);
    await b.getByLabel('رمز الدعوة').fill('incorrect');
    await b.getByRole('button', { name: 'دخول المزاد', exact: true }).click();
    await expect(b.getByRole('alert')).toContainText('غير صحيح');
    await b.getByLabel('رمز الدعوة').fill(code);
    await b.getByRole('button', { name: 'دخول المزاد', exact: true }).click();
    await expect(
      b.getByRole('heading', { name: 'السيارة — رحلة خاصة', exact: true })
    ).toBeVisible();
    await commitAndBid(b, id);
    await expect(b.getByText('فزت بالمزاد', { exact: true })).toBeVisible({ timeout: 25000 });
  } finally {
    await seller.close();
    await bidder.close();
    await admin.close();
  }
});
test('rejected listing is corrected and resubmitted; responsive layout stays within viewport', async ({
  browser,
}) => {
  const seller = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    admin = await browser.newContext();
  try {
    const s = await seller.newPage(),
      a = await admin.newPage();
    await register(s, 'resubmit@example.test', 'بائع التعديل');
    await login(a, 'admin@example.test');
    const id = await listing(s, 'السيارة — إعادة إرسال');
    await review(a, 'السيارة — إعادة إرسال', 'رفض الإعلان');
    await s.goto(`/listings/${id}`);
    await s.getByRole('link', { name: 'تعديل وإعادة إرسال' }).click();
    await s
      .getByRole('textbox', { name: 'الوصف', exact: true })
      .fill('وصف مصحح ومفصل لاختبار إعادة الإرسال.');
    await s.getByRole('button', { name: 'إعادة إرسال للمراجعة', exact: true }).click();
    await expect(s.getByText('بانتظار المراجعة', { exact: true })).toBeVisible();
    await expect(s.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await s.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
      true
    );
    await s.goto('/activity');
    await expect(s.getByRole('link', { name: 'السيارة — إعادة إرسال' })).toBeVisible();
  } finally {
    await seller.close();
    await admin.close();
  }
});
