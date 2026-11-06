import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BrandMark } from '../components/BrandMark';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { useSession } from '../context/SessionContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AgeVerification'>;

export function AgeVerificationScreen({ navigation }: Props) {
  const { verifyAge } = useSession();
  const [loadingMethod, setLoadingMethod] = useState<'digital-id' | 'photo-id' | null>(null);

  const beginVerification = (method: 'digital-id' | 'photo-id') => {
    setLoadingMethod(method);
    setTimeout(() => {
      verifyAge(method);
      navigation.replace('Login');
    }, 700);
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <BrandMark compact />
        <Text style={styles.headerName}>BottleFlow</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.shield}>
          <Text style={styles.shieldText}>18+</Text>
        </View>
        <Text style={styles.title}>Verify your age securely</Text>
        <Text style={styles.subtitle}>
          Alcohol products are only available to adults aged 18 or over. Choose a secure verification method to continue.
        </Text>

        <View style={styles.card}>
          <View style={styles.methodHeader}>
            <Text style={styles.methodTitle}>Digital ID</Text>
            <View style={styles.recommended}><Text style={styles.recommendedText}>Recommended</Text></View>
          </View>
          <Text style={styles.methodText}>Confirm only your 18+ status without sharing a copy of your ID with BottleFlow.</Text>
          <AppButton
            label="Continue with Digital ID"
            loading={loadingMethod === 'digital-id'}
            onPress={() => beginVerification('digital-id')}
          />
          <AppButton
            label="Use approved photo ID"
            variant="secondary"
            loading={loadingMethod === 'photo-id'}
            onPress={() => beginVerification('photo-id')}
          />
        </View>

        <ResponsibleNotice
          tone="gold"
          title="Privacy first"
          text="BottleFlow stores only the verified 18+ result. Your physical ID must still be checked when your order is delivered or collected."
        />
        <Text style={styles.prototypeNote}>
          Prototype note: verification is simulated. A production app would connect to an accredited identity provider.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  headerName: { ...type.h3, color: colors.primaryDark },
  content: { flex: 1, justifyContent: 'center', gap: spacing.lg, paddingBottom: spacing.xl },
  shield: {
    width: 78,
    height: 78,
    borderRadius: 27,
    backgroundColor: colors.primary,
    borderWidth: 5,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  shieldText: { fontSize: 25, fontWeight: '900', color: colors.accent },
  title: { ...type.h1, color: colors.text, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md, ...shadow },
  methodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodTitle: { ...type.h3, color: colors.text },
  recommended: { borderRadius: radii.pill, backgroundColor: colors.successSoft, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  recommendedText: { ...type.caption, color: colors.success },
  methodText: { ...type.small, color: colors.textSecondary },
  prototypeNote: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },
});
