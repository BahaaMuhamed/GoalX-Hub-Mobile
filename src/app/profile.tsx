import { router, useFocusEffect, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { isPlayerRole, loadMyProfile, loadPlayerPoints, type AccountProfile, type PlayerPoints } from '@/api/profile';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenBack } from '@/components/ScreenBack';
import { TextField } from '@/components/TextField';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

const text = {
  en: {
    title: 'Account',
    main: 'Main',
    personal: 'Personal profile',
    feedback: 'Send feedback',
    preferences: 'Preferences',
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    security: 'Security and help',
    password: 'Change password',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    about: 'About the app',
    social: 'Follow us on social media',
    danger: 'Danger zone',
    signOut: 'Sign out',
    delete: 'Delete account',
    deleteHint: 'This action cannot be undone.',
    made: 'GolaX Hub · v1.0.0',
    newPassword: 'New password',
    save: 'Save password',
    cancel: 'Cancel',
    saved: 'Password updated.',
    confirmDelete: 'Delete this account? This cannot be undone.',
    role: 'Role',
    academy: 'Academy',
    email: 'Email',
    username: 'Username',
    fullName: 'Full name',
    status: 'Status',
    active: 'Active',
    disabled: 'Disabled',
    locked: 'Locked',
    since: 'Member since',
    organization: 'Organization',
    platform: 'Platform',
    points: 'Points',
    pointsDeemed: 'Deemed points',
    spendable: 'Spendable points',
    deemedHint: 'This player\'s subscription contract has ended. The points remain on the ledger but cannot be spent until the contract is renewed.',
    pts: 'pts',
    roles: {
      SUPER_ADMIN: 'Super Admin',
      ORGANIZATION_ADMIN: 'Academy Admin',
      ADMINISTRATIVE: 'Administrative',
      ACCOUNTANT: 'Accountant',
      PLATFORM_EMPLOYEE: 'Main platform administrative',
      ADMIN: 'Admin',
      COACH: 'Coach',
      PLAYER: 'Player',
      FREE_PLAYER: 'Free player',
      PUBLIC_USER: 'Public user',
    } as Record<string, string>,
  },
  ar: {
    title: 'الحساب',
    main: 'الرئيسية',
    personal: 'الملف الشخصي',
    feedback: 'إرسال ملاحظات',
    preferences: 'التفضيلات',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    security: 'الأمان والمساعدة',
    password: 'تغيير كلمة المرور',
    privacy: 'سياسة الخصوصية',
    terms: 'شروط الاستخدام',
    about: 'عن التطبيق',
    social: 'تابعنا على وسائل التواصل الاجتماعي',
    danger: 'منطقة الخطر',
    signOut: 'تسجيل الخروج',
    delete: 'حذف الحساب',
    deleteHint: 'لا يمكن التراجع عن هذا الإجراء.',
    made: 'GolaX Hub · v1.0.0',
    newPassword: 'كلمة المرور الجديدة',
    save: 'حفظ كلمة المرور',
    cancel: 'إلغاء',
    saved: 'تم تحديث كلمة المرور.',
    confirmDelete: 'حذف هذا الحساب؟ لا يمكن التراجع عن ذلك.',
    role: 'الدور',
    academy: 'الأكاديمية',
    email: 'البريد الإلكتروني',
    username: 'اسم المستخدم',
    fullName: 'الاسم الكامل',
    status: 'الحالة',
    active: 'نشط',
    disabled: 'موقوف',
    locked: 'مقفل',
    since: 'عضو منذ',
    organization: 'المنظمة',
    platform: 'المنصة',
    points: 'النقاط',
    pointsDeemed: 'نقاط مجمدة',
    spendable: 'النقاط القابلة للاستخدام',
    deemedHint: 'انتهى عقد اشتراك هذا اللاعب. النقاط تبقى في السجل ولا يمكن استخدامها حتى يتم تجديد العقد.',
    pts: 'نقطة',
    roles: {
      SUPER_ADMIN: 'المسؤول العام',
      ORGANIZATION_ADMIN: 'مسؤول الأكاديمية',
      ADMINISTRATIVE: 'إداري',
      ACCOUNTANT: 'محاسب',
      PLATFORM_EMPLOYEE: 'إداري المنصة الرئيسية',
      ADMIN: 'مسؤول',
      COACH: 'مدرب',
      PLAYER: 'لاعب',
      FREE_PLAYER: 'لاعب حر',
      PUBLIC_USER: 'مستخدم عام',
    } as Record<string, string>,
  },
};

