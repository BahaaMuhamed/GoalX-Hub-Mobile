import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRole } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { apiBaseUrl } from '@/config';
import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const accent = profile?.primaryColor || colors.green;

  async function leave() {
    await signOut();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <BrandMark size={72} />
        <Text style={styles.kicker}>Signed in</Text>
        <Text style={styles.title}>{profile?.username || profile?.email || 'GoalX Hub'}</Text>
        <Text style={styles.subtitle}>Your account is connected to the platform.</Text>
        <View style={styles.card}>
          <Row label="Email" value={profile?.email || '—'} />
          <Row label="Role" value={profile?.role ? formatRole(profile.role) : '—'} />
          <Row label="Academy" value={profile?.organizationName || 'Platform'} />
          <Row label="Status" value={profile?.organizationStatus ? formatRole(profile.organizationStatus) : '—'} />
          <View style={[styles.swatch, { backgroundColor: accent }]} />
        </View>
        <Text style={styles.api}>API {apiBaseUrl()}</Text>
        <PrimaryButton label="Sign out" onPress={leave} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: 'center',
  },
  kicker: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.text,
    fontSize: 16,
  },
  swatch: {
    height: 6,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  api: {
    color: colors.faint,
    fontSize: 12,
  },
});
