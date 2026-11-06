import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { QuantityStepper } from '../components/QuantityStepper';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useCart } from '../context/CartContext';
import { useSession } from '../context/SessionContext';
import { getProduct } from '../data/products';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ navigation, route }: Props) {
  const { addItem } = useCart();
  const { purchasesPaused } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const product = getProduct(route.params.productId);

  if (!product) {
    return (
      <Screen>
        <TopBar title="Product" onBack={navigation.goBack} />
        <View style={styles.notFound}><Text style={styles.notFoundText}>Product not found.</Text></View>
      </Screen>
    );
  }

  const alcoholPurchasePaused = purchasesPaused && product.standardDrinksTotal > 0;

  const addToCart = () => {
    if (alcoholPurchasePaused) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <TopBar title="Product details" onBack={navigation.goBack} rightLabel="Cart" onRightPress={() => navigation.navigate('Cart')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.art, { backgroundColor: product.tileColor }]}>
          {product.category === 'Zero Alcohol' ? <Text style={styles.zero}>0.0% alcohol</Text> : null}
          <Image
            accessibilityLabel={product.imageAlt}
            accessible
            resizeMode="contain"
            source={product.image}
            style={styles.productImage}
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.brand}>{product.brand.toUpperCase()}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.size}>{product.size} · {product.category}</Text>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>

        <View style={styles.facts}>
          <View style={styles.fact}><Text style={styles.factValue}>{product.abv}</Text><Text style={styles.factLabel}>Alcohol</Text></View>
          <View style={styles.divider} />
          <View style={styles.fact}><Text style={styles.factValue}>{product.standardDrinks}</Text><Text style={styles.factLabel}>Standard drinks</Text></View>
          <View style={styles.divider} />
          <View style={styles.fact}><Text style={styles.factValue}>In stock</Text><Text style={styles.factLabel}>Availability</Text></View>
        </View>

        <View style={styles.descriptionBlock}>
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {product.category !== 'Zero Alcohol' ? (
          <ResponsibleNotice
            tone="gold"
            title="Standard-drink guide"
            text={`This pack contains ${product.standardDrinks}. Check the label and Australian health guidance when deciding whether to drink.`}
          />
        ) : (
          <ResponsibleNotice tone="green" title="Alcohol-free option" text="This product is listed as 0.0% ABV and contains zero standard drinks." />
        )}

        {alcoholPurchasePaused ? (
          <ResponsibleNotice tone="green" title="Alcohol purchases are paused" text="You can still read product information, but this item cannot be added until you resume purchases in Account." />
        ) : null}

        <View style={styles.buyCard}>
          <View>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <QuantityStepper minimum={1} onChange={setQuantity} value={quantity} />
          </View>
          <Text style={styles.total}>${(product.price * quantity).toFixed(2)}</Text>
        </View>
        <AppButton disabled={alcoholPurchasePaused} label={alcoholPurchasePaused ? 'Alcohol purchases paused' : added ? '✓ Added to cart' : 'Add to cart'} onPress={addToCart} />
        {added ? <AppButton label="View cart" onPress={() => navigation.navigate('Cart')} variant="secondary" /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.xl, paddingBottom: spacing.huge },
  art: { height: 320, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productImage: { width: '88%', height: '88%' },
  zero: { position: 'absolute', top: 16, right: 16, ...type.smallStrong, color: colors.success, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radii.pill },
  copy: { gap: 5 },
  brand: { ...type.caption, color: colors.primary, letterSpacing: 1.2 },
  name: { ...type.h1, color: colors.text },
  size: { ...type.body, color: colors.textSecondary },
  price: { ...type.h2, color: colors.primaryDark, marginTop: spacing.sm },
  facts: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadow },
  fact: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  factValue: { ...type.smallStrong, color: colors.text, textAlign: 'center' },
  factLabel: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },
  divider: { width: 1, backgroundColor: colors.border },
  descriptionBlock: { gap: spacing.sm },
  sectionTitle: { ...type.h3, color: colors.text },
  description: { ...type.body, color: colors.textSecondary },
  buyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg },
  quantityLabel: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  total: { ...type.h2, color: colors.primaryDark },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...type.body, color: colors.textSecondary },
});
