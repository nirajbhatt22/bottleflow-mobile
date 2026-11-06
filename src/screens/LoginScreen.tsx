import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { BrandMark } from '../components/BrandMark';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useSession } from '../context/SessionContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useSession();
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('BottleFlow1');
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.includes('@') ? 'Enter a valid email address.' : undefined;
  const passwordError = submitted && password.length < 6 ? 'Password must be at least 6 characters.' : undefined;

  const handleLogin = () => {
    setSubmitted(true);
    if (!email.includes('@') || password.length < 6) return;
    signIn();
    navigation.replace('Home');
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <TopBar title="Sign in" onBack={() => navigation.replace('AgeVerification')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <BrandMark compact />
            <Text style={styles.brandName}>BottleFlow</Text>
          </View>
          <View style={styles.welcome}>
            <Text style={styles.eyebrow}>AGE VERIFIED</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to shop, track orders and manage your responsible-use settings.</Text>
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
            <AppInput
              autoCapitalize="none"
              autoComplete="password"
              error={passwordError}
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              value={password}
            />
            <Pressable accessibilityRole="link" onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>
            <AppButton label="Sign in" onPress={handleLogin} />
            <Text style={styles.demo}>Demo details are filled in for presentation use.</Text>
          </View>

          <View style={styles.createRow}>
            <Text style={styles.createText}>New to BottleFlow?</Text>
            <Pressable accessibilityRole="link" onPress={() => navigation.navigate('CreateAccount')}>
              <Text style={styles.createLink}> Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.xxl, justifyContent: 'center', gap: spacing.xxl },
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandName: { ...type.h3, color: colors.primaryDark },
  welcome: { gap: spacing.sm },
  eyebrow: { ...type.caption, color: colors.success, letterSpacing: 1.4 },
  title: { ...type.display, color: colors.text },
  subtitle: { ...type.body, color: colors.textSecondary },
  card: { gap: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, ...shadow },
  forgot: { ...type.smallStrong, color: colors.primary, textAlign: 'right', marginTop: -spacing.sm },
  demo: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },
  createRow: { flexDirection: 'row', justifyContent: 'center' },
  createText: { ...type.small, color: colors.textSecondary },
  createLink: { ...type.smallStrong, color: colors.primary },
});
