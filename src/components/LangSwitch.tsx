import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/i18n/LocaleContext';
import type { Lang } from '@/i18n/copy';
import { colors } from '@/theme';

const options: { id: Lang; label: string }[] = [
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'English' },
];

export function LangSwitch() {
  const { lang, setLang } = useLocale();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.id === lang;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setLang(option.id)}
            style={[styles.pill, active ? styles.pillOn : styles.pillOff]}
          >
            <Text style={[styles.label, active ? styles.labelOn : styles.labelOff]}>{option.label}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.globe}>🌐</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  pillOff: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelOn: {
    color: colors.white,
  },
  labelOff: {
    color: '#102033',
  },
  globe: {
    fontSize: 16,
    marginLeft: 2,
  },
});
