export function validMoney(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 999999999999.99) return false;
  const cents = Math.round(value * 100);
  return Number.isSafeInteger(cents) && Math.abs(value * 100 - cents) < 1e-7;
}

export function toCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new TypeError('Invalid amount');
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(amount * 100 - cents) > 1e-7) throw new RangeError('Invalid currency precision');
  return cents;
}
