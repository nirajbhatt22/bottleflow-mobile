import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radii, type } from '../theme/theme';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, compact && styles.compactMark]}>
        <Image
          resizeMode="contain"
          source={require('../assets/images/icon-front.png')}
          style={[styles.icon, compact && styles.compactIcon]}
        />
      </View>
      {!compact ? (
        <View>
          <Text style={styles.name}>BottleFlow</Text>
          <Text style={styles.tagline}>Shop smarter. Choose responsibly.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: {
    width: 58,
    height: 58,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMark: { width: 42, height: 42, borderRadius: 13 },
  icon: { width: 44, height: 44 },
  compactIcon: { width: 32, height: 32 },
  name: { ...type.h2, color: colors.white },
  tagline: { ...type.caption, color: '#E9DDF0' },
});
