import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { ModuleTree } from '@/components/ModuleTree';
import { useWorkspace } from '@/workspace/WorkspaceContext';
import { screensFor } from '@/workspace/navigation';

export default function DiscoverScreen() {
  const { profile } = useAuth();
  const workspace = useWorkspace();
  const screens = screensFor(profile?.role ?? '', workspace.hidden);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.kicker}>{workspace.brandName}</Text>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.lead}>Modules for this account. An admin, coach, administrative user, and player each see only what the website allows.</Text>
          <ModuleTree screens={screens} accent={workspace.accent} />
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
  kicker: { color: '#8e9bb0', fontSize: 13, fontWeight: '700' },
  title: { color: '#f4f7fb', fontSize: 32, fontWeight: '800' },
  lead: { color: '#8e9bb0', fontSize: 15, lineHeight: 21, marginBottom: 6 },
});
