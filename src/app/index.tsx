import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { BrandMark } from '@/components/BrandMark';
import { StadiumBackdrop } from '@/components/StadiumBackdrop';
import { useLocale } from '@/i18n/LocaleContext';
import { colors, spacing } from '@/theme';

const openedAt = Date.now();
const minimumSplashMs = 1700;

export default function SplashRoute() {
  const { status } = useAuth();
  const { text } = useLocale();
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 720, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  useEffect(() => {
    if (status === 'booting') {
      return;
    }
    const wait = Math.max(0, minimumSplashMs - (Date.now() - openedAt));
    const timer = setTimeout(() => {
      router.replace(status === 'signedIn' ? '/home' : '/login');
    }, wait);
    return () => clearTimeout(timer);
  }, [router, status]);

  return (
    <StadiumBackdrop focus="photo" onLayout={() => SplashScreen.hideAsync()}>
      <View style={styles.center}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <BrandMark size={128} />
        </Animated.View>
        <Text style={styles.name}>{text.brand}</Text>
        <View style={styles.rule} />
        <Text style={styles.tag}>{text.splashTag}</Text>
      </View>
    </StadiumBackdrop>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  name: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: spacing.sm,
  },
  rule: {
    width: 72,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.green,
    marginVertical: spacing.xs,
  },
  tag: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
