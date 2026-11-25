import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { CATALOG_PRODUCTS } from '../src/catalog.ts';
import { PREMIUM_OVERRIDES, PREMIUM_PRODUCTS } from '../src/premium-catalog.ts';
import { deduplicateProducts, MARKET_PRODUCTS, productIdentityKey, productImageIdentity, withMarketPrice } from '../src/pricing-benchmarks.ts';

test('catalogue contains more than 100 unique photo-backed products', () => {
  assert.ok(CATALOG_PRODUCTS.length > 100);
  assert.equal(new Set(CATALOG_PRODUCTS.map((product) => product.sku)).size, CATALOG_PRODUCTS.length);
  assert.ok(CATALOG_PRODUCTS.every((product) => product.imageUrl.startsWith('https://images.openfoodfacts.org/')));
  assert.ok(CATALOG_PRODUCTS.every((product) => product.sourceUrl.startsWith('https://world.openfoodfacts.org/product/')));
});

test('every imported product has a bundled packaging photo', () => {
  const registry = readFileSync(new URL('../src/catalog-photos.ts', import.meta.url), 'utf8');
  const photos = new Map(Array.from(
    registry.matchAll(/^  "(https:\/\/images\.openfoodfacts\.org\/[^"]+)": require\('\.\.\/assets\/catalogue\/([a-f0-9]{12}\.jpg)'\),$/gm),
    ([, source, filename]) => [source, filename],
  ));
  for (const product of [...CATALOG_PRODUCTS, ...PREMIUM_PRODUCTS]) {
    const filename = photos.get(product.imageUrl);
    assert.ok(filename, `Missing photo for ${product.sku}`);
    assert.ok(statSync(new URL(`../assets/catalogue/${filename}`, import.meta.url)).size > 0, `Empty photo for ${product.sku}`);
  }
});

