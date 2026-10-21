import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

type BannerProps = {
  message: string;
};

export function Banner({ message }: BannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6b3038',
    padding: spacing.md,
  },
  text: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
