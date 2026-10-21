import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 84 }: BrandMarkProps) {
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
        },
      ]}
    >
      <View
        style={[
          styles.ring,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: size * 0.36,
            borderWidth: Math.max(2, size * 0.035),
          },
        ]}
      />
      <Text style={[styles.letters, { fontSize: size * 0.3 }]}>GX</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderColor: colors.gold,
  },
  letters: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
