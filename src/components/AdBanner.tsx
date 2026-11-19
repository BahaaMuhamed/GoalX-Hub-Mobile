import { router, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import type { AdCard } from '@/api/feed';
import { sharedPicture } from '@/shared/media';

const ROTATION_MS = 10000;

export function AdBanner({ ads, accent }: { ads: AdCard[]; accent: string }) {
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const ad = ads[index];

  useEffect(() => {
    if (!ads.length) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ROTATION_MS,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && ads.length > 1) {
        setIndex((current) => (current + 1) % ads.length);
      }
    });
    return () => animation.stop();
  }, [ads.length, index, progress]);

  if (!ad) return null;
  const picture = pictureFor(ad.imageUrl);
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  function show(next: number) {
    const count = ads.length;
    setIndex(((next % count) + count) % count);
  }

  return (
    <View style={styles.section}>
      <View style={styles.rail}>
        <View style={styles.line} />
        <Text style={styles.caption}>Advertisement</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.frame}>
        {picture ? <Image source={picture} style={styles.photo} resizeMode="cover" /> : <View style={styles.photo} />}
        <View style={styles.shade} />
        <View style={styles.copy}>
          <Text style={styles.tag}>Sponsored</Text>
          <Text style={styles.title} numberOfLines={2}>{ad.title}</Text>
          {ad.description ? <Text style={styles.body} numberOfLines={2}>{ad.description}</Text> : null}
          <Pressable style={styles.cta} onPress={() => openAd(ad)}>
            <Text style={styles.ctaLabel}>{ad.cta}  →</Text>
          </Pressable>
        </View>
        {ads.length > 1 ? (
          <Pressable accessibilityLabel="Next advertisement" style={styles.next} onPress={() => show(index + 1)}>
            <Text style={styles.nextLabel}>›</Text>
          </Pressable>
        ) : null}
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width, backgroundColor: accent }]} />
        </View>
      </View>
      {ads.length > 1 ? (
        <View style={styles.dots}>
          {ads.map((item, dot) => (
            <Pressable key={item.id} accessibilityLabel={`Advertisement ${dot + 1}`} onPress={() => show(dot)}>
              <View style={[styles.dot, dot === index ? styles.dotOn : null]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function pictureFor(url: string | null): ImageSourcePropType | null {
  const local = sharedPicture(url);
  if (local) return local;
  if (url && /^(https?:|data:)/i.test(url)) return { uri: url };
  return null;
}

function openAd(ad: AdCard) {
  const url = ad.redirectUrl || '';
  if (!url || url === '/marketplace' || url.endsWith('/marketplace')) {
    router.push('/screens/marketplace' as Href);
    return;
  }
  if (/^https?:\/\//i.test(url)) {
    void Linking.openURL(url);
  }
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  rail: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(212, 175, 55, 0.7)' },
  caption: { color: '#d4af37', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  frame: { height: 168, borderRadius: 16, overflow: 'hidden', backgroundColor: '#151918', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  photo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#101827' },
  shade: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '72%', backgroundColor: 'rgba(11,13,12,0.72)' },
  copy: { position: 'absolute', left: 14, right: 54, bottom: 14, gap: 4 },
  tag: { alignSelf: 'flex-start', color: '#d4af37', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)', backgroundColor: 'rgba(212,175,55,0.14)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  body: { color: '#e7edf3', fontSize: 12, lineHeight: 16 },
  cta: { alignSelf: 'flex-start', marginTop: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#19a967' },
  ctaLabel: { color: '#04140c', fontSize: 12, fontWeight: '800' },
  next: { position: 'absolute', right: 10, top: 66, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,13,12,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  nextLabel: { color: '#ffffff', fontSize: 22, lineHeight: 24 },
  track: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  fill: { height: 3 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 18, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)' },
  dotOn: { width: 30, backgroundColor: '#d4af37' },
});
