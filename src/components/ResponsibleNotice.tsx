import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, type } from '../theme/theme';

export function ResponsibleNotice({
  title = 'Choose responsibly',
  text,
  tone = 'purple',
}: {
  title?: string;
  text: string;
  tone?: 'purple' | 'gold' | 'green';
}) {
  const palette = {
    purple: { background: colors.primarySoft, icon: '♡', title: colors.primary },
    gold: { background: colors.accentSoft, icon: 'i', title: colors.warning },
    green: { background: colors.successSoft, icon: '✓', title: colors.success },
  }[tone];

  return (
    <View style={[styles.card, { backgroundColor: palette.background }]}>
      <View style={[styles.icon, { borderColor: palette.title }]}>
        <Text style={[styles.iconText, { color: palette.title }]}>{palette.icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: palette.title }]}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { ...type.smallStrong },
  copy: { flex: 1, gap: 2 },
  title: { ...type.smallStrong },
  text: { ...type.small, color: colors.textSecondary },
});