export default function ProfileScreen() {
  const { lang, rtl, setLang } = useLocale();
  const { profile, signOut } = useAuth();
  const workspace = useWorkspace();
  const copy = text[lang];
  const align = rtl ? 'right' : 'left';
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [points, setPoints] = useState<PlayerPoints | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    loadMyProfile()
      .then(async (next) => {
        if (!active) return;
        setAccount(next);
        if (!isPlayerRole(next.role, next.playerActive)) {
          setPoints(null);
          return;
        }
        const ledger = await loadPlayerPoints();
        if (active) setPoints(ledger);
      })
      .catch(() => {
        if (active) setAccount(null);
      });
    return () => {
      active = false;
    };
  }, []));

  const shown = account ?? {
    id: profile?.userId ?? '',
    username: profile?.username ?? '',
    email: profile?.email ?? '',
    fullName: profile?.username || profile?.email || '',
    role: profile?.role ?? '',
    organizationId: profile?.organizationId ?? null,
    organizationName: profile?.organizationName ?? workspace.brandName,
    enabled: true,
    accountLocked: false,
    createdAt: null,
    playerActive: null,
  };
  const player = isPlayerRole(shown.role, shown.playerActive);
  const roleLabel = copy.roles[shown.role] || shown.role || '—';
  const statusLabel = shown.accountLocked ? copy.locked : shown.enabled ? copy.active : copy.disabled;
  const organization = shown.organizationName || workspace.brandName || (shown.organizationId ? shown.organizationId : copy.platform);

  async function savePassword() {
    if (!profile?.userId || password.trim().length < 8) {
      setMessage(copy.newPassword);
      return;
    }
    try {
      await apiRequest(`/users/${profile.userId}/password`, {
        method: 'PUT',
        auth: true,
        body: { password: password.trim() },
      });
      setPassword('');
      setPasswordOpen(false);
      setMessage(copy.saved);
    } catch (error) {
      setMessage(errorMessage(error, copy.newPassword));
    }
  }

  function removeAccount() {
    if (!profile?.userId) return;
    Alert.alert(copy.delete, copy.confirmDelete, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: () => {
          void apiRequest(`/users/${profile.userId}`, { method: 'DELETE', auth: true })
            .then(() => signOut())
            .catch((error: unknown) => setMessage(errorMessage(error, copy.deleteHint)));
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page}>
          <ScreenBack />
          <View style={[styles.identity, rtl && styles.rtl]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(shown.fullName || shown.username || shown.email)}</Text>
            </View>
            <View style={styles.who}>
              <Text style={[styles.name, { textAlign: align }]}>{shown.fullName || shown.username || '—'}</Text>
              <Text style={[styles.role, { textAlign: align }]}>{roleLabel}</Text>
              <Text style={[styles.status, !shown.enabled || shown.accountLocked ? styles.statusOff : null, { alignSelf: rtl ? 'flex-end' : 'flex-start' }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: align }]}>{copy.title}</Text>
            <View style={[styles.facts, rtl && styles.rtl]}>
              <Fact label={copy.fullName} value={shown.fullName || '—'} align={align} />
              <Fact label={copy.username} value={shown.username || '—'} align={align} />
              <Fact label={copy.email} value={shown.email || '—'} align={align} />
              <Fact label={copy.role} value={roleLabel} align={align} />
              <Fact label={copy.status} value={statusLabel} align={align} />
              <Fact label={copy.since} value={memberSince(shown.createdAt)} align={align} />
              <Fact label={copy.organization} value={organization} align={align} />
            </View>
          </View>

          {player ? (
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { textAlign: align }]}>{copy.points}</Text>
              <View style={[styles.pointsChip, points?.deemed && styles.pointsDeemed, rtl && styles.rtl]}>
                <Text style={styles.pointsIcon}>★</Text>
                <View style={styles.pointsCopy}>
                  <Text style={[styles.pointsLabel, { textAlign: align }]}>{points?.deemed ? copy.pointsDeemed : copy.points}</Text>
                  <Text style={[styles.pointsValue, { textAlign: align }]}>{points?.total ?? 0} <Text style={styles.pointsUnit}>{copy.pts}</Text></Text>
                </View>
              </View>
              <View style={[styles.facts, rtl && styles.rtl]}>
                <Fact label={copy.spendable} value={String(points?.spendable ?? 0)} align={align} />
                <Fact label={copy.points} value={String(points?.total ?? 0)} align={align} />
              </View>
              {points?.deemed ? <Text style={[styles.deemedHint, { textAlign: align }]}>{copy.deemedHint}</Text> : null}
            </View>
          ) : null}

          <Section title={copy.main} align={align}>
            <Row label={copy.feedback} align={align} onPress={() => router.push('/site/contact' as Href)} />
          </Section>

          <Section title={copy.preferences} align={align}>
            <View style={[styles.langRow, rtl && styles.rtl]}>
              <Text style={styles.rowLabel}>{copy.language}</Text>
              <View style={styles.langs}>
                <Pressable style={[styles.lang, lang === 'ar' && styles.langOn]} onPress={() => setLang('ar')}>
                  <Text style={[styles.langText, lang === 'ar' && styles.langTextOn]}>{copy.arabic}</Text>
                </Pressable>
                <Pressable style={[styles.lang, lang === 'en' && styles.langOn]} onPress={() => setLang('en')}>
                  <Text style={[styles.langText, lang === 'en' && styles.langTextOn]}>{copy.english}</Text>
                </Pressable>
              </View>
            </View>
          </Section>

          <Section title={copy.security} align={align}>
            <Row label={copy.password} align={align} onPress={() => setPasswordOpen((open) => !open)} />
            {passwordOpen ? (
              <View style={styles.passwordBox}>
                <TextField label={copy.newPassword} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" align={align} />
                <Pressable style={[styles.save, { backgroundColor: workspace.accent }]} onPress={() => void savePassword()}>
                  <Text style={styles.saveLabel}>{copy.save}</Text>
                </Pressable>
              </View>
            ) : null}
            <Row label={copy.privacy} align={align} onPress={() => router.push('/site/privacy' as Href)} />
            <Row label={copy.terms} align={align} onPress={() => router.push('/site/terms' as Href)} />
            <Row label={copy.about} align={align} onPress={() => router.push('/site/about' as Href)} />
          </Section>

          <Text style={[styles.section, { textAlign: align }]}>{copy.social}</Text>
          <View style={styles.card}>
            <View style={styles.socials}>
              <Pressable style={styles.social} onPress={() => void Linking.openURL('https://instagram.com')}>
                <Text style={styles.socialText}>Instagram</Text>
              </Pressable>
              <Pressable style={styles.social} onPress={() => void Linking.openURL('https://facebook.com')}>
                <Text style={styles.socialText}>Facebook</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.section, { textAlign: align }]}>{copy.danger}</Text>
          <Pressable style={styles.danger} onPress={() => void signOut()}>
            <Text style={styles.dangerLabel}>{copy.signOut}</Text>
          </Pressable>
          <Pressable style={styles.danger} onPress={removeAccount}>
            <Text style={styles.dangerLabel}>{copy.delete}</Text>
            <Text style={styles.dangerHint}>{copy.deleteHint}</Text>
          </Pressable>

          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Text style={styles.footer}>{copy.made}</Text>
        </ScrollView>
        <AppTabBar active="profile" />
      </SafeAreaView>
    </View>
  );
}

