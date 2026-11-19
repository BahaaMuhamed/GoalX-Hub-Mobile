import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPassword } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { Banner } from '@/components/Banner';
import { BrandMark } from '@/components/BrandMark';
import { EyeIcon } from '@/components/EyeIcon';
import { LangSwitch } from '@/components/LangSwitch';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StadiumBackdrop } from '@/components/StadiumBackdrop';
import { useLocale } from '@/i18n/LocaleContext';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { rtl, text } = useLocale();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetIdentity, setResetIdentity] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const align = rtl ? 'right' : 'left';

  async function submit() {
    if (!identifier.trim() || !password) {
      setError(text.missing);
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await signIn(identifier, password);
      router.replace('/home');
    } catch (caught) {
      setError(errorMessage(caught, text.failed));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReset() {
    const identity = resetIdentity.trim();
    if (!identity) {
      setError(text.resetNeed);
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await forgotPassword(identity);
      setInfo(text.resetSent);
      setForgot(false);
    } catch (caught) {
      const message = errorMessage(caught, text.resetSent);
      if (message.includes('Cannot reach')) {
        setError(message);
      } else {
        setInfo(text.resetSent);
        setForgot(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StadiumBackdrop>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <LangSwitch />
            <View style={styles.brand}>
              <BrandMark size={88} />
              <Text style={styles.title}>{text.brand}</Text>
              <Text style={styles.lead}>{text.loginLead}</Text>
            </View>

            <View style={styles.tabs}>
              <Pressable style={styles.tab} onPress={() => router.push('/register')}>
                <Text style={styles.tabLabel}>{text.signupTab}</Text>
              </Pressable>
              <View style={[styles.tab, styles.tabOn]}>
                <Text style={[styles.tabLabel, styles.tabLabelOn]}>{text.loginTab}</Text>
              </View>
            </View>

            {error ? <Banner message={error} /> : null}
            {info ? (
              <View style={styles.info}>
                <Text style={styles.infoText}>{info}</Text>
              </View>
            ) : null}

            {forgot ? (
              <View style={styles.form}>
                <Text style={[styles.resetTitle, { textAlign: align }]}>{text.resetTitle}</Text>
                <Text style={[styles.resetLead, { textAlign: align }]}>{text.resetLead}</Text>
                <Field
                  value={resetIdentity}
                  onChangeText={setResetIdentity}
                  placeholder={text.userPh}
                  align={align}
                  autoComplete="username"
                  keyboardType="email-address"
                />
                <PrimaryButton label={text.resetSend} onPress={sendReset} loading={submitting} />
                <Pressable onPress={() => { setForgot(false); setError(''); }}>
                  <Text style={[styles.forgot, { textAlign: align }]}>{text.resetBack}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Field
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder={text.userPh}
                  align={align}
                  autoComplete="username"
                  keyboardType="email-address"
                />
                <View style={[styles.password, rtl && styles.rowReverse]}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={text.passPh}
                    placeholderTextColor="#7d8b86"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    style={[styles.input, { textAlign: align, writingDirection: rtl ? 'rtl' : 'ltr' }]}
                  />
                  <Pressable
                    accessibilityLabel={showPassword ? text.hidePassword : text.showPassword}
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={8}
                  >
                    <EyeIcon open={showPassword} color="#c5d0cb" />
                  </Pressable>
                </View>
                <Pressable onPress={() => { setForgot(true); setError(''); setResetIdentity(identifier); }}>
                  <Text style={[styles.forgot, { textAlign: align }]}>{text.forgot}</Text>
                </Pressable>
                <PrimaryButton label={text.signIn} onPress={submit} loading={submitting} />
              </View>
            )}

            <Text style={styles.terms}>
              {text.termsLead}
              <Text style={styles.termsLink} onPress={() => router.push('/site/terms' as Href)}>
                {text.termsLink}
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </StadiumBackdrop>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
  align,
  autoComplete,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  align: 'left' | 'right';
  autoComplete: 'username' | 'email';
  keyboardType?: 'email-address';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#7d8b86"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={autoComplete}
      keyboardType={keyboardType}
      style={[styles.field, { textAlign: align, writingDirection: align === 'right' ? 'rtl' : 'ltr' }]}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  lead: {
    color: '#d5ddd8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(8, 16, 14, 0.72)',
    padding: 4,
    gap: 4,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  tab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: colors.green,
  },
  tabLabel: {
    color: '#c5d0cb',
    fontSize: 15,
    fontWeight: '700',
  },
  tabLabelOn: {
    color: colors.white,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(16, 24, 22, 0.92)',
    color: colors.white,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  password: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(16, 24, 22, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    minHeight: 52,
  },
  forgot: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  resetTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  resetLead: {
    color: '#d5ddd8',
    fontSize: 15,
    lineHeight: 22,
  },
  info: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 169, 103, 0.4)',
    backgroundColor: 'rgba(25, 169, 103, 0.16)',
    padding: spacing.md,
  },
  infoText: {
    color: '#d7ffe8',
    fontSize: 14,
    lineHeight: 20,
  },
  terms: {
    color: '#b7c3be',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: spacing.md,
  },
  termsLink: {
    color: colors.white,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
