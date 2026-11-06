import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Product } from '../data/products';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

export function ProductCard({
  product,
  onOpen,
  onAdd,
  addDisabled = false,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
  addDisabled?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.openArea}>
        <View style={[styles.art, { backgroundColor: product.tileColor }]}>
          {product.category === 'Zero Alcohol' ? (
            <View style={styles.zeroBadge}>
              <Text style={styles.zeroText}>0.0%</Text>
            </View>
          ) : null}
          <Image
            accessibilityLabel={product.imageAlt}
            accessible
            resizeMode="contain"
            source={product.image}
            style={styles.productImage}
          />
        </View>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.meta}>{product.size} · {product.abv}</Text>
      </Pressable>
      <View style={styles.footer}>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addDisabled ? `${product.name} unavailable while alcohol purchases are paused` : `Add ${product.name} to cart`}
          accessibilityState={{ disabled: addDisabled }}
          disabled={addDisabled}
          onPress={onAdd}
          style={[styles.add, addDisabled && styles.addDisabled]}
        >
          <Text style={styles.addText}>{addDisabled ? '—' : '+'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.4%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#EEEAF1',
    ...shadow,
  },
  openArea: { gap: 3 },
  art: {
    height: 142,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  productImage: { width: '94%', height: '94%' },
  zeroBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  zeroText: { ...type.caption, color: colors.white },
  brand: { ...type.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  name: { ...type.bodyStrong, color: colors.text, minHeight: 42 },
  meta: { ...type.caption, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  price: { ...type.bodyStrong, color: colors.primaryDark },
  add: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDisabled: { backgroundColor: colors.border },
  addText: { color: colors.white, fontSize: 22, lineHeight: 24, fontWeight: '500' },
});
