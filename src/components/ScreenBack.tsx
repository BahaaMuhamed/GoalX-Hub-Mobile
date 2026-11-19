import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useLocale } from '@/i18n/LocaleContext';

export function ScreenBack() {
  const { lang } = useLocale();
  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/home');
      }}
    >
      <Text style={styles.label}>{lang === 'ar' ? 'رجوع' : 'Back'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a4240',
    justifyContent: 'center',
  },
  label: { color: '#f4f7f5', fontWeight: '800', fontSize: 13 },
});
