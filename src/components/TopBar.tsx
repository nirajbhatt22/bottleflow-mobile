import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type } from '../theme/theme';

export function TopBar({
  title,
  onBack,
  rightLabel,
  onRightPress,
}: {
  title: string;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={12}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>
        {rightLabel && onRightPress ? (
          <Pressable onPress={onRightPress} hitSlop={10}>
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  side: { width: 70 },
  right: { alignItems: 'flex-end' },
  back: { color: colors.primary, fontSize: 38, lineHeight: 42, fontWeight: '300' },
  title: { flex: 1, textAlign: 'center', ...type.h3, color: colors.text },
  rightLabel: { ...type.smallStrong, color: colors.primary },
});