test('reviewed full-pack photos use the correct SKU, unique local assets and source links', () => {
  const registry = readFileSync(new URL('../src/verified-packshots.ts', import.meta.url), 'utf8');
  const photos = [...registry.matchAll(/^  "(OFF-\d+)": \{ image: require\('\.\.\/assets\/packshots\/([^']+)'\), originalUrl: "(https:[^"]+)", sourceUrl: "(https:[^"]+)"/gm)];
  const originals = new Map([...CATALOG_PRODUCTS, ...PREMIUM_PRODUCTS].map(product => [product.sku, product.imageUrl]));
  const hashes = new Set();
  const skus = new Set();
  for (const [, sku, file, original, source] of photos) {
    assert.ok(!skus.has(sku), `Duplicate packshot SKU ${sku}`);
    skus.add(sku);
    assert.equal(original, originals.get(sku), `Wrong fallback photo for ${sku}`);
    assert.doesNotMatch(source, /danmurphy/i);
    const bytes = readFileSync(new URL(`../assets/packshots/${file}`, import.meta.url));
    assert.ok(bytes.length > 0, `Empty packshot for ${sku}`);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.ok(!hashes.has(hash), `Identical packshot used for another SKU: ${sku}`);
    hashes.add(hash);
  }
  assert.equal(skus.size, photos.length);
  assert.ok(skus.size > 100, 'All catalogue categories need reviewed packshots');
  for (const sku of ['OFF-3262151001757', 'OFF-9358432064017', 'OFF-9320000500456', 'OFF-9318691008351']) {
    assert.ok(skus.has(sku), `Screenshot product ${sku} needs its reviewed photo`);
  }
});

test('catalogue covers all core bottle-shop categories', () => {
  const categories = new Set(CATALOG_PRODUCTS.map((product) => product.category));
  for (const category of ['Beer', 'Wine', 'Spirits', 'Premix', 'Cider', 'No Alcohol', 'Soft Drinks']) {
    assert.ok(categories.has(category), `Missing ${category}`);
  }
});

test('catalogue values are safe to publish', () => {
  for (const product of CATALOG_PRODUCTS) {
    assert.match(product.sku, /^[A-Z0-9_-]{2,30}$/);
    assert.ok(product.name.length >= 2);
    assert.ok(Number.isSafeInteger(product.priceCents) && product.priceCents >= 0);
    assert.ok(Number.isSafeInteger(product.stock) && product.stock >= 0);
    assert.ok(Number.isSafeInteger(product.minStock) && product.minStock >= 0);
  }
});

test('premium catalogue contains expensive real-world wine and spirits', () => {
  assert.ok(PREMIUM_PRODUCTS.length >= 6);
  assert.ok(PREMIUM_PRODUCTS.every((product) => product.category === 'Spirits' && product.priceCents >= 8000 && product.premium));
  assert.ok(Object.keys(PREMIUM_OVERRIDES).length >= 6);
  assert.ok(Object.values(PREMIUM_OVERRIDES).every((override) => override.priceCents >= 10000 && override.premium));
});

test('curated BottleFlow products have strong photos and exact pack information', () => {
  assert.ok(MARKET_PRODUCTS.length >= 7);
  assert.ok(MARKET_PRODUCTS.every((product) => product.imageKey || product.imageUrl));
  assert.ok(MARKET_PRODUCTS.every((product) => product.packSize && product.priceCents > 0));
  assert.ok(!JSON.stringify(MARKET_PRODUCTS).toLocaleLowerCase('en-AU').includes('danmurphy'));
  assert.ok(MARKET_PRODUCTS.some((product) => product.name.includes('Grange') && product.priceCents >= 90000));
});

test('generated catalogue pricing is normalised to realistic single-product ranges', () => {
  const beer = withMarketPrice({ sku: 'TEST-BEER', name: 'Test Beer', category: 'Beer', priceCents: 9999, packSize: '375 mL can' });
  const sixPack = withMarketPrice({ sku: 'TEST-SIX', name: 'Test Six', category: 'Beer', priceCents: 9999, packSize: '6 × 375 mL cans' });
  assert.ok(beer.priceCents >= 370 && beer.priceCents <= 520);
  assert.ok(sixPack.priceCents >= 2000 && sixPack.priceCents <= 2900);
  assert.ok((sixPack.priceCents / 6) >= 330 && (sixPack.priceCents / 6) <= 520);
});

test('matching product names share one price basis across SKUs and pack sizes', () => {
  const single = withMarketPrice({ sku: 'OLD-SKU', name: 'Same Beer Cans', category: 'Beer', priceCents: 1, packSize: '375 mL can' });
  const sixPack = withMarketPrice({ sku: 'NEW-SKU', name: 'Same Beer', category: 'Beer', priceCents: 1, packSize: '6 × 375 mL cans' });
  assert.equal(productIdentityKey(single), productIdentityKey(sixPack));
  assert.ok(Math.abs((sixPack.priceCents / 6) - single.priceCents) <= single.priceCents * 0.1);
});

test('duplicate product names collapse to the first preferred listing', () => {
  const products = deduplicateProducts([
    { sku: 'PREFERRED', name: 'Heaps Normal Quiet XPA', category: 'No Alcohol' },
    { sku: 'OLD', name: 'Heaps Normal Quiet XPA Cans', category: 'No Alcohol' },
  ]);
  assert.deepEqual(products.map((product) => product.sku), ['PREFERRED']);
});

test('repeated product photos collapse to the strongest catalogue record', () => {
  const products = deduplicateProducts([
    { sku: 'OLD', name: 'Quiet XPA Legacy', category: 'No Alcohol', imageUrl: 'https://images.openfoodfacts.org/item/front_en.2.400.jpg', packSize: 'See product label' },
    { sku: 'BF-QUIET', name: 'Quiet XPA', category: 'No Alcohol', imageUrl: 'https://images.openfoodfacts.org/item/front_en.2.full.jpg', packSize: '4 × 375 mL cans', abv: 'Less than 0.5% ABV' },
  ]);
  assert.equal(productImageIdentity(products[0]), 'https://images.openfoodfacts.org/item/front_en.2.jpg');
  assert.deepEqual(products.map((product) => product.sku), ['BF-QUIET']);
});

test('the complete seeded catalogue has no repeated names or product photos', () => {
  const enhanced = CATALOG_PRODUCTS.map((product) => ({ ...withMarketPrice(product), ...PREMIUM_OVERRIDES[product.sku] }));
  const products = deduplicateProducts([...MARKET_PRODUCTS, ...PREMIUM_PRODUCTS, ...enhanced]);
  const names = products.map(productIdentityKey);
  const images = products.map(productImageIdentity).filter(Boolean);
  assert.equal(new Set(names).size, names.length);
  assert.equal(new Set(images).size, images.length);
  assert.ok(products.some((product) => product.sku === 'BF-HEAPS-QUIET-XPA-4'));
  assert.ok(!products.some((product) => product.sku === 'OFF-9356470000349'));
});
