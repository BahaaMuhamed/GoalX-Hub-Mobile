import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '@/api/client';
import { Banner } from '@/components/Banner';
import { BrandMark } from '@/components/BrandMark';
import { RecordGrid } from '@/components/RecordGrid';
import { colors, spacing } from '@/theme';
import { presentResponse, type ScreenPayload } from '@/workspace/present';

const PAGES: Record<string, { title: string; hint: string; path?: string }> = {
  about: {
    title: 'About',
    hint: 'GoalX Hub connects academies, coaches, and players on one platform.',
  },
  academies: {
    title: 'Academies',
    hint: 'Active academies published on the website.',
    path: '/public/academies',
  },
  programs: {
    title: 'Programs',
    hint: 'Training programs are run inside each academy after you sign in.',
  },
  marketplace: {
    title: 'Marketplace',
    hint: 'Public marketplace items from the website.',
    path: '/public/marketplace/items',
  },
  news: {
    title: 'News',
    hint: 'Platform news is published from the website newsroom.',
  },
  vote: {
    title: 'Vote',
    hint: 'Open seasons players can join from the website.',
    path: '/public/seasons/registration',
  },
  contact: {
    title: 'Contact',
    hint: 'Use the academy contact on each academy card, or sign in to message your coach.',
  },
  privacy: {
    title: 'Privacy',
    hint: 'GoalX Hub stores account, academy, and training records so the platform can run.',
  },
  terms: {
    title: 'Terms',
    hint: 'Use of GoalX Hub is limited to the academy or player account you were given.',
  },
};

export default function SitePage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const entry = PAGES[page || ''] ?? { title: 'GoalX Hub', hint: 'This page is part of the public website.' };
  const [data, setData] = useState<ScreenPayload>({ summary: [], rows: [] });
  const [loading, setLoading] = useState(Boolean(entry.path));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entry.path) {
      setLoading(false);
      setData({ summary: [], rows: [] });
      return;
    }
    let active = true;
    setLoading(true);
    apiRequest(entry.path)
      .then((payload) => {
        if (active) setData(presentResponse(payload));
      })
      .catch((caught: Error) => {
        if (active) setError(caught.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entry.path]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <BrandMark size={64} />
        <Text style={styles.kicker}>GoalX Hub</Text>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.hint}>{entry.hint}</Text>
        {entry.path ? <Text style={styles.endpoint}>GET {entry.path}</Text> : null}
        {error ? <Banner message={error} /> : null}
        {loading ? <ActivityIndicator color={colors.greenBright} /> : null}
        {!loading && data.rows.length ? <RecordGrid data={data} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  back: { color: colors.gold, fontWeight: '700', fontSize: 15 },
  kicker: { color: colors.gold, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  endpoint: { color: colors.faint, fontSize: 12 },
});
