import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';
import { screensFor } from '@/workspace/navigation';

export type TabId = 'home' | 'training' | 'news' | 'marketplace' | 'profile';

type Tab = { id: TabId; label: string; href: string };

export function AppTabBar({ active }: { active: TabId | null }) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const workspace = useWorkspace();
  const role = profile?.role ?? '';
  const screens = screensFor(role, workspace.hidden);
  const training = screens.find((item) => item.path === 'my-training') ?? screens.find((item) => item.path === 'training');
  const tabs: Tab[] = [
    { id: 'home', label: 'Home', href: '/home' },
    ...(training ? [{ id: 'training' as const, label: 'Training', href: `/screens/${training.path}` }] : []),
    { id: 'news' as const, label: 'News', href: '/news' },
    { id: 'marketplace' as const, label: 'Marketplace', href: '/marketplace' },
    { id: 'profile', label: 'Profile', href: '/profile' },
  ];

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8), borderTopColor: '#26344a' }]}>
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <Pressable key={tab.id} style={styles.tab} onPress={() => router.replace(tab.href as Href)}>
            <View style={[styles.iconWrap, on && { backgroundColor: workspace.accent }]}>
              <TabGlyph id={tab.id} color={on ? '#ffffff' : '#8e9bb0'} />
            </View>
            <Text style={[styles.label, { color: on ? workspace.accent : '#8e9bb0' }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function tabForScreen(path: string): TabId | null {
  if (path === 'profile') return 'profile';
  if (path === 'marketplace') return 'marketplace';
  if (path === 'training' || path === 'my-training' || path.startsWith('training/')) return 'training';
  return null;
}

function TabGlyph({ id, color }: { id: TabId; color: string }) {
  if (id === 'home') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.roof, { borderBottomColor: color }]} />
        <View style={[styles.house, { borderColor: color }]} />
      </View>
    );
  }
  if (id === 'training') {
    return (
      <View style={[styles.cal, { borderColor: color }]}>
        <View style={[styles.calTop, { backgroundColor: color }]} />
      </View>
    );
  }
  if (id === 'news') {
    return (
      <View style={[styles.news, { borderColor: color }]}>
        <View style={[styles.newsLine, { backgroundColor: color }]} />
        <View style={[styles.newsLine, { backgroundColor: color }]} />
        <View style={[styles.newsLine, { backgroundColor: color, width: 8 }]} />
      </View>
    );
  }
  if (id === 'marketplace') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.bagHandle, { borderColor: color }]} />
        <View style={[styles.bagBody, { borderColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.glyph}>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.shoulders, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#101413',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { width: 42, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: '#667085' },
  glyph: { width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  house: { width: 12, height: 8, borderWidth: 1.6, borderTopWidth: 0 },
  cal: { width: 16, height: 14, borderWidth: 1.6, borderRadius: 3, overflow: 'hidden' },
  calTop: { height: 4 },
  news: { width: 16, height: 14, borderWidth: 1.6, borderRadius: 2, justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
  newsLine: { height: 1.6, width: 12 },
  bagHandle: { width: 8, height: 4, borderWidth: 1.6, borderBottomWidth: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  bagBody: { width: 14, height: 9, marginTop: -1, borderWidth: 1.6, borderRadius: 2 },
  head: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, marginBottom: 2 },
  shoulders: { width: 14, height: 6, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 1.6, borderBottomWidth: 0 },
});
