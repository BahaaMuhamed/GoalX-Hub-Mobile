import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listBranches, loadDashboard, type BranchOption, type DashPlayer, type DashSession, type DashSnapshot } from '@/api/dashboard';
import { listAdvertisements, listNotices, type AdCard } from '@/api/feed';
import { useAuth } from '@/auth/AuthContext';
import { AdBanner } from '@/components/AdBanner';
import { AppTabBar } from '@/components/AppTabBar';
import { ModuleTree } from '@/components/ModuleTree';
import { BrandMark } from '@/components/BrandMark';
import { colors, onColor, spacing } from '@/theme';
import { useWorkspace } from '@/workspace/WorkspaceContext';
import { allowsScreen, screensFor } from '@/workspace/navigation';

const empty: DashSnapshot = { players: [], today: [], upcoming: [], catalogCount: 0 };

export default function HomeScreen() {
  const { profile } = useAuth();
  const workspace = useWorkspace();
  const role = profile?.role ?? '';
  const canShop = allowsScreen(role, workspace.hidden, 'marketplace');
  const academyOptions = workspace.academies.length
    ? workspace.academies.map((item) => ({ id: item.id, name: item.name || 'Academy' }))
    : [{ id: workspace.organizationId, name: workspace.brandName }];
  const [academyId, setAcademyId] = useState('');
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState('');
  const [openList, setOpenList] = useState<'academy' | 'branch' | null>(null);
  const [data, setData] = useState<DashSnapshot>(empty);
  const [loading, setLoading] = useState(false);
  const [noticeCount, setNoticeCount] = useState(0);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [ads, setAds] = useState<AdCard[]>([]);
  const staff = role !== 'PLAYER' && role !== 'FREE_PLAYER' && role !== 'ACCOUNTANT';
  const accent = workspace.accent || colors.green;
  const ink = onColor(accent);
  const name = profile?.username || profile?.email.split('@')[0] || 'there';

  useEffect(() => {
    const first = workspace.academies[0]?.id || workspace.organizationId;
    if (!first) return;
    setAcademyId((current) => {
      const known = workspace.academies.some((item) => item.id === current);
      return known ? current : first;
    });
  }, [workspace.academies, workspace.organizationId]);

  useEffect(() => {
    let active = true;
    listBranches(workspace.academies.length ? academyId : '', workspace.organizationId || academyId).then((rows) => {
      if (!active) return;
      setBranches(rows);
      setBranchId((current) => (rows.some((item) => item.id === current) ? current : rows[0]?.id || ''));
    });
    return () => {
      active = false;
    };
  }, [academyId, workspace.academies.length, workspace.organizationId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadDashboard(branchId, workspace.organizationId));
    } finally {
      setLoading(false);
    }
  }, [branchId, workspace.organizationId]);

  useEffect(() => {
    if (!workspace.ready) return;
    void refresh();
  }, [refresh, workspace.ready]);

  useEffect(() => {
    let active = true;
    listAdvertisements()
      .then((rows) => {
        if (active) setAds(rows);
      })
      .catch(() => {
        if (active) setAds([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    listNotices()
      .then((rows) => {
        if (active) setNoticeCount(rows.length);
      })
      .catch(() => {
        if (active) setNoticeCount(0);
      });
    return () => {
      active = false;
    };
  }, []);

  const academyName = academyOptions.find((item) => item.id === academyId)?.name || workspace.brandName;
  const branchName = branches.find((item) => item.id === branchId)?.name || 'Select branch';
  const pages = screensFor(role, workspace.hidden).filter((item) => item.path !== 'dashboard');
  const query = search.trim().toLowerCase();
  const matches = query ? pages.filter((item) => item.label.toLowerCase().includes(query)) : pages;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.header}>
            <BrandMark size={48} uri={workspace.logoUri} />
            <View style={styles.identity}>
              <Text style={styles.brand} numberOfLines={1}>{workspace.brandName}</Text>
              <Text style={styles.role}>{roleLabel(role)}</Text>
            </View>
            {canShop ? (
              <Pressable accessibilityLabel="Marketplace" style={styles.iconButton} onPress={() => router.push('/marketplace' as Href)}>
                <BagIcon />
              </Pressable>
            ) : null}
            <Pressable accessibilityLabel="Notifications" style={styles.iconButton} onPress={() => router.push('/notifications' as Href)}>
              <BellIcon />
              {noticeCount > 0 ? <View style={[styles.badge, { backgroundColor: accent }]} /> : null}
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.search}>
              <SearchIcon />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search"
                placeholderTextColor="#8e9bb0"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <Pressable
              accessibilityLabel="Choose a page"
              style={styles.iconButton}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <DotsIcon />
            </Pressable>
          </View>

          {menuOpen || query ? (
            <View style={styles.menuCard}>
              {matches.length ? (
                <ModuleTree
                  screens={matches}
                  accent={accent}
                  forceOpen={Boolean(query)}
                  onOpen={() => {
                    setMenuOpen(false);
                    setSearch('');
                  }}
                />
              ) : (
                <Text style={styles.muted}>No page matches that search.</Text>
              )}
            </View>
          ) : null}

          <AdBanner ads={ads} accent={accent} />

          {staff ? <View style={styles.filters}>
            <Filter
              label="Academy"
              value={academyName}
              open={openList === 'academy'}
              options={academyOptions}
              onToggle={() => setOpenList((current) => (current === 'academy' ? null : 'academy'))}
              onPick={(id) => {
                setAcademyId(id);
                setOpenList(null);
              }}
            />
            <Filter
              label="Branch"
              value={branchName}
              open={openList === 'branch'}
              options={branches}
              onToggle={() => setOpenList((current) => (current === 'branch' ? null : 'branch'))}
              onPick={(id) => {
                setBranchId(id);
                setOpenList(null);
              }}
            />
          </View> : null}
          <View style={styles.actionsRow}>
            <Pressable style={[styles.primary, { backgroundColor: accent }]} onPress={() => void refresh()}>
              <Text style={[styles.primaryLabel, { color: ink }]}>Load branch</Text>
            </Pressable>
            <Pressable style={[styles.primary, { backgroundColor: accent }]} onPress={() => void refresh()}>
              <Text style={[styles.primaryLabel, { color: ink }]}>↻  Refresh</Text>
            </Pressable>
          </View>

          <Text style={styles.hello}>Good afternoon, {name} 👋</Text>
          <Text style={styles.lead}>{roleLead(role)}</Text>

          {loading ? <ActivityIndicator color={accent} /> : null}

          {staff ? (
            <View style={styles.stats}>
              <Stat title="Total Players" value={String(data.players.length)} hint="Current branch roster" mark="★" markColor="#25c879" tint="#14392c" />
              <Stat title="Training Sessions" value={String(data.upcoming.length)} hint="Scheduled for this branch" mark="◈" markColor="#7eb6ff" tint="#16243a" />
              <Stat title="Marketplace" value={String(data.catalogCount)} hint="Active catalogue items" mark="◆" markColor="#c4b5fd" tint="#2a2140" />
            </View>
          ) : null}

          <ActionCard role={role} accent={accent} ink={ink} />

          {staff ? (
            <>
              <Section title="Training today" link="View all" onPress={() => router.push('/screens/training' as Href)}>
                {data.today.length ? data.today.map((item) => <SessionRow key={item.id} item={item} mode="today" />) : <Text style={styles.muted}>No sessions today.</Text>}
              </Section>
              <Section title="Upcoming Training" link="View all" onPress={() => router.push('/screens/training' as Href)}>
                {data.upcoming.length ? data.upcoming.map((item) => <SessionRow key={item.id} item={item} mode="upcoming" />) : <Text style={styles.muted}>No upcoming sessions for this branch.</Text>}
              </Section>
              <Section title="Top Players" hint="Points balance from the ledger" link="View all" onPress={() => router.push('/screens/leaderboard' as Href)}>
                {data.players.length ? data.players.slice(0, 5).map((player, index) => <PlayerRow key={player.id} player={player} rank={index + 1} />) : <Text style={styles.muted}>No players in this branch yet.</Text>}
              </Section>
            </>
          ) : null}
        </ScrollView>
        <AppTabBar active="home" />
      </SafeAreaView>
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <View style={styles.searchGlass} />
      <View style={styles.searchHandle} />
    </View>
  );
}

