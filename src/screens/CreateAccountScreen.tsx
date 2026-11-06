import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useSession } from '../context/SessionContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const { ageVerified, signIn } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && name.trim().length < 2 ? 'Enter your full name.' : undefined;
  const emailError = submitted && !email.includes('@') ? 'Enter a valid email address.' : undefined;
  const passwordError = submitted && password.length < 8 ? 'Use at least 8 characters.' : undefined;
  const confirmError = submitted && confirmPassword !== password ? 'Passwords do not match.' : undefined;

  const createAccount = () => {
    setSubmitted(true);
    const formIsValid = name.trim().length >= 2 && email.includes('@') && password.length >= 8 && confirmPassword === password;
    if (!formIsValid) return;

    signIn();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <TopBar title="Create account" onBack={navigation.goBack} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>JOIN BOTTLEFLOW</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Save your preferences, manage responsible-use controls and track demo orders.</Text>
          </View>

          <ResponsibleNotice
            tone={ageVerified ? 'green' : 'gold'}
            title={ageVerified ? '18+ verification complete' : 'Age verification required'}
            text="Account access is designed for verified adults. ID is still checked when alcohol is delivered or collected."
          />

          <View style={styles.card}>
            <AppInput
              autoComplete="name"
              error={nameError}
              label="Full name"
              onChangeText={setName}
              placeholder="Enter your name"
              value={name}
            />
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
            <AppInput
              autoCapitalize="none"
              autoComplete="new-password"
              error={passwordError}
              label="Password"
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              value={password}
            />
            <AppInput
              autoCapitalize="none"
              autoComplete="new-password"
              error={confirmError}
              label="Confirm password"
              onChangeText={setConfirmPassword}
              placeholder="Enter password again"
              secureTextEntry
              value={confirmPassword}
            />
            <AppButton label="Create demo account" onPress={createAccount} />
            <Text style={styles.note}>Prototype only: account details are not saved or sent to a server.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.huge, gap: spacing.xl },
  heading: { gap: spacing.sm },
  eyebrow: { ...type.caption, color: colors.primary, letterSpacing: 1.3 },
  title: { ...type.h1, color: colors.text },
  subtitle: { ...type.body, color: colors.textSecondary },
  card: { gap: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, ...shadow },
  note: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },
});
