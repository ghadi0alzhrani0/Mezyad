export const categories = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'الإبل',
    fields: [
      ['color', 'اللون'],
      ['age', 'العمر بالسنوات', 'number'],
      ['condition', 'الحالة'],
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'العقارات',
    fields: [
      ['location', 'الموقع'],
      ['area', 'المساحة بالمتر المربع', 'number'],
      ['condition', 'الحالة'],
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'السيارات',
    fields: [
      ['make', 'الشركة المصنعة'],
      ['model', 'الطراز'],
      ['year', 'سنة الصنع', 'number'],
      ['mileage', 'المسافة المقطوعة بالكيلومتر', 'number'],
      ['condition', 'الحالة'],
    ],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'اللوحات المميزة',
    fields: [
      ['letters', 'الحروف'],
      ['number', 'الرقم'],
      ['type', 'نوع اللوحة'],
    ],
  },
];
export const fieldLabels = Object.fromEntries(
  categories.flatMap((c) => c.fields.map(([key, label]) => [key, label]))
);
export const statusLabels = {
  PENDING_REVIEW: 'بانتظار المراجعة',
  APPROVED: 'معتمد للنشر',
  REJECTED: 'مرفوض',
  SCHEDULED: 'قريبًا',
  ACTIVE: 'قائم',
  CLOSED: 'منتهٍ',
  PENDING: 'جارٍ التحقق',
  FAILED: 'لم يكتمل',
};
