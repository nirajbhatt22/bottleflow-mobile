import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '../components/BrandMark';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('AgeVerification'), 1400);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <BrandMark />
      </View>
      <View style={styles.footer}>
        <Text style={styles.over18}>For adults 18+ only</Text>
        <Text style={styles.care}>Please enjoy alcohol responsibly.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.primaryDark, padding: spacing.xxl },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { alignItems: 'center', gap: spacing.xs, paddingBottom: spacing.lg },
  over18: { ...type.smallStrong, color: colors.accent },
  care: { ...type.caption, color: '#D9CBE1' },
});
