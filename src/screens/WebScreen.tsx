import { router, type Href } from 'expo-router';
import { AppTabBar, tabForScreen } from '@/components/AppTabBar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';

import { Banner } from '@/components/Banner';
import { ScreenBack } from '@/components/ScreenBack';
import { RecordGrid } from '@/components/RecordGrid';
import { colors, spacing } from '@/theme';
import { useWorkspace } from '@/workspace/WorkspaceContext';
import { endpointFor, screensFor } from '@/workspace/navigation';
import { presentResponse, type ScreenPayload } from '@/workspace/present';

const HINTS: Record<string, string> = {
  dashboard: 'Players, sessions, and the marketplace catalogue for the academy you selected.',
  profile: 'The signed-in account, from the same profile response as the website.',
  organizations: 'Academies on the platform: name, username, contact, and status.',
  users: 'Staff and player accounts for the selected academy.',
  'my-teams': 'Groups assigned to you.',
  players: 'The academy roster.',
  training: 'Training sessions for the selected academy.',
  'training/methodologies': 'Training methodologies.',
  'training/schedules': 'The weekly training schedule.',
  'training/activity-types': 'Activity types used in methodologies.',
  'my-training': 'Your upcoming and completed sessions.',
  'ai-global': 'The same player agent routes the website uses for food, training, and fitness plans.',
  leaderboard: 'Ranking for the platform, or this academy’s weekly board.',
  groups: 'Branches and groups.',
  competitions: 'Competitions for the selected academy.',
  'competitions/league': 'Seasons and the league table source.',
  'competitions/results': 'Season results use the same season list as the website.',
  attendance: 'Attendance records.',
  'staff-attendance': 'Staff check-in report.',
  'training/approvals': 'Sessions waiting for approval.',
  marketplace: 'Marketplace items.',
  'settings/marketplace': 'Platform marketplace catalogue.',
  'settings/advertisements': 'Platform advertisements.',
  settings: 'Point rules for the selected academy. Choose an academy first.',
  'platform-configuration': 'Screen access for each academy.',
  'finance/dashboard': 'Finance totals for the selected academy.',
  'finance/invoices': 'Invoices.',
  'finance/subscriptions': 'Subscriptions.',
  'finance/payments': 'Payments.',
  'finance/outstanding': 'Outstanding balances.',
  'finance/expenses': 'Expenses.',
  'finance/refunds': 'Refunds.',
  'finance/transactions': 'Transactions.',
  'finance/reports': 'Finance reports.',
};

const AGENT_ROUTES = [
  { method: 'POST', path: '/players/me/agent/food' },
  { method: 'POST', path: '/players/me/agent/training' },
  { method: 'POST', path: '/players/me/agent/fitness' },
];

type Stat = { label: string; value: string };

function countOf(payload: unknown): number {
  if (Array.isArray(payload)) return payload.length;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const list = Object.values(record).find(Array.isArray);
    if (Array.isArray(list)) return list.length;
  }
  return 0;
}

