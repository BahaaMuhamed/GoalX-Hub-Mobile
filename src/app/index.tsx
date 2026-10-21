import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { BrandMark } from '@/components/BrandMark';
import { colors, spacing } from '@/theme';

const openedAt = Date.now();
const minimumSplashMs = 1400;

export default function SplashRoute() {
  const { status } = useAuth();
  const router = useRouter();
  const glow = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.45, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [glow]);

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
    <View style={styles.screen} onLayout={() => SplashScreen.hideAsync()}>
      <View style={styles.pitch} />
      <Animated.View style={{ opacity: glow }}>
        <BrandMark size={112} />
      </Animated.View>
      <Text style={styles.name}>GoalX Hub</Text>
      <Text style={styles.tag}>Football, connected.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  pitch: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#123226',
    opacity: 0.55,
  },
  name: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tag: {
    color: colors.gold,
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
