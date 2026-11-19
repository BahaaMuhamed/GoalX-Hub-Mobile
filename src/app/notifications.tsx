import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { listNotices, type NoticeCard } from '@/api/feed';
import { AppTabBar } from '@/components/AppTabBar';
import { useWorkspace } from '@/workspace/WorkspaceContext';

export default function NotificationsScreen() {
  const workspace = useWorkspace();
  const [rows, setRows] = useState<NoticeCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listNotices()
      .then((next) => {
        if (active) setRows(next);
      })
      .catch(() => {
        if (active) setRows([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.back, { color: workspace.accent }]}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          {loading ? <ActivityIndicator color={workspace.accent} /> : null}
          {!loading && !rows.length ? <Text style={styles.empty}>No notifications yet.</Text> : null}
          {rows.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
            </View>
          ))}
        </ScrollView>
        <AppTabBar active={null} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101413' },
  flex: { flex: 1 },
  page: { padding: 16, gap: 12, paddingBottom: 28 },
  back: { fontWeight: '800', fontSize: 15 },
  title: { color: '#f4f7fb', fontSize: 32, fontWeight: '800' },
  empty: { color: '#8e9bb0', fontSize: 15 },
  card: { backgroundColor: '#182235', borderRadius: 16, borderWidth: 1, borderColor: '#26344a', padding: 14, gap: 6 },
  cardTitle: { color: '#f4f7fb', fontSize: 16, fontWeight: '800' },
  body: { color: '#8e9bb0', fontSize: 14, lineHeight: 20 },
});
