import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import { platformLogo, sharedPicture } from '@/shared/media';

type BrandMarkProps = {
  size?: number;
  uri?: string | null;
  layout?: 'square' | 'wide';
};

const WIDE_RATIO = 598 / 970;

export function BrandMark({ size = 84, uri, layout = 'square' }: BrandMarkProps) {
  const local = sharedPicture(uri);
  const remote: ImageSourcePropType | null = uri && /^(https?:|data:)/i.test(uri) ? { uri } : null;
  const source = local ?? remote ?? platformLogo;
  const wide = layout === 'wide' && source === platformLogo;
  const academy = source !== platformLogo;
  return (
    <Image
      accessibilityLabel={academy ? 'Academy logo' : 'GolaX Hub'}
      resizeMode={academy || wide ? 'contain' : 'cover'}
      source={source}
      style={[
        styles.logo,
        wide
          ? { width: size, height: size * WIDE_RATIO, borderRadius: 0, backgroundColor: 'transparent' }
          : {
              width: size,
              height: size,
              borderRadius: academy ? 16 : size * 0.22,
              backgroundColor: academy ? '#ffffff' : '#102033',
            },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: '#102033',
  },
});
