import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomNav } from '../components/BottomNav';
import { QuantityStepper } from '../components/QuantityStepper';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useSession } from '../context/SessionContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { monthlySpend } = useOrders();
  const { purchasesPaused, spendingReminder } = useSession();
  const delivery = items.length ? 8 : 0;
  const total = subtotal + delivery;
  const totalStandardDrinks = items.reduce(
    (sum, item) => sum + item.product.standardDrinksTotal * item.quantity,
    0,
  );
  const containsAlcohol = totalStandardDrinks > 0;
  const alcoholOrderPaused = purchasesPaused && containsAlcohol;
  const reachesReminder = spendingReminder && monthlySpend + total >= 100;

  return (
    <Screen edges={['top', 'right', 'left']}>
      <TopBar title="Your cart" />
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>▣</Text></View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Browse mindful choices and add a product when you are ready.</Text>
            <AppButton label="Browse products" onPress={() => navigation.navigate('Home')} style={styles.emptyButton} />
          </View>
        ) : (
          <>
            <View style={styles.items}>
              {items.map(({ product, quantity }) => (
                <View key={product.id} style={styles.item}>
                  <View style={[styles.itemArt, { backgroundColor: product.tileColor }]}>
                    <Image
                      accessibilityLabel={product.imageAlt}
                      accessible
                      resizeMode="contain"
                      source={product.image}
                      style={styles.itemImage}
                    />
                  </View>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemBrand}>{product.brand}</Text>
                    <Text style={styles.itemName}>{product.name}</Text>
                    <Text style={styles.itemMeta}>{product.size} · {product.abv}</Text>
                    <View style={styles.itemFooter}>
                      <QuantityStepper value={quantity} onChange={(value) => updateQuantity(product.id, value)} />
                      <Text style={styles.itemPrice}>${(product.price * quantity).toFixed(2)}</Text>
                    </View>
                    <Pressable onPress={() => removeItem(product.id)}><Text style={styles.remove}>Remove</Text></Pressable>
                  </View>
                </View>
              ))}
            </View>

            <ResponsibleNotice tone="gold" title="Delivery ID check" text="The recipient must be 18+, not intoxicated and show an approved physical or digital ID. Alcohol will never be left unattended." />

            {reachesReminder ? (
              <ResponsibleNotice title="$100 purchase reminder" text={`Your local demo orders plus this cart would total $${(monthlySpend + total).toFixed(2)} this session. This is a reminder only; you stay in control.`} />
            ) : null}

            {alcoholOrderPaused ? (
              <ResponsibleNotice tone="green" title="Alcohol purchases are paused" text="Remove alcoholic items or resume purchases in Account. 0.0% products can still be checked out." />
            ) : null}

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Order summary</Text>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Estimated standard drinks</Text><Text style={styles.summaryValue}>{totalStandardDrinks.toFixed(1)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Standard delivery</Text><Text style={styles.summaryValue}>${delivery.toFixed(2)}</Text></View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>${total.toFixed(2)}</Text></View>
            </View>
            <AppButton disabled={alcoholOrderPaused} label={alcoholOrderPaused ? 'Alcohol purchases paused' : 'Continue to checkout'} onPress={() => navigation.navigate('Checkout')} />
          </>
        )}
      </ScrollView>
      <BottomNav active="Cart" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },
  empty: { flex: 1, minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyIcon: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyIconText: { fontSize: 32, color: colors.primary },
  emptyTitle: { ...type.h2, color: colors.text },
  emptyText: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  emptyButton: { alignSelf: 'stretch', marginTop: spacing.xxl },
  items: { gap: spacing.md },
  item: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, ...shadow },
  itemArt: { width: 92, height: 116, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  itemImage: { width: '88%', height: '88%' },
  itemCopy: { flex: 1 },
  itemBrand: { ...type.caption, color: colors.textSecondary },
  itemName: { ...type.bodyStrong, color: colors.text },
  itemMeta: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  itemPrice: { ...type.bodyStrong, color: colors.primaryDark },
  remove: { ...type.caption, color: colors.error, textAlign: 'right', marginTop: spacing.sm },
  summary: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.md },
  summaryTitle: { ...type.h3, color: colors.text, marginBottom: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...type.body, color: colors.textSecondary },
  summaryValue: { ...type.bodyStrong, color: colors.text },
  summaryDivider: { height: 1, backgroundColor: colors.border },
  totalLabel: { ...type.h3, color: colors.text },
  totalValue: { ...type.h2, color: colors.primaryDark },
});
