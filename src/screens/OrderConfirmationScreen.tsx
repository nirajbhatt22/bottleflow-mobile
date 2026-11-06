import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { useOrders } from '../context/OrderContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>;

export function OrderConfirmationScreen({ navigation }: Props) {
  const { latestOrder } = useOrders();

  if (!latestOrder) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.title}>No recent order</Text>
          <Text style={styles.subtitle}>Place an order from your cart to see its confirmation here.</Text>
          <AppButton label="Back to shop" onPress={() => navigation.replace('Home')} style={styles.fullButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'right', 'left']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.success}><Text style={styles.successText}>✓</Text></View>
          <Text style={styles.title}>Order confirmed</Text>
          <Text style={styles.subtitle}>Thanks. Your demo order has been saved and is now being prepared.</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Order" value={`#${latestOrder.orderNumber}`} />
          <View style={styles.divider} />
          <InfoRow label="Method" value={latestOrder.fulfilment} />
          <View style={styles.divider} />
          <InfoRow label="Time" value={latestOrder.timeWindow} />
          <View style={styles.divider} />
          <InfoRow label="Payment" value={`${latestOrder.paymentMethod} · demo`} />
          <View style={styles.divider} />
          <InfoRow label="Total" value={`$${latestOrder.total.toFixed(2)}`} strong />
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Order progress</Text>
          <StatusStep done label="Confirmed" note="Your order has been received" />
          <View style={styles.timelineLineDone} />
          <StatusStep active label="Preparing" note="The store is preparing your items" />
          <View style={styles.timelineLine} />
          <StatusStep label={latestOrder.fulfilment === 'Delivery' ? 'Out for delivery' : 'Ready to collect'} note="We will notify you when it is ready" />
        </View>

        <ResponsibleNotice tone="gold" title="Have your ID ready" text={`The named recipient must be present, be 18+ and show approved ID at ${latestOrder.fulfilment === 'Delivery' ? 'the door' : 'collection'}. Alcohol will not be left unattended.`} />

        <View style={styles.actions}>
          <AppButton label="Back to shop" onPress={() => navigation.replace('Home')} />
          <AppButton label="View account" onPress={() => navigation.replace('Account')} variant="secondary" />
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, strong && styles.strongValue]}>{value}</Text>
    </View>
  );
}

function StatusStep({ label, note, done = false, active = false }: { label: string; note: string; done?: boolean; active?: boolean }) {
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, done && styles.statusDone, active && styles.statusActive]}>
        <Text style={[styles.statusDotText, (done || active) && styles.statusDotTextActive]}>{done ? '✓' : active ? '2' : '3'}</Text>
      </View>
      <View style={styles.statusCopy}>
        <Text style={[styles.statusLabel, active && styles.statusLabelActive]}>{label}</Text>
        <Text style={styles.statusNote}>{note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl },
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl, gap: spacing.xl, paddingBottom: spacing.huge },
  hero: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  success: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  successText: { fontSize: 40, color: colors.success, fontWeight: '800' },
  title: { ...type.h1, color: colors.text, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 320 },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.md, ...shadow },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  label: { ...type.small, color: colors.textSecondary },
  value: { ...type.smallStrong, color: colors.text, textAlign: 'right', flex: 1 },
  strongValue: { ...type.h3, color: colors.primaryDark },
  divider: { height: 1, backgroundColor: colors.border },
  timelineCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl },
  sectionTitle: { ...type.h3, color: colors.text, marginBottom: spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  statusDone: { backgroundColor: colors.success },
  statusActive: { backgroundColor: colors.primary },
  statusDotText: { ...type.caption, color: colors.textSecondary },
  statusDotTextActive: { color: colors.white },
  statusCopy: { flex: 1 },
  statusLabel: { ...type.smallStrong, color: colors.textSecondary },
  statusLabelActive: { color: colors.primaryDark },
  statusNote: { ...type.caption, color: colors.textSecondary },
  timelineLine: { width: 2, height: 22, backgroundColor: colors.border, marginLeft: 14 },
  timelineLineDone: { width: 2, height: 22, backgroundColor: colors.success, marginLeft: 14 },
  actions: { gap: spacing.md, paddingTop: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  fullButton: { alignSelf: 'stretch' },
});
