import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenBack } from '@/components/ScreenBack';
import { NEWS, NEWS_CATEGORIES, categoryLabel, type NewsArticle, type NewsCategory } from '@/content/news';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

export default function NewsScreen() {
  const { lang, rtl } = useLocale();
  const workspace = useWorkspace();
  const align = rtl ? 'right' : 'left';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<NewsCategory>('All');
  const [open, setOpen] = useState<NewsArticle | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NEWS.filter((article) => {
      if (category !== 'All' && article.category !== category) return false;
      if (!q) return true;
      const title = lang === 'ar' ? article.titleAr : article.title;
      const excerpt = lang === 'ar' ? article.excerptAr : article.excerpt;
      return `${title} ${excerpt} ${article.title} ${article.excerpt}`.toLowerCase().includes(q);
    });
  }, [category, lang, query]);

  const featured = !query.trim() && category === 'All' ? rows.find((article) => article.featured) : undefined;
  const latest = rows.filter((article) => article.id !== featured?.id);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page}>
          <ScreenBack />
          <Text style={[styles.kicker, { textAlign: align }]}>{workspace.brandName}</Text>
          <Text style={[styles.title, { textAlign: align }]}>{lang === 'ar' ? 'الأخبار' : 'News'}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={lang === 'ar' ? 'ابحث في الأخبار' : 'Search news'}
            placeholderTextColor="#718098"
            style={[styles.search, { textAlign: align }]}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {NEWS_CATEGORIES.map((item) => {
              const on = item === category;
              return (
                <Pressable key={item} style={[styles.chip, on && { borderColor: workspace.accent }]} onPress={() => setCategory(item)}>
                  <Text style={[styles.chipText, on && { color: workspace.accent }]}>{categoryLabel(item, lang)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {open ? (
            <Article article={open} lang={lang} align={align} onClose={() => setOpen(null)} />
          ) : (
            <>
              {featured ? <Story article={featured} lang={lang} align={align} large onPress={() => setOpen(featured)} /> : null}
              {latest.map((article) => (
                <Story key={article.id} article={article} lang={lang} align={align} onPress={() => setOpen(article)} />
              ))}
              {!rows.length ? <Text style={[styles.empty, { textAlign: align }]}>{lang === 'ar' ? 'لا توجد أخبار.' : 'No matching stories.'}</Text> : null}
            </>
          )}
        </ScrollView>
        <AppTabBar active="news" />
      </SafeAreaView>
    </View>
  );
}

function Story({
  article,
  lang,
  align,
  large,
  onPress,
}: {
  article: NewsArticle;
  lang: 'en' | 'ar';
  align: 'left' | 'right';
  large?: boolean;
  onPress: () => void;
}) {
  const title = lang === 'ar' ? article.titleAr : article.title;
  const excerpt = lang === 'ar' ? article.excerptAr : article.excerpt;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: article.image }} style={large ? styles.hero : styles.thumb} />
      <View style={styles.copy}>
        <Text style={[styles.meta, { textAlign: align }]}>{categoryLabel(article.category, lang)} · {article.date}</Text>
        <Text style={[styles.cardTitle, { textAlign: align }]}>{title}</Text>
        <Text style={[styles.excerpt, { textAlign: align }]} numberOfLines={3}>{excerpt}</Text>
      </View>
    </Pressable>
  );
}

function Article({
  article,
  lang,
  align,
  onClose,
}: {
  article: NewsArticle;
  lang: 'en' | 'ar';
  align: 'left' | 'right';
  onClose: () => void;
}) {
  const title = lang === 'ar' ? article.titleAr : article.title;
  const body = lang === 'ar' ? article.bodyAr : article.body;
  return (
    <View style={styles.card}>
      <Image source={{ uri: article.image }} style={styles.hero} />
      <View style={styles.copy}>
        <Pressable onPress={onClose}>
          <Text style={[styles.meta, { textAlign: align }]}>{lang === 'ar' ? 'العودة إلى الأخبار' : 'Back to news'}</Text>
        </Pressable>
        <Text style={[styles.cardTitle, { textAlign: align }]}>{title}</Text>
        {body.map((paragraph) => (
          <Text key={paragraph} style={[styles.excerpt, { textAlign: align }]}>{paragraph}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101413' },
  flex: { flex: 1 },
  page: { padding: 16, gap: 12, paddingBottom: 28 },
  kicker: { color: '#8e9bb0', fontSize: 13, fontWeight: '700' },
  title: { color: '#f4f7fb', fontSize: 32, fontWeight: '800' },
  search: { backgroundColor: '#182235', color: '#f4f7fb', borderRadius: 14, borderWidth: 1, borderColor: '#26344a', paddingHorizontal: 14, paddingVertical: 12 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: '#3a465c', paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: '#f4f7fb', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#161c22', borderRadius: 18, borderWidth: 1, borderColor: '#26344a', overflow: 'hidden' },
  hero: { width: '100%', height: 180 },
  thumb: { width: '100%', height: 120 },
  copy: { padding: 14, gap: 6 },
  meta: { color: '#d4af37', fontSize: 12, fontWeight: '700' },
  cardTitle: { color: '#f4f7fb', fontSize: 18, fontWeight: '800' },
  excerpt: { color: '#c5d0de', fontSize: 14, lineHeight: 20 },
  empty: { color: '#8e9bb0' },
});
