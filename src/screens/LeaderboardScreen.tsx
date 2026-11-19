import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { loadLeaderboard, type BoardEntry } from '@/api/training';
import { AppTabBar } from '@/components/AppTabBar';
import { ink } from '@/components/DirectoryChrome';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';

export function LeaderboardScreen() {
  const { lang, rtl } = useLocale();
  const ar = lang === 'ar';
  const [rows, setRows] = useState<BoardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const t = ar
    ? { title: 'الترتيب', hint: 'الترتيب العام من سجل النقاط', empty: 'الترتيب فارغ حتى تُمنح النقاط.', refresh: 'تحديث', pts: 'نقطة' }
    : { title: 'Leaderboard', hint: 'Global ranking from the points ledger', empty: 'Leaderboard is empty until points are awarded.', refresh: 'Refresh', pts: 'pts' };

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      setRows(await loadLeaderboard());
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load the leaderboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const podium = rows.slice(0, 3);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <View style={[styles.top, rtl && styles.reverse]}>
          <View style={styles.titles}>
            <Text style={[styles.title, rtl && styles.end]}>{t.title}</Text>
            <Text style={[styles.hint, rtl && styles.end]}>{t.hint}</Text>
          </View>
          <Pressable style={styles.refresh} onPress={() => void load()}>
            <Text style={styles.refreshText}>↻  {t.refresh}</Text>
          </Pressable>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading ? <ActivityIndicator color={ink.pink} /> : null}
        {podium.length >= 3 ? (
          <View style={styles.podium}>
            <Place entry={podium[1]} pts={t.pts} />
            <Place entry={podium[0]} pts={t.pts} first />
            <Place entry={podium[2]} pts={t.pts} />
          </View>
        ) : null}
        <View style={styles.card}>
          {!loading && !rows.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
          {rows.map((row) => (
            <View key={`${row.rank}-${row.playerId}`} style={styles.row}>
              <Text style={styles.rank}>{row.rank}</Text>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(row.name || 'PL').slice(0, 2).toUpperCase()}</Text></View>
              <View style={styles.grow}>
                <Text style={styles.name}>{row.name}</Text>
                <Text style={styles.hint}>{ar ? 'لاعب' : 'Player'}</Text>
              </View>
              <Text style={styles.score}>{row.score}</Text>
              <Text style={styles.hint}>{t.pts}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

function Place({ entry, pts, first }: { entry: BoardEntry; pts: string; first?: boolean }) {
  return (
    <View style={[styles.place, first && styles.first]}>
      <Text style={styles.rank}>{entry.rank}</Text>
      <Text style={styles.name}>{entry.name}</Text>
      <Text style={styles.hint}>{entry.score} {pts}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  reverse: { flexDirection: 'row-reverse' },
  titles: { flex: 1, gap: 4 },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13 },
  end: { textAlign: 'right' },
  refresh: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: '#1c2422',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: { color: ink.text, fontSize: 12, fontWeight: '800' },
  notice: { color: '#ffd1dc' },
  card: { backgroundColor: ink.card, borderRadius: 16, borderWidth: 1, borderColor: ink.line, padding: 8 },
  empty: { color: ink.muted, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: ink.line },
  rank: { width: 28, color: ink.text, fontWeight: '800', fontSize: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#243028', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#b7e7cc', fontWeight: '800', fontSize: 12 },
  grow: { flex: 1 },
  name: { color: ink.text, fontWeight: '800' },
  score: { color: '#8ee0b0', fontWeight: '800', fontSize: 16 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  place: { flex: 1, backgroundColor: ink.card, borderRadius: 14, borderWidth: 1, borderColor: ink.line, padding: 10, alignItems: 'center', gap: 4, minHeight: 110 },
  first: { minHeight: 140, borderColor: ink.pink },
});