export function WebScreen({ path }: { path: string }) {
  const { width } = useWindowDimensions();
  const { profile, signOut } = useAuth();
  const workspace = useWorkspace();
  const role = profile?.role ?? '';
  const screen = screensFor(role, workspace.hidden).find((item) => item.path === path);
  const title = screen?.label ?? 'Screen';
  const [query, setQuery] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [data, setData] = useState<ScreenPayload>({ summary: [], rows: [] });
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const requestPath = endpointFor(path, workspace.organizationId, role);
    setEndpoint(requestPath || 'POST /players/me/agent');
    setLoading(true);
    setError('');
    try {
      if (path === 'dashboard') {
        const org = workspace.organizationId;
        const [players, sessions, rewards, approvals] = await Promise.all([
          apiRequest(org ? `/players?organizationId=${org}` : '/organizations', { auth: true }).catch(() => []),
          apiRequest(org ? `/training?organizationId=${org}` : '/rewards/catalog', { auth: true }).catch(() => []),
          apiRequest('/rewards/catalog', { auth: true }).catch(() => []),
          apiRequest('/trainings/approval-summary', { auth: true }).catch(() => null),
        ]);
        const pending =
          approvals && typeof approvals === 'object' && 'pendingApproval' in approvals
            ? String((approvals as { pendingApproval: unknown }).pendingApproval)
            : '0';
        setStats([
          { label: org ? 'Players' : 'Academies', value: String(countOf(players)) },
          { label: org ? 'Sessions' : 'Catalogue', value: String(countOf(sessions)) },
          { label: 'Marketplace', value: String(countOf(rewards)) },
          { label: 'Pending approvals', value: pending },
        ]);
        setData(presentResponse(players));
        return;
      }
      if (!requestPath) {
        setStats([]);
        setData(presentResponse(AGENT_ROUTES));
        return;
      }
      let payload: unknown = await apiRequest(requestPath, { auth: true });
      if (path === 'attendance' && role === 'PLAYER' && payload && typeof payload === 'object' && 'id' in payload) {
        const playerId = String((payload as { id: string }).id);
        payload = await apiRequest(`/attendance/player/${playerId}`, { auth: true });
        setEndpoint(`/attendance/player/${playerId}`);
      }
      setStats([]);
      setData(presentResponse(payload));
    } catch (caught) {
      setData({ summary: [], rows: [] });
      setStats([]);
      setError(errorMessage(caught, 'This screen could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [path, role, workspace.organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const needle = query.trim().toLowerCase();
  const rows = needle
    ? data.rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
    : data.rows;
  const shortcuts = screensFor(role, workspace.hidden).filter((item) => item.path !== 'dashboard').slice(0, 6);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingHorizontal: width < 380 ? spacing.md : spacing.lg }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.greenBright} />}
      >
        <View style={styles.frame}>
          <View style={styles.top}>
            <ScreenBack />
            <Text style={styles.crumb}>{workspace.brandName}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {path === 'profile' ? (
            <Pressable onPress={() => signOut()}>
              <Text style={styles.backLabel}>Sign out</Text>
            </Pressable>
          ) : null}
          <Text style={styles.hint}>{HINTS[path] ?? 'Same data the website shows for this page.'}</Text>
          <Text style={styles.endpoint}>{endpoint.startsWith('POST') ? endpoint : `GET ${endpoint}`}</Text>

          {path === 'dashboard' && stats.length ? (
            <View style={styles.stats}>
              {stats.map((stat) => (
                <View key={stat.label} style={[styles.stat, width >= 700 && styles.statWide]}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {path === 'dashboard' ? (
            <View style={styles.shortcuts}>
              {shortcuts.map((item) => (
                <Pressable key={item.path} style={styles.shortcut} onPress={() => router.push(`/screens/${item.path}` as Href)}>
                  <Text style={styles.shortcutLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search this screen"
              placeholderTextColor={colors.faint}
              style={styles.search}
            />
          )}

          {error ? <Banner message={error} /> : null}
          {loading && !rows.length ? <ActivityIndicator color={colors.greenBright} /> : null}
          {!loading && !error && rows.length === 0 ? <Text style={styles.empty}>No records in this response.</Text> : null}
          {!error && rows.length ? <RecordGrid data={{ summary: needle ? [{ label: 'Matches', value: String(rows.length) }] : data.summary, rows }} /> : null}
        </View>
      </ScrollView>
      <AppTabBar active={tabForScreen(path)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { paddingVertical: spacing.lg },
  frame: { width: '100%', maxWidth: 1040, alignSelf: 'center', gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 36, justifyContent: 'center' },
  backLabel: { color: colors.gold, fontSize: 15, fontWeight: '700' },
  crumb: { color: colors.muted, fontSize: 13, flex: 1, textAlign: 'right' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  endpoint: { color: colors.faint, fontSize: 12 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: {
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 4,
  },
  statWide: { maxWidth: '24%' },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 13 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shortcut: {
    borderRadius: 999,
    backgroundColor: colors.cardRaised,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shortcutLabel: { color: colors.text, fontWeight: '700' },
  search: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  empty: { color: colors.muted, fontSize: 15 },
});
