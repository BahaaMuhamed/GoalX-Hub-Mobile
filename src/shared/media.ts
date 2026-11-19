import type { ImageSourcePropType } from 'react-native';

/**
 * Copies of Project/shared/ads and Project/shared/brand.
 * Metro can only bundle pictures that live inside this app, so
 * `npm start` copies the shared files into assets/ before the bundle runs.
 */
const ADS: Record<string, ImageSourcePropType> = {
  'training-offer': require('../../assets/ads/training-offer.png'),
  'summer-camp': require('../../assets/ads/summer-camp.png'),
  'partner-kit': require('../../assets/ads/partner-kit.png'),
};

const LOGOS: Record<string, ImageSourcePropType> = {
  'goalx-lion': require('../../assets/brand/goalx-lion.png'),
};

export const platformLogo = LOGOS['goalx-lion'];

/** A website path such as /assets/ads or /assets/brand, resolved to the shared file. */
export function sharedPicture(url: string | null | undefined): ImageSourcePropType | null {
  if (!url || /^data:/i.test(url)) return null;
  const file = decodeURIComponent(url.split('?')[0].split('/').pop() || '')
    .replace(/\.(svg|png|jpe?g|webp)$/i, '')
    .toLowerCase();
  if (!file) return null;
  if (ADS[file] && /ads/i.test(url)) return ADS[file];
  if (LOGOS[file] && /brand|logo/i.test(url)) return LOGOS[file];
  return null;
}
