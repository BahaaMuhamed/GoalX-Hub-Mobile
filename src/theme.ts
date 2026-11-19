export const colors = {
  bg: '#071018',
  card: '#101827',
  cardRaised: '#182235',
  line: '#26344a',
  text: '#f4f7fb',
  muted: '#8e9bb0',
  faint: '#718098',
  green: '#19a967',
  greenBright: '#25c879',
  gold: '#d4af37',
  danger: '#ff8b8b',
  dangerBg: '#3a1d24',
  white: '#ffffff',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export function wash(hex: string, alpha = 0.18): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(25, 169, 103, ${alpha})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function onColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return colors.white;
  }
  const luma = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luma > 0.64 ? colors.bg : colors.white;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.trim().replace('#', '');
  const full = value.length === 3 ? value.split('').map((part) => part + part).join('') : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
