export type Product = {
  id: string;
  name: string;
  brand: string;
  category: 'Beer' | 'Wine' | 'Spirits' | 'Zero Alcohol';
  size: string;
  price: number;
  abv: string;
  standardDrinks: string;
  standardDrinksTotal: number;
  image: number;
  imageAlt: string;
  tileColor: string;
  description: string;
  featured?: boolean;
};

// Edit this list when you want to change a product, price or description.
export const products: Product[] = [
  {
    id: 'juniper-zero',
    name: 'Juniper Zero',
    brand: 'Still & Wild',
    category: 'Zero Alcohol',
    size: '700 mL',
    price: 16.99,
    abv: '0.0%',
    standardDrinks: '0',
    standardDrinksTotal: 0,
    image: require('../assets/images/zero.png'),
    imageAlt: 'Fictional Juniper Zero alcohol-free botanical bottle',
    tileColor: '#E8F1E8',
    description:
      'A bright alcohol-free botanical spirit with citrus, juniper and native herb notes. Serve over ice with tonic.',
    featured: true,
  },
  {
    id: 'coastal-pale',
    name: 'Coastal Pale Ale',
    brand: 'Westward Brewing',
    category: 'Beer',
    size: '6 × 330 mL',
    price: 23.99,
    abv: '4.5%',
    standardDrinks: '1.2 per can',
    standardDrinksTotal: 7.2,
    image: require('../assets/images/beer.png'),
    imageAlt: 'Fictional Coastal Pale Ale cans',
    tileColor: '#FFF0CF',
    description:
      'A crisp Australian pale ale with balanced citrus hops and a clean finish. Best served chilled.',
  },
  {
    id: 'barossa-shiraz',
    name: 'Barossa Shiraz',
    brand: 'Red Earth Estate',
    category: 'Wine',
    size: '750 mL',
    price: 27.5,
    abv: '14.0%',
    standardDrinks: '8.3 per bottle',
    standardDrinksTotal: 8.3,
    image: require('../assets/images/wine.png'),
    imageAlt: 'Fictional Barossa Shiraz wine bottle',
    tileColor: '#F5E5EA',
    description:
      'A full-bodied South Australian shiraz with blackberry, gentle spice and soft oak character.',
    featured: true,
  },
  {
    id: 'spiced-reserve',
    name: 'Spiced Reserve',
    brand: 'Harbour House',
    category: 'Spirits',
    size: '700 mL',
    price: 48.0,
    abv: '37.5%',
    standardDrinks: '20.7 per bottle',
    standardDrinksTotal: 20.7,
    image: require('../assets/images/spirit.png'),
    imageAlt: 'Fictional Spiced Reserve amber spirit bottle',
    tileColor: '#F2E8D8',
    description:
      'A smooth, warming spiced spirit with vanilla, orange peel and toasted caramel notes.',
  },
];

export function getProduct(productId: string) {
  return products.find((product) => product.id === productId);
}