function Section({ title, align, children }: { title: string; align: 'left' | 'right'; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={[styles.section, { textAlign: align }]}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ label, align, onPress }: { label: string; align: 'left' | 'right'; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.chevron}>{align === 'right' ? '‹' : '›'}</Text>
      <Text style={[styles.rowLabel, { textAlign: align }]}>{label}</Text>
    </Pressable>
  );
}

function Fact({ label, value, align }: { label: string; value: string; align: 'left' | 'right' }) {
  return (
    <View style={styles.fact}>
      <Text style={[styles.factLabel, { textAlign: align }]}>{label}</Text>
      <Text style={[styles.factValue, { textAlign: align }]}>{value}</Text>
    </View>
  );
}

function initials(name: string): string {
  const letters = name.trim().slice(0, 2).toUpperCase();
  return letters || '—';
}

function memberSince(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101413' },
  flex: { flex: 1 },
  page: { padding: 16, gap: 12, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rtl: { flexDirection: 'row-reverse' },
  bell: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#182235', borderWidth: 1, borderColor: '#26344a', alignItems: 'center', justifyContent: 'center' },
  bellKnob: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#f4f7fb' },
  bellBody: { width: 14, height: 10, marginTop: 1, borderWidth: 1.6, borderColor: '#f4f7fb', borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  bellLip: { width: 16, height: 2, marginTop: 1, borderRadius: 1, backgroundColor: '#f4f7fb' },
  title: { color: '#f4f7fb', fontSize: 32, fontWeight: '800' },
  block: { gap: 8 },
  section: { color: '#8e9bb0', fontSize: 13, fontWeight: '700' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#151918', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e8f8ef', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#159b60', fontSize: 18, fontWeight: '800' },
  who: { flex: 1, gap: 4 },
  name: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  role: { color: '#e8eeea', fontSize: 13 },
  status: { marginTop: 4, overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(25,169,103,0.16)', color: '#b7e7cc', fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4 },
  statusOff: { backgroundColor: '#3a1d1d', color: '#ffd0d0' },
  cardTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', paddingHorizontal: 16, paddingTop: 16 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  fact: { width: '47%', gap: 3 },
  factLabel: { color: '#c5d0cb', fontSize: 11, fontWeight: '700' },
  factValue: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  pointsChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff6e8', borderWidth: 1, borderColor: '#f3ddb8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  pointsDeemed: { backgroundColor: '#f4f6f9', borderColor: '#d5dde7' },
  pointsIcon: { width: 28, height: 28, borderRadius: 8, overflow: 'hidden', backgroundColor: '#ee9a45', color: '#ffffff', textAlign: 'center', lineHeight: 28, fontWeight: '800' },
  pointsCopy: { gap: 1 },
  pointsLabel: { color: '#a36a20', fontSize: 10, fontWeight: '700' },
  pointsValue: { color: '#c47b12', fontSize: 16, fontWeight: '800' },
  pointsUnit: { fontSize: 10, fontWeight: '700' },
  deemedHint: { color: '#c5d0cb', fontSize: 13, lineHeight: 18, paddingHorizontal: 16, paddingBottom: 14 },
  card: { backgroundColor: '#151918', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', paddingBottom: 8 },
  row: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#26344a' },
  chevron: { color: '#8e9bb0', fontSize: 22, width: 16 },
  rowLabel: { flex: 1, color: '#f4f7fb', fontSize: 16, fontWeight: '700' },
  langRow: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  langs: { flexDirection: 'row', gap: 8 },
  lang: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#3a465c' },
  langOn: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.16)' },
  langText: { color: '#f4f7fb', fontWeight: '700' },
  langTextOn: { color: '#d4af37' },
  passwordBox: { padding: 14, gap: 10 },
  save: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveLabel: { color: '#04140c', fontWeight: '800' },
  socials: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  social: { minWidth: 110, borderRadius: 12, backgroundColor: '#182235', paddingVertical: 10, alignItems: 'center' },
  socialText: { color: '#f4f7fb', fontWeight: '800' },
  danger: { backgroundColor: '#161c22', borderRadius: 18, borderWidth: 1, borderColor: '#3a1d24', padding: 16, gap: 4 },
  dangerLabel: { color: '#ff6b6b', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  dangerHint: { color: '#8e9bb0', textAlign: 'center' },
  info: { paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  infoLabel: { color: '#8e9bb0', fontSize: 12, fontWeight: '700' },
  infoValue: { color: '#f4f7fb', fontSize: 16, fontWeight: '700' },
  link: { color: '#d4af37', fontWeight: '800', padding: 14 },
  message: { color: '#f4f7fb', textAlign: 'center' },
  footer: { color: '#718098', textAlign: 'center', marginTop: 8 },
});
