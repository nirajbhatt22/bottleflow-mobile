import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Product } from '../data/products';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = {
  product: Product;
  onPress: () => void;
};

export function FeatureCard({ product, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.photoBox, { backgroundColor: product.tileColor }]}>
        <Image
          accessibilityLabel={product.imageAlt}
          accessible
          resizeMode="contain"
          source={product.image}
          style={styles.photo}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text style={styles.details}>{product.size} · {product.abv}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 278,
    minHeight: 130,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#EEEAF1',
    padding: spacing.sm,
    ...shadow,
  },
  photoBox: {
    width: 108,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '94%', height: '94%' },
  info: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  category: { ...type.caption, color: colors.primary, letterSpacing: 0.8 },
  name: { ...type.bodyStrong, color: colors.text, marginTop: 2 },
  details: { ...type.caption, color: colors.textSecondary, marginTop: 3 },
  price: { ...type.bodyStrong, color: colors.primaryDark, marginTop: spacing.sm },
});
