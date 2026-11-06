import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { BrandMark } from '../components/BrandMark';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('student@example.com');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError = submitted && !email.includes('@') ? 'Enter a valid email address.' : undefined;

  const sendResetLink = () => {
    setSubmitted(true);
    if (!email.includes('@')) return;
    setSent(true);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <TopBar title="Forgot password" onBack={navigation.goBack} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandMark />

          {sent ? (
            <View style={styles.successCard}>
              <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>Reset instructions have been prepared for {email}.</Text>
              <ResponsibleNotice
                tone="green"
                title="Prototype message"
                text="No real email was sent. A production app would send a secure, time-limited password-reset link."
              />
              <AppButton label="Back to sign in" onPress={navigation.goBack} />
            </View>
          ) : (
            <>
              <View style={styles.heading}>
                <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
                <Text style={styles.title}>Reset your password</Text>
                <Text style={styles.subtitle}>Enter your account email and we will prepare password-reset instructions.</Text>
              </View>

              <View style={styles.card}>
                <AppInput
                  autoCapitalize="none"
                  autoComplete="email"
                  error={emailError}
                  keyboardType="email-address"
                  label="Email address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  value={email}
                />
                <AppButton label="Send reset link" onPress={sendResetLink} />
                <Text style={styles.note}>This recovery step is simulated for the student prototype.</Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, gap: spacing.xxl },
  heading: { gap: spacing.sm },
  eyebrow: { ...type.caption, color: colors.primary, letterSpacing: 1.3 },
  title: { ...type.h1, color: colors.text },
  subtitle: { ...type.body, color: colors.textSecondary },
  card: { gap: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, ...shadow },
  note: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },
  successCard: { gap: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, ...shadow },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  successIconText: { color: colors.success, fontSize: 30, fontWeight: '800' },
});
