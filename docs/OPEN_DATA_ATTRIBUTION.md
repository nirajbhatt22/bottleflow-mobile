# Open catalogue attribution

BottleFlow includes a generated academic-demo catalogue based on Australian-tagged records from [Open Food Facts](https://world.openfoodfacts.org/).

- Product database: Open Food Facts, available under the Open Database License (ODbL).
- Individual database contents: Database Contents License.
- Product images: Open Food Facts contributors, available under [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/). BottleFlow bundles resized JPEG copies of the original front packaging photos under the same licence.
- Each imported product stores its original Open Food Facts product-page URL and displays the source in the product details screen.

The generated catalogue is in `src/catalog.ts`. It can be refreshed with `npm run catalog:generate`. BottleFlow's displayed prices, WA pickup stock and availability are sample prototype values created by BottleFlow; they are not supplied or endorsed by Open Food Facts or the product brands.

After updating the catalogue, run `node --experimental-strip-types scripts/cache-catalog-photos.mjs` on macOS with internet access to refresh the image registry in `src/catalog-photos.ts`. The registry maps each bundled image to its Open Food Facts URL.

The local prototype also uses reviewed manufacturer and retailer packshots in `assets/packshots`. Their sources are recorded per product in `src/verified-packshots.ts` and linked from the product details. These images are separate from the Open Food Facts image collection. Where a matching full-bottle or full-can view has been reviewed, the app uses that image first and keeps the existing contributor photo as a fallback.

Open Food Facts data is community contributed and may be incomplete or inaccurate. Packaging, alcohol content and other label information must be confirmed from the physical product before collection.
