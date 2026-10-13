# دليل ملفات قاعدة البيانات والاختبارات

ملفات برمجية وتقارير بأسماء عامة حسب محتواها، بدون أسماء أشخاص أو اسم المشروع. لم تُرفع إلى GitHub.

## الملفات

- `Stage_4/QA_Report.md`
- `backend/tests/database.test.js`
- `backend/tests/marketplace.test.js`
- `backend/tests/bidding-closure.test.js`
- `backend/tests/helpers/qa-fixtures.js`
- `backend/tests/acceptance/qa.contract-gaps.test.js`
- `backend/tests/acceptance/qa.external-blockers.test.js`
- `backend/scripts/run-qa.js`
- `backend/scripts/seed-qa.js`

توجد الملفات الجديدة داخل `files/`. ويحتوي `QA.patch` على إضافتها، وإضافة `test:qa` و`seed:qa` إلى backend/package.json، وإضافة ملخص النتائج إلى نهاية التقريرين الموجودين Testing_Report.md وBug_Tracker.md. لا يستبدل التقارير أو يغيّر بيانات الفريق السابقة.

## الإضافة إلى الريبو

تُطبق على نسخة نظيفة. النسخة الأساسية المفحوصة: `d34d8cea88dcb308637f3610aa8f9373252aad08`.

```sh
git switch -c test/database-api-qa
git apply --check /path/to/Database-QA/QA.patch
git apply /path/to/Database-QA/QA.patch
git diff --stat
git status --short
```

إذا فشل فحص patch بسبب تغييرات أحدث، تُدمج الإضافات المحددة فقط دون استبدال ملفات الفريق كاملة. بعد المراجعة والتشغيل يمكن فتح Pull Request من الحساب الشخصي. لا تُرفع ZIP أو ملفات البيئة أو node_modules أو ملفات البناء.

## التشغيل

المتطلبات: Node.js 24 وPostgreSQL 16. استخدم قاعدة اختبار مستقلة ينتهي اسمها بـ `_test`.

مثال محلي ببيانات تدريبية فقط:

```sh
docker run --rm -d --name database-qa \
  -p 127.0.0.1:55442:5432 \
  -e POSTGRES_PASSWORD=qa-local-test-only \
  -e POSTGRES_DB=qa_test postgres:16-alpine

docker exec database-qa pg_isready -U postgres -d qa_test
```

من backend، بعد ظهور accepting connections:

```sh
npm ci
export TEST_DATABASE_URL='postgresql://postgres:qa-local-test-only@127.0.0.1:55442/qa_test'
npm run check
npm test
npm run test:qa
```

في PowerShell يكون ضبط المتغير:

```powershell
$env:TEST_DATABASE_URL='postgresql://postgres:qa-local-test-only@127.0.0.1:55442/qa_test'
```

الأمر test:qa يشمل اختبارات القبول، ويحفظ stdout وstderr وJUnit وJSON في مجلد مؤقت ويطبع مكانه. نجاح npm test وحده لا يعني نجاح كل متطلبات القبول.

## بيانات الاختبار الاختيارية

```sh
npm run seed:qa -- qa_seed
```

ينشئ مخططًا مستقلًا جديدًا: 4 حسابات وهمية، 5 فئات، 6 إعلانات، 4 مزادات، وصلاحية خاصة، والتزامان PENDING/FAILED. لا ينشئ SUCCESS بنكيًا أو مزايدات أو نتائج. يرفض مخططًا موجودًا ولا يستبدله.

الحسابات تستخدم example.invalid. كلمة المرور الافتراضية المحلية Local-QA-Only-2026 ويمكن تغييرها عبر QA_SEED_PASSWORD. لربط خادم محلي بالمخطط:

```text
postgresql://postgres:qa-local-test-only@127.0.0.1:55442/qa_test?options=-c%20search_path%3Dqa_seed%2Cpublic
```

## النتائج السابقة

نجح 51 اختبارًا جديدًا في التشغيل السابق. تشغيل backend المعتاد نجح في 73 نتيجة. القبول الكامل: 73 ناجحة و7 فاشلة و4 متخطاة؛ العدد يشمل نتيجة الأب لاختبارات الحسابات. اختبارات الواجهة الموجودة نجحت في 30 حالة والبناء نجح.

الأدلة في evidence من ذلك التشغيل الفعلي السابق، بعد تنقيح الأسماء ومعرّفات المشروع والمسارات فقط. أُبقيت النتائج كما هي، وتوثق PROVENANCE.json بصمات السجلات الأصلية. ليست ادعاءً بإعادة تشغيل قاعدة البيانات بعد تغيير الأسماء. فُحصت صياغة الملفات الثمانية ومسارات الاستيراد في النسخة الحالية.

المشاكل السبع والتبعيات المتوقفة موثقة في QA_Report.md. لم يُغيَّر كود التطبيق أو Migration أو Stage 3. لم تُحذف ملفات من الريبو أو تُلتقط صور شاشة. قبل الرفع، تُعاد الاختبارات وتُحفظ نتائج التشغيل الفعلية الجديدة.

الكومت المقترح:

```text
Add database validation and API tests
```
