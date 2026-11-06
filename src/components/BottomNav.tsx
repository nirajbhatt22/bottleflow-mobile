import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, type } from '../theme/theme';

type Tab = 'Shop' | 'Cart' | 'Account';

export function BottomNav({ active }: { active: Tab }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { itemCount } = useCart();
  const tabs: { label: Tab; icon: string; onPress: () => void }[] = [
    { label: 'Shop', icon: '⌂', onPress: () => navigation.navigate('Home') },
    { label: 'Cart', icon: '▣', onPress: () => navigation.navigate('Cart') },
    { label: 'Account', icon: '◉', onPress: () => navigation.navigate('Account') },
  ];

  return (
    <View style={styles.nav}>
      {tabs.map((tab) => {
        const selected = tab.label === active;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.label}
            onPress={tab.onPress}
            style={styles.tab}
          >
            <View>
              <Text style={[styles.icon, selected && styles.selected]}>{tab.icon}</Text>
              {tab.label === 'Cart' && itemCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{Math.min(itemCount, 9)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, selected && styles.selected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    minHeight: 82,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 20, color: colors.textSecondary },
  label: { ...type.caption, color: colors.textSecondary },
  selected: { color: colors.primary, fontWeight: '800' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -11,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
});
