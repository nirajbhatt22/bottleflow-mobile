import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, type } from '../theme/theme';

export function QuantityStepper({
  value,
  onChange,
  minimum = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= minimum}
        onPress={() => onChange(value - 1)}
        style={styles.button}
      >
        <Text style={[styles.symbol, value <= minimum && styles.disabled]}>−</Text>
      </Pressable>
      <Text accessibilityLabel={`Quantity ${value}`} style={styles.value}>
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        onPress={() => onChange(value + 1)}
        style={styles.button}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { color: colors.primary, fontSize: 22, fontWeight: '500' },
  value: { minWidth: 24, textAlign: 'center', ...type.smallStrong, color: colors.text },
  disabled: { color: colors.border },
});