function DotsIcon() {
  return (
    <View style={styles.dotsIcon}>
      <View style={styles.dotMark} />
      <View style={styles.dotMark} />
      <View style={styles.dotMark} />
    </View>
  );
}

function Filter({
  label,
  value,
  open,
  options,
  onToggle,
  onPick,
}: {
  label: string;
  value: string;
  open: boolean;
  options: { id: string; name: string }[];
  onToggle: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <View style={styles.filter}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable style={styles.select} onPress={onToggle}>
        <Text style={styles.selectValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          {options.filter((item) => item.id).map((item) => (
            <Pressable key={item.id} style={styles.menuItem} onPress={() => onPick(item.id)}>
              <Text style={styles.menuText}>{item.name}</Text>
            </Pressable>
          ))}
          {!options.filter((item) => item.id).length ? <Text style={styles.menuText}>None yet</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function Stat({ title, value, hint, mark, markColor, tint }: { title: string; value: string; hint: string; mark: string; markColor: string; tint: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Text style={[styles.statMark, { color: markColor }]}>{mark}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function ActionCard({ role, accent, ink }: { role: string; accent: string; ink: string }) {
  const actions = actionsFor(role);
  if (!actions.length) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{actionTitle(role)}</Text>
      <Text style={styles.muted}>Shortcuts for this role</Text>
      <View style={styles.actionWrap}>
        {actions.map((item, index) => (
          <Pressable
            key={item.label}
            style={[styles.action, index === 0 ? { backgroundColor: accent, borderColor: accent } : null]}
            onPress={() => router.push(item.href)}
          >
            <Text style={[styles.actionLabel, index === 0 ? { color: ink } : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Section({
  title,
  hint,
  link,
  onPress,
  children,
}: {
  title: string;
  hint?: string;
  link: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{title}</Text>
          {hint ? <Text style={styles.muted}>{hint}</Text> : null}
        </View>
        <Pressable onPress={onPress}>
          <Text style={styles.link}>{link}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function SessionRow({ item, mode }: { item: DashSession; mode: 'today' | 'upcoming' }) {
  const title = mode === 'today' ? `${item.groupName} · ${item.range}` : `${item.groupName} · ${item.day}`;
  const detail = mode === 'today'
    ? [item.coach, item.methodology].filter(Boolean).join(' · ')
    : [item.range, item.location, item.methodology].filter(Boolean).join(' · ');
  return (
    <Pressable style={styles.session} onPress={() => router.push('/screens/training' as Href)}>
      <View style={styles.flex}>
        <Text style={styles.sessionTitle}>{title}</Text>
        <Text style={styles.muted}>{detail}</Text>
      </View>
      <Text style={styles.status}>{item.status}</Text>
    </Pressable>
  );
}

function PlayerRow({ player, rank }: { player: DashPlayer; rank: number }) {
  return (
    <View style={styles.player}>
      <Text style={styles.rank}>{rank}</Text>
      {player.photoUrl ? (
        <Image source={{ uri: player.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{player.name.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.flex}>
        <Text style={styles.sessionTitle}>{player.name}</Text>
        <Text style={styles.muted}>{player.position || 'Player'}</Text>
      </View>
      <Text style={styles.points}>{player.points}</Text>
    </View>
  );
}

function actionsFor(role: string): { label: string; href: Href }[] {
  if (role === 'SUPER_ADMIN' || role === 'PLATFORM_EMPLOYEE') {
    return [
      { label: 'Academies', href: '/screens/organizations' },
      { label: 'Users', href: '/screens/users' },
      { label: 'Branches & Groups', href: '/screens/groups' },
    ];
  }
  if (role === 'ORGANIZATION_ADMIN' || role === 'ADMIN') {
    return [
      { label: 'Create coaches & players', href: '/screens/users' },
      { label: 'Players', href: '/screens/players' },
      { label: 'Branches & Groups', href: '/screens/groups' },
    ];
  }
  if (role === 'ADMINISTRATIVE') {
    return [
      { label: 'Scan attendance', href: '/screens/scan-attendance' },
      { label: 'Branches & Groups', href: '/screens/groups' },
      { label: 'Players', href: '/screens/players' },
      { label: 'Training', href: '/screens/training' },
      { label: 'Attendance', href: '/screens/attendance' },
    ];
  }
  if (role === 'COACH') {
    return [
      { label: 'Scan attendance', href: '/screens/scan-attendance' },
      { label: 'Training', href: '/screens/training' },
      { label: 'Attendance', href: '/screens/attendance' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Leaderboard', href: '/screens/leaderboard' },
    ];
  }
  if (role === 'PLAYER') {
    return [
      { label: 'Scan attendance', href: '/screens/scan-attendance' },
      { label: 'My training', href: '/screens/my-training' },
      { label: 'Attendance', href: '/screens/attendance' },
      { label: 'Ranking', href: '/screens/leaderboard' },
      { label: 'Marketplace', href: '/marketplace' },
    ];
  }
  if (role === 'FREE_PLAYER') {
    return [
      { label: 'My training', href: '/screens/my-training' },
      { label: 'Attendance', href: '/screens/attendance' },
      { label: 'Ranking', href: '/screens/leaderboard' },
      { label: 'Marketplace', href: '/marketplace' },
    ];
  }
  return [];
}

function actionTitle(role: string): string {
  if (role === 'COACH') return 'Coach actions';
  if (role === 'PLAYER' || role === 'FREE_PLAYER') return 'Player actions';
  if (role === 'ADMINISTRATIVE') return 'Administrative actions';
  return 'Admin actions';
}

function roleLabel(role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'ORGANIZATION_ADMIN':
      return 'Academy admin';
    case 'COACH':
      return 'Coach';
    case 'ADMINISTRATIVE':
      return 'Administrative';
    case 'PLAYER':
      return 'Player';
    case 'SUPER_ADMIN':
      return 'Platform admin';
    default:
      return role ? role.split('_').join(' ') : 'Account';
  }
}

function BellIcon() {
  return (
    <View style={styles.bell}>
      <View style={styles.bellKnob} />
      <View style={styles.bellBody} />
      <View style={styles.bellLip} />
      <View style={styles.bellClapper} />
    </View>
  );
}

function BagIcon() {
  return (
    <View style={styles.bag}>
      <View style={styles.bagHandle} />
      <View style={styles.bagBody} />
    </View>
  );
}

function roleLead(role: string): string {
  if (role === 'ORGANIZATION_ADMIN' || role === 'ADMIN') {
    return 'Academy admin: manage users, players, groups, and branches in your organization only.';
  }
  if (role === 'COACH') return 'Your sessions, QR attendance, marketplace, and training approval.';
  if (role === 'ADMINISTRATIVE') return 'Run branches, groups, players, and training. The coach approves a finished session.';
  if (role === 'PLAYER' || role === 'FREE_PLAYER') return 'Your attendance, ranking, marketplace rewards, and profile.';
  if (role === 'SUPER_ADMIN' || role === 'PLATFORM_EMPLOYEE') return 'Super Admin: create academies, activate or deactivate them, and create organization admins.';
  return 'Your academy workspace.';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101413' },
  flex: { flex: 1 },
  page: { padding: spacing.md, gap: 14, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  identity: { flex: 1 },
  brand: { color: colors.text, fontSize: 18, fontWeight: '800' },
  role: { color: colors.muted, fontSize: 13 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#182235',
    borderWidth: 1,
    borderColor: '#26344a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  bell: { width: 18, height: 18, alignItems: 'center' },
  bellKnob: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#f4f7fb' },
  bellBody: {
    width: 12,
    height: 9,
    marginTop: -1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderWidth: 1.6,
    borderColor: '#f4f7fb',
  },
  bellLip: { width: 16, height: 2, borderRadius: 1, backgroundColor: '#f4f7fb', marginTop: 1 },
  bellClapper: { width: 4, height: 3, marginTop: 1, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: '#f4f7fb' },
  bag: { width: 18, height: 18, alignItems: 'center', justifyContent: 'flex-end' },
  bagHandle: { width: 8, height: 5, borderWidth: 1.6, borderBottomWidth: 0, borderColor: '#f4f7fb', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  bagBody: { width: 14, height: 10, marginTop: -1, borderWidth: 1.6, borderColor: '#f4f7fb', borderRadius: 3 },
  filters: { flexDirection: 'row', gap: 10 },
  filter: { flex: 1, gap: 6 },
  filterLabel: { color: colors.faint, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  select: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26344a',
    backgroundColor: '#182235',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectValue: { flex: 1, color: colors.text, fontWeight: '700' },
  chevron: { color: colors.muted },
  menu: { borderRadius: 12, borderWidth: 1, borderColor: '#26344a', backgroundColor: '#101827', overflow: 'hidden' },
  menuItem: { paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { color: colors.text, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  primary: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  primaryLabel: { fontWeight: '800' },
  hello: { color: colors.text, fontSize: 28, fontWeight: '800' },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -8 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: '#182235', borderRadius: 16, borderWidth: 1, borderColor: '#26344a', padding: 12, gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statMark: { color: colors.greenBright, fontSize: 16, fontWeight: '800' },
  statTitle: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statHint: { color: colors.greenBright, fontSize: 11 },
  card: { backgroundColor: '#161c22', borderRadius: 16, borderWidth: 1, borderColor: '#26344a', padding: 14, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  link: { color: colors.greenBright, fontWeight: '700' },
  actionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  action: { borderRadius: 12, borderWidth: 1, borderColor: '#3a465c', paddingHorizontal: 12, paddingVertical: 10 },
  actionLabel: { color: colors.text, fontWeight: '800' },
  session: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  sessionTitle: { color: colors.text, fontWeight: '700' },
  status: { color: colors.greenBright, fontSize: 11, fontWeight: '800', borderWidth: 1, borderColor: colors.green, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  player: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rank: { color: colors.text, fontWeight: '800', width: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#243044', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontWeight: '800' },
  points: { color: colors.text, fontWeight: '800' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: '#182235',
    borderWidth: 1,
    borderColor: '#26344a',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 8 },
  searchIcon: { width: 16, height: 16 },
  searchGlass: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.6, borderColor: '#8e9bb0' },
  searchHandle: { position: 'absolute', width: 6, height: 1.6, backgroundColor: '#8e9bb0', right: 0, bottom: 2, transform: [{ rotate: '45deg' }] },
  dotsIcon: { height: 16, justifyContent: 'space-between' },
  dotMark: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#f4f7fb' },
  menuCard: { backgroundColor: '#161c22', borderRadius: 16, borderWidth: 1, borderColor: '#26344a', padding: 8, gap: 2 },
});
