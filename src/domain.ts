export function formatAUD(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}
export function parsePrice(input: string): number {
  const value = input.trim();
  if (!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(value)) throw new Error('Enter a valid dollar price (up to 2 decimal places).');
  const [dollars, cents = ''] = value.split('.');
  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
}
export function parseWhole(input: string, label: string, min = 0, max = 999999): number {
  if (!/^\d+$/.test(input.trim())) throw new Error(`${label} must be a whole number.`);
  const result = Number(input.trim());
  if (!Number.isSafeInteger(result) || result < min || result > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return result;
}
export function skuId(input: string): string {
  const id = input.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(id)) throw new Error('SKU must have 2–30 letters, digits, hyphens or underscores.');
  return id;
}
export function cartCount(items: { quantity: number }[]): number { return items.reduce((s, i) => s + i.quantity, 0); }
export function lineTotal(priceCents: number, quantity: number): number {
  if (!Number.isSafeInteger(priceCents) || priceCents < 0 || !Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Invalid price or quantity.');
  return priceCents * quantity;
}
export function sumSales(sales: { totalCents: number }[]): number { return sales.reduce((s, sale) => s + sale.totalCents, 0); }
export interface PackOption { units: number; label: string; priceCents: number; }
const MULTIPACK_CATEGORIES = new Set(['Beer', 'Premix', 'Cider', 'No Alcohol', 'Soft Drinks']);
const SPECIAL_CATEGORIES = new Set(['Beer', 'Wine', 'Spirits']);
const FEATURED_SPECIALS: Record<string, number> = {
  'BF-GN-ORIGINAL-6': 15,
  'BF-PENFOLDS-KOONUNGA': 15,
  'BF-BUNDY-ORIGINAL-700': 15,
};
export function specialPercent(product: { sku?: string; name?: string; category: string; priceCents?: number; premium?: boolean }): number {
  if (!SPECIAL_CATEGORIES.has(product.category) || product.premium || (product.priceCents||0)>=10000) return 0;
  if(product.sku&&FEATURED_SPECIALS[product.sku])return FEATURED_SPECIALS[product.sku];
  const productIdentity=product.name||product.sku||'';
  if (!productIdentity) return 0;
  const identity = `${product.category}:${productIdentity}`.toLocaleLowerCase('en-AU').replace(/[^a-z0-9]+/g,'');
  const score = [...identity].reduce((total, character) => total + character.charCodeAt(0), 0);
  return score % 5 === 0 ? 20 : score % 3 === 0 ? 15 : 0;
}
export function packageCount(packSize = ''): number {
  const match = packSize.match(/(?:^|\s)(\d{1,2})\s*(?:[x×]|pack\b)/i) || packSize.match(/pack\s+of\s+(\d{1,2})/i);
  const count = Number(match?.[1] || 1);
  return Number.isSafeInteger(count) && count >= 1 && count <= 48 ? count : 1;
}
function buildPackOptions(product: { sku?: string; category: string; priceCents: number; packSize?: string }, includeSpecial: boolean): PackOption[] {
  const listedCount = packageCount(product.packSize);
  const singleCents = Math.max(1, Math.round(product.priceCents / listedCount));
  const counts = MULTIPACK_CATEGORIES.has(product.category) ? [1, 2, 4, 6, 24] : [1, 2, 6];
  const discount: Record<number, number> = { 1: 1, 2: 0.98, 4: 0.95, 6: 0.92, 24: 0.82 };
  return counts.map((units) => {
    const offerMultiplier = includeSpecial ? 1 - (specialPercent(product) / 100) : 1;
    const raw = singleCents * units * (discount[units] || 1) * offerMultiplier;
    const priceCents = Math.max(1, Math.round(raw / 5) * 5);
    const label = units === 1 ? 'Single' : units === 24 ? 'Carton · 24' : product.category === 'Wine' || product.category === 'Spirits' ? `Case · ${units}` : `${units}-pack`;
    return { units, label, priceCents };
  });
}
export function packOptions(product: { sku?: string; category: string; priceCents: number; packSize?: string }): PackOption[] { return buildPackOptions(product, true); }
export function packOption(product: { sku?: string; category: string; priceCents: number; packSize?: string }, units = 1): PackOption {
  const option = packOptions(product).find((item) => item.units === units);
  if (!option) throw new Error('That pack size is not available for this product.');
  return option;
}
export function regularPackOption(product: { sku?: string; category: string; priceCents: number; packSize?: string }, units = 1): PackOption {
  const option = buildPackOptions(product, false).find((item) => item.units === units);
  if (!option) throw new Error('That pack size is not available for this product.');
  return option;
}
export function defaultPackOption(product: { sku?: string; category: string; priceCents: number; packSize?: string }): PackOption {
  const listedUnits = packageCount(product.packSize);
  return packOptions(product).find((item) => item.units === listedUnits) || packOption(product, 1);
}
export function startOfLocalWeek(now = new Date()): Date {
  const start = new Date(now);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}
export function readableError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  if (e?.code === 'auth/email-already-in-use') return 'This email is already registered.';
  if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password' || e?.code === 'auth/user-not-found') return 'Email or password is incorrect. Use Forgot your password? or create a new account.';
  if (e?.code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (e?.code === 'auth/network-request-failed') return 'Your phone cannot reach Firebase. Check Wi-Fi or mobile data, disable any VPN or private DNS temporarily, then try again.';
  if (e?.code === 'auth/too-many-requests') return 'Too many sign-in attempts. Wait a few minutes or reset your password.';
  if (e?.code === 'auth/user-disabled') return 'This account has been disabled. Contact the store manager.';
  if (e?.code === 'auth/weak-password') return 'Choose a stronger password (at least 6 characters).';
  if (e?.code === 'permission-denied') return 'Access denied. Check your account role and Firestore rules.';
  if (e?.code === 'unavailable') return 'Service unavailable. Check your internet connection and try again.';
  return e?.message || 'Something went wrong. Please try again.';
}
