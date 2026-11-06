import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ChoiceCard } from '../components/ChoiceCard';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useCart } from '../context/CartContext';
import {
  FulfilmentMethod,
  PaymentMethod,
  useOrders,
} from '../context/OrderContext';
import { useSession } from '../context/SessionContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const deliveryTimes = [
  'Tomorrow · 10:00 am – 12:00 pm',
  'Tomorrow · 2:00 pm – 4:00 pm',
];

const collectionTimes = [
  'Tomorrow · 10:00 am – 11:00 am',
  'Tomorrow · 3:00 pm – 4:00 pm',
];

export function CheckoutScreen({ navigation }: Props) {
  const { subtotal, items, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { ageVerified, purchasesPaused } = useSession();
  const [name, setName] = useState('Niraj Bhatt');
  const [phone, setPhone] = useState('0400 000 000');
  const [address, setAddress] = useState('123 Example Street, Perth WA 6000');
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>('Delivery');
  const [timeWindow, setTimeWindow] = useState<string>(deliveryTimes[0]!);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card payment');
  const [acceptedIdCheck, setAcceptedIdCheck] = useState(false);
  const [acceptedResponsibleHandover, setAcceptedResponsibleHandover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const containsAlcohol = items.some((item) => item.product.standardDrinksTotal > 0);
  const alcoholOrderPaused = purchasesPaused && containsAlcohol;
  const deliveryFee = fulfilment === 'Delivery' ? 8 : 0;
  const total = subtotal + deliveryFee;
  const addressReady = fulfilment === 'Click & Collect' || Boolean(address.trim());
  const canSubmit = Boolean(
    items.length &&
      ageVerified &&
      !alcoholOrderPaused &&
      acceptedIdCheck &&
      acceptedResponsibleHandover &&
      name.trim() &&
      phone.trim() &&
      addressReady,
  );

  const chooseFulfilment = (method: FulfilmentMethod) => {
    setFulfilment(method);
    setTimeWindow(method === 'Delivery' ? deliveryTimes[0]! : collectionTimes[0]!);
  };

  const placeCurrentOrder = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    setTimeout(() => {
      placeOrder({
        items,
        subtotal,
        deliveryFee,
        fulfilment,
        timeWindow,
        paymentMethod,
      });
      clearCart();
      navigation.replace('OrderConfirmation');
    }, 650);
  };

  const availableTimes = fulfilment === 'Delivery' ? deliveryTimes : collectionTimes;

  return (
    <Screen edges={['top', 'right', 'left']}>
      <TopBar title="Checkout" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <View style={styles.stepRow}>
            <View style={styles.stepDone}><Text style={styles.stepDoneText}>✓</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepActive}><Text style={styles.stepActiveText}>2</Text></View>
            <View style={styles.stepLineMuted} />
            <View style={styles.stepMuted}><Text style={styles.stepMutedText}>3</Text></View>
          </View>
          <View style={styles.stepLabelRow}>
            <Text style={styles.stepLabel}>Cart</Text>
            <Text style={styles.stepLabel}>Checkout</Text>
            <Text style={styles.stepLabel}>Done</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How would you like your order?</Text>
          <ChoiceCard
            description="$8 standard delivery · ID checked at the door"
            onPress={() => chooseFulfilment('Delivery')}
            selected={fulfilment === 'Delivery'}
            title="Delivery"
          />
          <ChoiceCard
            description="Free collection from Perth CBD · ID checked in store"
            onPress={() => chooseFulfilment('Click & Collect')}
            selected={fulfilment === 'Click & Collect'}
            title="Click & Collect"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact details</Text>
          <AppInput label="Recipient name" onChangeText={setName} value={name} />
          <AppInput keyboardType="phone-pad" label="Mobile number" onChangeText={setPhone} value={phone} />
          {fulfilment === 'Delivery' ? (
            <AppInput label="Delivery address" onChangeText={setAddress} value={address} />
          ) : (
            <View style={styles.storeCard}>
              <Text style={styles.storeTitle}>BottleFlow Perth CBD</Text>
              <Text style={styles.storeText}>100 Murray Street, Perth WA 6000</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{fulfilment} time</Text>
          {availableTimes.map((option) => (
            <ChoiceCard
              key={option}
              description={fulfilment === 'Delivery' ? 'Two-hour delivery window' : 'One-hour collection window'}
              onPress={() => setTimeWindow(option)}
              selected={timeWindow === option}
              title={option}
            />
          ))}
          <Text style={styles.note}>Restricted alcohol trading and delivery hours are respected.</Text>
        </View>

        <View style={styles.section}>
          <View>
            <Text style={styles.sectionTitle}>Payment method</Text>
            <Text style={styles.prototypeLabel}>PROTOTYPE — NO REAL PAYMENT IS TAKEN</Text>
          </View>
          <ChoiceCard
            description="Demo card ending in 4242"
            onPress={() => setPaymentMethod('Card payment')}
            selected={paymentMethod === 'Card payment'}
            title="Card payment"
          />
          <ChoiceCard
            description="Simulated mobile wallet"
            onPress={() => setPaymentMethod('Digital wallet')}
            selected={paymentMethod === 'Digital wallet'}
            title="Digital wallet"
          />
        </View>

        <ResponsibleNotice
          tone={ageVerified ? 'green' : 'gold'}
          title={ageVerified ? '18+ verification complete' : 'Age verification required'}
          text={`The named recipient must show approved ID at ${fulfilment === 'Delivery' ? 'the door' : 'collection'}. Handover is refused if the recipient is under 18, cannot provide ID or appears intoxicated.`}
        />

        {alcoholOrderPaused ? (
          <ResponsibleNotice title="Alcohol purchases are paused" text="This cart contains alcohol, so checkout is disabled by your responsible-use setting. Alcohol-free orders can still continue." />
        ) : purchasesPaused ? (
          <ResponsibleNotice tone="green" title="Alcohol purchases are paused" text="This order contains only 0.0% products, so you can still continue." />
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required confirmations</Text>
          <CheckRow checked={acceptedIdCheck} label="I understand the recipient must show valid ID proving they are 18+." onPress={() => setAcceptedIdCheck((value) => !value)} />
          <CheckRow checked={acceptedResponsibleHandover} label="I understand alcohol will not be left unattended and handover may be refused." onPress={() => setAcceptedResponsibleHandover((value) => !value)} />
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Items</Text><Text style={styles.totalText}>${subtotal.toFixed(2)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>{fulfilment}</Text><Text style={styles.totalText}>{deliveryFee ? `$${deliveryFee.toFixed(2)}` : 'Free'}</Text></View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}><Text style={styles.totalTitle}>Total</Text><Text style={styles.totalValue}>${total.toFixed(2)}</Text></View>
        </View>

        <AppButton disabled={!canSubmit} label={alcoholOrderPaused ? 'Alcohol purchases paused' : 'Place demo order'} loading={submitting} onPress={placeCurrentOrder} />
        {!canSubmit ? <Text style={styles.disabledHint}>{alcoholOrderPaused ? 'Remove alcohol or resume purchases in Account.' : 'Complete the required details and confirmations.'}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

function CheckRow({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}><Text style={styles.checkboxText}>{checked ? '✓' : ''}</Text></View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.xl, paddingBottom: spacing.huge },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl },
  stepDone: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  stepDoneText: { color: colors.white, fontWeight: '800' },
  stepActive: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepActiveText: { color: colors.white, fontWeight: '800' },
  stepMuted: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepMutedText: { color: colors.textSecondary, fontWeight: '800' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.success },
  stepLineMuted: { flex: 1, height: 2, backgroundColor: colors.border },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  stepLabel: { width: 72, ...type.caption, color: colors.textSecondary, textAlign: 'center' },
  section: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.md },
  sectionTitle: { ...type.h3, color: colors.text },
  prototypeLabel: { ...type.caption, color: colors.warning, marginTop: spacing.xs },
  storeCard: { backgroundColor: colors.primarySoft, borderRadius: radii.md, padding: spacing.lg, gap: 2 },
  storeTitle: { ...type.smallStrong, color: colors.primaryDark },
  storeText: { ...type.small, color: colors.textSecondary },
  note: { ...type.caption, color: colors.textSecondary },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxText: { color: colors.white, fontWeight: '800' },
  checkLabel: { flex: 1, ...type.small, color: colors.text },
  totalCard: { borderRadius: radii.lg, backgroundColor: colors.primaryDark, padding: spacing.xl, gap: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...type.body, color: '#DCCFE4' },
  totalText: { ...type.bodyStrong, color: colors.white },
  totalDivider: { height: 1, backgroundColor: '#704B86' },
  totalTitle: { ...type.h3, color: colors.white },
  totalValue: { ...type.h2, color: colors.accent },
  disabledHint: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },
});
