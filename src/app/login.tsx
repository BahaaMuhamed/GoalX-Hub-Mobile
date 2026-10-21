import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { Banner } from '@/components/Banner';
import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!identifier.trim() || !password) {
      setError('Enter your username or email and your password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signIn(identifier, password);
      router.replace('/home');
    } catch (caught) {
      setError(errorMessage(caught, 'Sign in failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandMark size={72} />
          <Text style={styles.title}>GoalX Hub</Text>
          <Text style={styles.subtitle}>Sign in to your academy or player account.</Text>
          {error ? <Banner message={error} /> : null}
          <TextField
            label="Username or email"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@academy.com"
            autoComplete="username"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.toggle}>
            <Text style={styles.toggleLabel}>{showPassword ? 'Hide password' : 'Show password'}</Text>
          </Pressable>
          <PrimaryButton label="Sign in" onPress={submit} loading={submitting} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>New here?</Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={styles.link}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  toggleLabel: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  footerText: {
    color: colors.muted,
    fontSize: 15,
  },
  link: {
    color: colors.greenBright,
    fontSize: 15,
    fontWeight: '700',
  },
});
