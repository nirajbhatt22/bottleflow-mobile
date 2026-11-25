import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHOP } from './Storefront';

const methods = [
  { id: 'card', label: 'Debit or credit card', hint: 'EFTPOS, Visa or Mastercard', mark: 'CARD' },
  { id: 'apple-pay', label: 'Apple Pay', hint: 'Tap an iPhone or Apple Watch', mark: 'iOS' },
  { id: 'google-pay', label: 'Google Pay', hint: 'Tap an Android device with Google Wallet', mark: 'G' },
  { id: 'cash', label: 'Cash', hint: 'Pay in AUD at the counter', mark: 'AUD' },
] as const;

export type PickupPaymentMethod = typeof methods[number]['id'];

export function parsePickupPayment(value: string | null): PickupPaymentMethod | null {
  return methods.find(method => method.id === value)?.id ?? null;
}

export function pickupPaymentLabel(value: PickupPaymentMethod): string {
  return methods.find(method => method.id === value)!.label;
}

export function PickupPayment({ selected, onSelect }: {
  selected: PickupPaymentMethod | null;
  onSelect: (method: PickupPaymentMethod) => void;
}) {
  return <View accessibilityRole="radiogroup" style={styles.list}>
    <Text style={styles.explainer}>Choose the collector’s preferred way to pay at pickup. No charge is made in the app.</Text>
    {methods.map(method => {
      const checked = selected === method.id;
      return <TouchableOpacity
        key={method.id}
        accessibilityRole="radio"
        accessibilityState={{ checked }}
        accessibilityLabel={`${method.label}, ${method.hint}`}
        onPress={() => onSelect(method.id)}
        style={[styles.option, checked && styles.selected]}
      >
        <View style={styles.mark}><Text style={styles.markText}>{method.mark}</Text></View>
        <View style={styles.description}>
          <Text style={styles.label}>{method.label}</Text>
          <Text style={styles.hint}>{method.hint}</Text>
        </View>
        <View style={[styles.radio, checked && styles.checked]}>
          {checked ? <View style={styles.dot} /> : null}
        </View>
      </TouchableOpacity>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 8, marginBottom: 16 },
  explainer: { color: SHOP.muted, fontSize: 13, lineHeight: 19, marginBottom: 2 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, padding: 10, borderWidth: 1, borderColor: SHOP.line, borderRadius: 11, backgroundColor: SHOP.surface },
  selected: { borderColor: SHOP.accent, backgroundColor: SHOP.soft },
  mark: { height: 34, width: 42, borderRadius: 8, backgroundColor: SHOP.dark, alignItems: 'center', justifyContent: 'center' },
  markText: { color: SHOP.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  description: { flex: 1 },
  label: { color: SHOP.ink, fontWeight: '800', fontSize: 14 },
  hint: { color: SHOP.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: '#A8909B', alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: SHOP.accent },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: SHOP.accent },
});
