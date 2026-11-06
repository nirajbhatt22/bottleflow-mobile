import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomNav } from '../components/BottomNav';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useOrders } from '../context/OrderContext';
import { useSession } from '../context/SessionContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

export function AccountScreen({ navigation }: Props) {
  const { latestOrder, monthlySpend, orders } = useOrders();
  const {
    ageVerified,
    signOut,
    hidePromotions,
    setHidePromotions,
    spendingReminder,
    setSpendingReminder,
    purchasesPaused,
    setPurchasesPaused,
  } = useSession();

  const reminderProgress = Math.min(monthlySpend / 100, 1);

  const handleSignOut = () => {
    signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const showPrototypeLink = (title: string) => {
    Alert.alert(title, 'This information link is represented as a safe offline placeholder in the student prototype.');
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <TopBar title="Account" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}><Text style={styles.avatarText}>NB</Text></View>
          <View style={styles.profileCopy}><Text style={styles.name}>Niraj Bhatt</Text><Text style={styles.email}>student@example.com</Text></View>
          <View style={styles.verified}><Text style={styles.verifiedText}>{ageVerified ? '18+ verified' : 'Not verified'}</Text></View>
        </View>

        {latestOrder ? (
          <View style={styles.orderCard}>
            <View style={styles.orderHeading}>
              <Text style={styles.orderTitle}>Recent order</Text>
              <Text style={styles.orderStatus}>{latestOrder.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.orderNumber}>#{latestOrder.orderNumber}</Text>
            <Text style={styles.orderMeta}>{latestOrder.fulfilment} · {latestOrder.timeWindow}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderSmall}>{latestOrder.itemCount} item{latestOrder.itemCount === 1 ? '' : 's'} · {latestOrder.placedOn}</Text>
              <Text style={styles.orderTotal}>${latestOrder.total.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyOrderCard}>
            <View>
              <Text style={styles.sectionTitle}>No orders yet</Text>
              <Text style={styles.sectionIntro}>Your latest order will appear here after checkout.</Text>
            </View>
            <AppButton label="Browse products" onPress={() => navigation.navigate('Home')} variant="secondary" />
          </View>
        )}

        <View style={styles.spendingCard}>
          <View style={styles.spendingHeading}>
            <View>
              <Text style={styles.sectionTitle}>Monthly purchase reminder</Text>
              <Text style={styles.sectionIntro}>{orders.length} local demo order{orders.length === 1 ? '' : 's'} this session</Text>
            </View>
            <Text style={styles.spendValue}>${monthlySpend.toFixed(2)}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${reminderProgress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {spendingReminder
              ? monthlySpend >= 100
                ? 'Your $100 reminder point has been reached.'
                : `$${Math.max(100 - monthlySpend, 0).toFixed(2)} until your $100 reminder.`
              : 'The monthly reminder is currently switched off.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsible-use controls</Text>
          <Text style={styles.sectionIntro}>These settings immediately change your shopping experience in this prototype.</Text>
          <SettingRow description="Remove featured alcohol recommendations from Home." label="Hide alcohol promotions" onValueChange={setHidePromotions} value={hidePromotions} />
          <View style={styles.rule} />
          <SettingRow description="Show a reminder when this session's orders reach $100." label="$100 purchase reminder" onValueChange={setSpendingReminder} value={spendingReminder} />
          <View style={styles.rule} />
          <SettingRow description="Disable alcohol purchases until you choose to resume." label="Pause alcohol purchases" onValueChange={setPurchasesPaused} value={purchasesPaused} />
        </View>

        {purchasesPaused ? (
          <ResponsibleNotice tone="green" title="Alcohol purchases paused" text="Alcohol add-to-cart and checkout are disabled. You can still browse and purchase 0.0% products." />
        ) : null}

        <View style={styles.supportCard}>
          <Text style={styles.sectionTitle}>Support and information</Text>
          <SupportLink label="Australian alcohol guidelines" onPress={() => showPrototypeLink('Australian alcohol guidelines')} />
          <SupportLink label="Alcohol and Drug Support Line (WA)" onPress={() => showPrototypeLink('Alcohol and Drug Support Line (WA)')} />
          <SupportLink label="Privacy and age-verification information" onPress={() => showPrototypeLink('Privacy and age verification')} />
          <Text style={styles.supportNote}>These buttons demonstrate the planned information area without opening external links.</Text>
        </View>

        <AppButton label="Sign out" onPress={handleSignOut} variant="secondary" />
      </ScrollView>
      <BottomNav active="Account" />
    </Screen>
  );
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}><Text style={styles.settingLabel}>{label}</Text><Text style={styles.settingDescription}>{description}</Text></View>
      <Switch ios_backgroundColor={colors.border} onValueChange={onValueChange} thumbColor={colors.white} trackColor={{ false: colors.border, true: colors.primary }} value={value} />
    </View>
  );
}

function SupportLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.supportLink}>
      <Text style={styles.supportText}>{label}</Text>
      <Text style={styles.supportArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },
  profile: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadow },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...type.h3, color: colors.primary },
  profileCopy: { flex: 1, marginLeft: spacing.md },
  name: { ...type.bodyStrong, color: colors.text },
  email: { ...type.caption, color: colors.textSecondary },
  verified: { backgroundColor: colors.successSoft, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  verifiedText: { ...type.caption, color: colors.success },
  orderCard: { backgroundColor: colors.primaryDark, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.xs },
  orderHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { ...type.h3, color: colors.white },
  orderStatus: { ...type.caption, color: colors.accent },
  orderNumber: { ...type.bodyStrong, color: colors.white },
  orderMeta: { ...type.small, color: '#DCCFE4' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  orderSmall: { ...type.caption, color: '#DCCFE4' },
  orderTotal: { ...type.h3, color: colors.accent },
  emptyOrderCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.lg },
  spendingCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.md },
  spendingHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  spendValue: { ...type.h2, color: colors.primaryDark },
  progressTrack: { height: 9, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.accent },
  progressText: { ...type.caption, color: colors.textSecondary },
  section: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.lg },
  sectionTitle: { ...type.h3, color: colors.text },
  sectionIntro: { ...type.small, color: colors.textSecondary, marginTop: -spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  settingCopy: { flex: 1, gap: 2 },
  settingLabel: { ...type.bodyStrong, color: colors.text },
  settingDescription: { ...type.small, color: colors.textSecondary },
  rule: { height: 1, backgroundColor: colors.border },
  supportCard: { backgroundColor: colors.accentSoft, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm },
  supportLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  supportText: { flex: 1, ...type.smallStrong, color: colors.primary },
  supportArrow: { color: colors.primary, fontSize: 22 },
  supportNote: { ...type.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
