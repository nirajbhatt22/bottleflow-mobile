import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'src', 'catalog.ts');
const API = 'https://world.openfoodfacts.org/api/v2/search';
const USER_AGENT = 'BottleFlow-ITC502/1.0 (academic WA pickup prototype)';

const groups = [
  { category: 'Beer', tag: 'beers', target: 38, basePrice: 370, priceRange: 150 },
  { category: 'Wine', tag: 'wines', target: 32, basePrice: 1200, priceRange: 1800 },
  { category: 'Premix', tag: 'alcoholic-beverages', target: 10, basePrice: 470, priceRange: 230, premixOnly: true },
  { category: 'Spirits', tag: 'spirits', target: 30, basePrice: 4300, priceRange: 3000 },
  { category: 'Cider', tag: 'ciders', target: 16, basePrice: 340, priceRange: 160 },
  { category: 'No Alcohol', tag: 'alcohol-free-beers', target: 12, basePrice: 280, priceRange: 140 },
  { category: 'Soft Drinks', tag: 'soft-drinks', target: 12, basePrice: 180, priceRange: 120 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tidy = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normal = (value) => tidy(value).toLocaleLowerCase('en-AU').replace(/[^a-z0-9]+/g, '');
const canonicalName = (value) => tidy(value).toLocaleLowerCase('en-AU')
  .replace(/\b\d+(?:\.\d+)?\s*(?:ml|litres?|liters?|l)\b/g, ' ')
  .replace(/\b(?:cans?|bottles?|packs?|cartons?|cases?|single|each)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const hash = (value) => [...value].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);

function displayName(product) {
  const name = tidy(product.product_name);
  const brand = tidy(product.brands).split(',')[0];
  if (!brand) return name;
  return normal(name).includes(normal(brand)) ? name : `${brand} ${name}`;
}

function validProduct(product) {
  const code = tidy(product.code).replace(/\D/g, '');
  const name = displayName(product);
  const brand = tidy(product.brands).split(',')[0];
  const image = tidy(product.image_front_url);
  if (code.length < 6 || code.length > 22 || !brand || name.length < 5 || name.length > 110) return false;
  if (!image.startsWith('https://images.openfoodfacts.org/')) return false;
  return !/(unknown|test product|unbranded|sans marque)/i.test(`${name} ${brand}`);
}

function isPremix(product) {
  const tags = (product.categories_tags || []).join(' ');
  const label = `${product.brands || ''} ${product.product_name || ''}`;
  return /(cocktail|premixed-alcoholic|hard-seltzer|whiskey-based-cocktail|rum-based-alcoholic)/i.test(tags)
    || /(&|and)\s+(cola|dry|soda|lemonade|ginger)|hard seltzer|double jack/i.test(label);
}

function alcoholLabel(product, category) {
  if (category === 'Soft Drinks') return '0.0% ABV';
  if (category === 'No Alcohol') return 'Less than 0.5% ABV';
  const raw = product.nutriments?.alcohol_100g;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 && value <= 100 ? `${value}% ABV` : '';
}

function listedPackCount(packSize = '') {
  const match = packSize.match(/(?:^|\s)(\d{1,2})\s*(?:[x×]|pack\b)/i) || packSize.match(/pack\s+of\s+(\d{1,2})/i);
  const count = Number(match?.[1] || 1);
  return Number.isSafeInteger(count) && count >= 1 && count <= 48 ? count : 1;
}

function marketPrice(group, seed, packSize) {
  const units = listedPackCount(packSize);
  const unitPrice = group.basePrice + (seed % group.priceRange);
  const discount = units >= 24 ? 0.82 : units >= 10 ? 0.86 : units >= 6 ? 0.92 : units >= 4 ? 0.95 : units >= 2 ? 0.98 : 1;
  return Math.max(5, Math.round((unitPrice * units * discount) / 5) * 5);
}

async function fetchPage(tag, page) {
  const params = new URLSearchParams({
    categories_tags: `en:${tag}`,
    countries_tags: 'en:australia',
    page: String(page),
    page_size: '100',
    fields: 'code,product_name,brands,quantity,image_front_url,categories_tags,nutriments',
  });
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(`${API}?${params}`, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await sleep(attempt * 2500);
    }
  }
  throw new Error(`Open Food Facts request failed for ${tag}: ${lastError?.message || lastError}`);
}

async function collectGroup(group, usedCodes, usedNames) {
  const selected = [];
  for (let page = 1; page <= 3 && selected.length < group.target; page += 1) {
    const result = await fetchPage(group.tag, page);
    for (const product of result.products || []) {
      if (!validProduct(product)) continue;
      if (group.premixOnly && !isPremix(product)) continue;
      const code = tidy(product.code).replace(/\D/g, '');
      const name = displayName(product);
      const nameKey = normal(name);
      if (usedCodes.has(code) || usedNames.has(nameKey)) continue;
      const seed = hash(`${group.category}:${canonicalName(name)}`);
      const packSize = tidy(product.quantity) || 'See product label';
      selected.push({
        sku: `OFF-${code}`,
        name,
        category: group.category,
        priceCents: marketPrice(group, seed, packSize),
        stock: 10 + (seed % 38),
        minStock: 5 + (seed % 4),
        supplier: tidy(product.brands).split(',')[0],
        imageUrl: tidy(product.image_front_url),
        packSize,
        abv: alcoholLabel(product, group.category),
        description: `${tidy(product.brands).split(',')[0]} ${group.category.toLowerCase()} product. Packaging and product information may change; confirm the label at pickup.`,
        sourceName: 'Open Food Facts',
        sourceUrl: `https://world.openfoodfacts.org/product/${code}`,
      });
      usedCodes.add(code);
      usedNames.add(nameKey);
      if (selected.length >= group.target) break;
    }
    if (selected.length < group.target) await sleep(1800);
  }
  if (selected.length < group.target) {
    throw new Error(`Only found ${selected.length}/${group.target} suitable ${group.category} products.`);
  }
  return selected;
}

const usedCodes = new Set();
const usedNames = new Set();
const catalogue = [];
for (const group of groups) {
  const products = await collectGroup(group, usedCodes, usedNames);
  catalogue.push(...products);
  console.log(`${group.category}: ${products.length}`);
  await sleep(1800);
}

catalogue.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
const generatedAt = new Date().toISOString();
const file = `// Generated by scripts/generate-catalog.mjs from Australian-tagged Open Food Facts records.\n` +
  `// Product data: ODbL. Product images: CC BY-SA. See docs/OPEN_DATA_ATTRIBUTION.md.\n` +
  `export const CATALOG_GENERATED_AT = ${JSON.stringify(generatedAt)};\n` +
  `export const CATALOG_PRODUCTS = ${JSON.stringify(catalogue, null, 2)} as const;\n`;
await writeFile(OUTPUT, file, 'utf8');
console.log(`Wrote ${catalogue.length} products to ${OUTPUT}`);
