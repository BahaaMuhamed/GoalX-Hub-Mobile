import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { RegisterBody } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Banner } from '@/components/Banner';
import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/theme';

const roles: { value: RegisterBody['role']; label: string }[] = [
  { value: 'PLAYER', label: 'Academy player' },
  { value: 'FREE_PLAYER', label: 'Free player' },
  { value: 'COACH', label: 'Coach' },
  { value: 'PUBLIC_USER', label: 'Public user' },
];

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [role, setRole] = useState<RegisterBody['role']>('PLAYER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) {
      next.fullName = 'Enter your full name.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email.';
    }
    if (password.length < 8) {
      next.password = 'Use at least 8 characters.';
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    const org = organizationId.trim();
    if (org && !uuidPattern.test(org)) {
      next.organizationId = 'Academy ID must be a UUID.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) {
      setError('');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        organizationId: organizationId.trim(),
      });
      router.replace('/home');
    } catch (caught) {
      setError(errorMessage(caught, 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandMark size={64} />
          <Text style={styles.title}>Create your profile</Text>
          <Text style={styles.subtitle}>Join GoalX Hub as a player, coach, or visitor.</Text>
          {error ? <Banner message={error} /> : null}
          <TextField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Alex Morgan"
            autoCapitalize="words"
            autoComplete="name"
            error={fieldErrors.fullName}
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@academy.com"
            keyboardType="email-address"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <Text style={styles.roleLabel}>How are you joining?</Text>
          <View style={styles.roles}>
            {roles.map((item) => {
              const selected = item.value === role;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setRole(item.value)}
                  style={[styles.role, selected && styles.roleSelected]}
                >
                  <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry={!showPassword}
            autoComplete="password"
            error={fieldErrors.password}
          />
          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
            secureTextEntry={!showPassword}
            autoComplete="password"
            error={fieldErrors.confirmPassword}
          />
          <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.toggle}>
            <Text style={styles.toggleLabel}>{showPassword ? 'Hide password' : 'Show password'}</Text>
          </Pressable>
          <TextField
            label="Academy ID"
            value={organizationId}
            onChangeText={setOrganizationId}
            placeholder="Leave blank if you do not have one"
            autoComplete="off"
            error={fieldErrors.organizationId}
          />
          <PrimaryButton label="Create account" onPress={submit} loading={submitting} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already registered?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.link}>Sign in</Text>
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
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  roleLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  roles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  role: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cardRaised,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleSelected: {
    backgroundColor: '#14392c',
    borderColor: colors.green,
  },
  roleText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  roleTextSelected: {
    color: colors.greenBright,
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
