import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { loadLeaderboard, loadLeaderboardProfiles, type BoardEntry, type BoardProfile } from '@/api/training';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

type Ranked = BoardEntry & {
  subtitle: string;
  jersey: string;
  photoUrl: string | null;
};

const lime = '#d6ff3e';
const ink = '#f4f7fb';
const muted = '#8b93a7';
const bg = '#070b12';

export function LeaderboardScreen() {
  const { lang, rtl } = useLocale();
  const ar = lang === 'ar';
  const workspace = useWorkspace();
  const [rows, setRows] = useState<Ranked[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const t = ar
    ? {
        title: 'الترتيب',
        updated: 'آخر تحديث',
        empty: 'الترتيب فارغ حتى تُمنح النقاط.',
        player: 'لاعب',
        places: ['الأول', 'الثاني', 'الثالث'],
      }
    : {
        title: 'Rank',
        updated: 'Last Updated',
        empty: 'Leaderboard is empty until points are awarded.',
        player: 'Player',
        places: ['1st', '2nd', '3rd'],
      };

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const [board, profiles] = await Promise.all([
        loadLeaderboard(),
        loadLeaderboardProfiles(workspace.organizationId),
      ]);
      const byId = new Map(profiles.map((profile) => [profile.playerId, profile]));
      setRows(board.map((entry) => merge(entry, byId.get(entry.playerId), t.player)));
      setUpdatedAt(new Date());
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load the leaderboard'));
    } finally {
      setLoading(false);
    }
  }, [t.player, workspace.organizationId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading && rows.length > 0} onRefresh={() => void load()} tintColor={lime} />}
      >
        <ScreenBack />
        <Text style={[styles.title, ar && styles.end]}>{t.title}</Text>
        {updatedAt ? <Text style={[styles.updated, ar && styles.end]}>{t.updated}: {stamp(updatedAt, ar)}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading && !rows.length ? <ActivityIndicator color={lime} style={styles.spinner} /> : null}

        {first ? (
          <View style={styles.podium}>
            {second ? <Podium entry={second} label={t.places[1]} ring="#d5dce4" featured={false} /> : <View style={styles.podiumGap} />}
            <Podium entry={first} label={t.places[0]} ring="#f0c14a" featured />
            {third ? <Podium entry={third} label={t.places[2]} ring="#e8b4a8" featured={false} /> : <View style={styles.podiumGap} />}
          </View>
        ) : null}

        {!loading && !rows.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
        <View style={styles.list}>
          {rows.map((row) => (
            <View key={`${row.rank}-${row.playerId}`} style={[styles.row, rtl && styles.reverse]}>
              <View style={[styles.badge, badgeTone(row.rank)]}>
                <Text style={[styles.badgeText, badgeTextTone(row.rank)]}>{String(row.rank).padStart(2, '0')}</Text>
              </View>
              <Face name={row.name} uri={row.photoUrl} size={42} />
              <View style={styles.grow}>
                <Text style={[styles.rowName, ar && styles.end]} numberOfLines={1}>{row.name}</Text>
                <Text style={[styles.rowSub, ar && styles.end]} numberOfLines={1}>{row.subtitle}</Text>
              </View>
              {row.jersey ? (
                <View style={styles.level}>
                  <Text style={styles.levelText}>{row.jersey}</Text>
                </View>
              ) : null}
              <Text style={styles.xp}>{row.score} XP</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

function Podium({ entry, label, ring, featured }: { entry: Ranked; label: string; ring: string; featured: boolean }) {
  const size = featured ? 86 : 68;
  return (
    <View style={[styles.place, featured && styles.placeFirst]}>
      <Text style={styles.placeLabel}>{label}</Text>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: ring }]}>
        <Face name={entry.name} uri={entry.photoUrl} size={size - 8} />
      </View>
      <Text style={styles.placeName} numberOfLines={2}>{entry.name}</Text>
      <Text style={styles.placeSub} numberOfLines={1}>{entry.subtitle}</Text>
      <Text style={[styles.placeXp, featured && styles.placeXpFirst]}>{entry.score} XP</Text>
    </View>
  );
}

function Face({ name, uri, size }: { name: string; uri: string | null; size: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (uri && !failed) {
    return <Image source={{ uri }} style={style} onError={() => setFailed(true)} />;
  }
  return (
    <View style={[styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

function merge(entry: BoardEntry, profile: BoardProfile | undefined, fallback: string): Ranked {
  return {
    ...entry,
    name: entry.name && entry.name !== 'Player' ? entry.name : profile?.name || entry.name,
    subtitle: profile?.subtitle || fallback,
    jersey: profile?.jersey || '',
    photoUrl: profile?.photoUrl || null,
  };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  return letters || 'PL';
}

function badgeTone(rank: number) {
  if (rank === 1) return styles.badgeGold;
  if (rank === 2) return styles.badgeGreen;
  return styles.badgeDark;
}

function badgeTextTone(rank: number) {
  if (rank === 1) return styles.badgeGoldText;
  if (rank === 2) return styles.badgeGreenText;
  return styles.badgeDarkText;
}

function stamp(date: Date, ar: boolean): string {
  if (ar) {
    return date.toLocaleString('ar', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  }
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${ordinal(day)} ${months[date.getMonth()]}, ${hour}:${minute}`;
}

function ordinal(day: number): string {
  const mod = day % 100;
  if (mod >= 11 && mod <= 13) return `${day}th`;
  if (day % 10 === 1) return `${day}st`;
  if (day % 10 === 2) return `${day}nd`;
  if (day % 10 === 3) return `${day}rd`;
  return `${day}th`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: bg },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  title: { color: lime, fontSize: 34, fontWeight: '800', letterSpacing: 0.2 },
  updated: { color: muted, fontSize: 13, marginTop: -8 },
  end: { textAlign: 'right' },
  notice: { color: '#ffb4b4', fontSize: 13 },
  spinner: { marginTop: 24 },
  empty: { color: muted, textAlign: 'center', padding: 20 },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#101c33',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 4,
  },
  podiumGap: { flex: 1 },
  place: { flex: 1, alignItems: 'center', gap: 6, paddingTop: 22 },
  placeFirst: { paddingTop: 0 },
  placeLabel: { color: '#9aa3b5', fontSize: 13, fontWeight: '700' },
  ring: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18243c' },
  placeName: { color: ink, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  placeSub: { color: muted, fontSize: 11, textAlign: 'center' },
  placeXp: { color: lime, fontSize: 14, fontWeight: '800' },
  placeXpFirst: { fontSize: 16 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#121826',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  reverse: { flexDirection: 'row-reverse' },
  badge: { width: 44, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 14, fontWeight: '800' },
  badgeGold: { backgroundColor: '#e4be4a' },
  badgeGoldText: { color: '#1c1604' },
  badgeGreen: { backgroundColor: '#3ccb6c' },
  badgeGreenText: { color: '#06210f' },
  badgeDark: { backgroundColor: '#242b3a' },
  badgeDarkText: { color: ink },
  grow: { flex: 1, gap: 2 },
  rowName: { color: ink, fontSize: 15, fontWeight: '800' },
  rowSub: { color: muted, fontSize: 12 },
  level: {
    minWidth: 36,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#1c2433',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { color: '#d5dbe8', fontSize: 12, fontWeight: '800' },
  xp: { color: lime, fontSize: 14, fontWeight: '800' },
  fallback: { backgroundColor: '#24324c', alignItems: 'center', justifyContent: 'center' },
  initials: { color: ink, fontWeight: '800' },
});
