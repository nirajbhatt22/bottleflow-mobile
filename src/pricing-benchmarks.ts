import type { Product } from './types';

type CatalogProduct = Omit<Product, 'id' | 'active' | 'createdAt' | 'updatedAt'> & { active?: boolean };
type MarketPricedProduct = Pick<Product, 'sku' | 'name' | 'category' | 'priceCents' | 'packSize'>;
type IdentifiableProduct = Pick<Product, 'name' | 'category'> & Partial<Pick<Product, 'sku' | 'imageKey' | 'imageUrl' | 'packSize' | 'abv' | 'description' | 'premium'>>;

const MARKET_RANGES: Record<string, readonly [number, number]> = {
  Beer: [370, 150],
  Wine: [1200, 1800],
  Premix: [470, 230],
  Spirits: [4300, 3000],
  Cider: [340, 160],
  'No Alcohol': [280, 140],
  'Soft Drinks': [180, 120],
};

const hash = (value: string) => [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
const roundFive = (value: number) => Math.max(5, Math.round(value / 5) * 5);
const listedPackCount = (packSize = '') => {
  const match = packSize.match(/(?:^|\s)(\d{1,2})\s*(?:[x×]|pack\b)/i) || packSize.match(/pack\s+of\s+(\d{1,2})/i);
  const count = Number(match?.[1] || 1);
  return Number.isSafeInteger(count) && count >= 1 && count <= 48 ? count : 1;
};

export function canonicalProductName(value: string): string {
  return value
    .toLocaleLowerCase('en-AU')
    .replace(/\b\d+(?:\.\d+)?\s*(?:ml|litres?|liters?|l)\b/g, ' ')
    .replace(/\b(?:cans?|bottles?|packs?|cartons?|cases?|single|each)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function productIdentityKey(product: IdentifiableProduct): string {
  return `${product.category.toLocaleLowerCase('en-AU')}:${canonicalProductName(product.name)}`;
}

export function productImageIdentity(product: IdentifiableProduct): string {
  if (product.imageKey) return `asset:${product.imageKey.toLocaleLowerCase('en-AU')}`;
  if (!product.imageUrl) return '';
  return product.imageUrl
    .toLocaleLowerCase('en-AU')
    .replace(/\.(?:200|400|full)\.(jpe?g|png)(?:\?.*)?$/i, '.$1')
    .replace(/\?.*$/, '');
}

function productQualityScore(product: IdentifiableProduct): number {
  return Number(!!product.imageKey) * 100
    + Number(product.sku?.startsWith('BF-')) * 50
    + Number(!!product.imageUrl) * 20
    + Number(!!product.packSize && !/see product label/i.test(product.packSize)) * 10
    + Number(!!product.abv && !/see .*label/i.test(product.abv)) * 6
    + Number(!!product.description) * 4
    + Number(product.premium === true) * 2;
}

/** Keeps the strongest record when either the name or product photo repeats. */
export function deduplicateProducts<T extends IdentifiableProduct>(products: readonly T[]): T[] {
  const ranked = products
    .map((product, index) => ({ product, index, score: productQualityScore(product) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const names = new Set<string>();
  const images = new Set<string>();
  const unique: T[] = [];
  for (const { product } of ranked) {
    const nameKey = productIdentityKey(product);
    const imageKey = productImageIdentity(product);
    if (names.has(nameKey) || (imageKey && images.has(imageKey))) continue;
    names.add(nameKey);
    if (imageKey) images.add(imageKey);
    unique.push(product);
  }
  return unique;
}

/**
 * Gives imported open-data products a consistent BottleFlow shelf price per
 * listed pack. Matching product names share one unit-price basis even when
 * their source records use different SKUs or pack sizes.
 */
export function withMarketPrice<T extends MarketPricedProduct>(product: T): T {
  const [base, range] = MARKET_RANGES[product.category] || [500, 1000];
  const units = listedPackCount(product.packSize);
  const unitPrice = base + (hash(`${product.category}:${canonicalProductName(product.name)}`) % range);
  const packDiscount = units >= 24 ? 0.82 : units >= 10 ? 0.86 : units >= 6 ? 0.92 : units >= 4 ? 0.95 : units >= 2 ? 0.98 : 1;
  return { ...product, priceCents: roundFive(unitPrice * units * packDiscount) };
}

export const MARKET_PRODUCTS = [
  {
    sku: 'BF-GN-ORIGINAL-6',
    name: 'Great Northern Original Lager Cans',
    category: 'Beer',
    priceCents: 2195,
    stock: 42,
    minStock: 8,
    active: true,
    supplier: 'Great Northern Brewing Co.',
    imageKey: 'great-northern-original',
    packSize: '6 × 375 mL cans',
    abv: '4.2% ABV',
    description: 'Full-strength Australian lager. Six-pack photo shown; choose another available format before adding to the pickup cart.',
  },
  {
    sku: 'BF-CC-DRY-4',
    name: 'Canadian Club Whisky & Dry',
    category: 'Premix',
    priceCents: 2495,
    stock: 36,
    minStock: 8,
    active: true,
    supplier: 'Canadian Club',
    imageKey: 'canadian-club-dry',
    packSize: '4 × 375 mL cans',
    abv: '4.8% ABV',
    description: 'Canadian Club whisky premixed with dry ginger ale. Current packaging can vary by store.',
  },
  {
    sku: 'BF-SOMERSBY-APPLE-6',
    name: 'Somersby Apple Cider Bottles',
    category: 'Cider',
    priceCents: 1745,
    stock: 38,
    minStock: 8,
    active: true,
    supplier: 'Somersby',
    imageKey: 'somersby-apple',
    packSize: '6 × 330 mL bottles',
    abv: '4.5% ABV',
    description: 'Sparkling apple cider in a six-pack of 330 mL bottles.',
  },
  {
    sku: 'BF-HEAPS-QUIET-XPA-4',
    name: 'Heaps Normal Quiet XPA',
    category: 'No Alcohol',
    priceCents: 1450,
    stock: 34,
    minStock: 8,
    active: true,
    supplier: 'Heaps Normal',
    imageKey: 'heaps-normal-quiet-xpa',
    packSize: '4 × 375 mL cans',
    abv: 'Less than 0.5% ABV',
    description: 'Full-flavoured non-alcoholic XPA in a four-pack of 375 mL cans.',
  },
  {
    sku: 'BF-BUNDY-ORIGINAL-700',
    name: 'Bundaberg Original Underproof Rum',
    category: 'Spirits',
    priceCents: 5395,
    stock: 22,
    minStock: 5,
    active: true,
    supplier: 'Bundaberg Rum',
    imageKey: 'bundaberg-original',
    packSize: '700 mL bottle',
    abv: '37% ABV',
    description: 'Australian underproof rum in a 700 mL bottle.',
  },
  {
    sku: 'BF-PENFOLDS-KOONUNGA',
    name: 'Penfolds Koonunga Hill Shiraz',
    category: 'Wine',
    priceCents: 1645,
    stock: 28,
    minStock: 6,
    active: true,
    supplier: 'Penfolds',
    imageKey: 'penfolds-koonunga-hill',
    packSize: '750 mL bottle',
    abv: 'Check current vintage label',
    description: 'South Australian Shiraz. Vintage can vary by pickup point; confirm the bottle label at collection.',
  },
  {
    sku: 'BF-PENFOLDS-GRANGE-2020',
    name: 'Penfolds Grange Shiraz 2020',
    category: 'Wine',
    priceCents: 97900,
    stock: 3,
    minStock: 1,
    active: true,
    supplier: 'Penfolds',
    imageUrl: 'https://www.penfolds.com/on/demandware.static/-/Sites-twe-master-catalog/default/dw8c31cf51/images/Penfolds%202024/PEN%202020%20Grange%20Shz%20Bin95%20750%20FB%20Cork.png',
    packSize: '750 mL bottle',
    abv: '14.5% ABV',
    premium: true,
    description: 'Collector wine. WA pickup availability is limited and the bottle must be confirmed before handover.',
  },
] satisfies readonly CatalogProduct[];
