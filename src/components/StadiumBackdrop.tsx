import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { ReactNode } from 'react';

const stadium = require('../../assets/brand/stadium.jpg');

type StadiumBackdropProps = {
  children: ReactNode;
  focus?: 'photo' | 'form';
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function StadiumBackdrop({ children, focus = 'form', onLayout }: StadiumBackdropProps) {
  const topAlpha = focus === 'photo' ? 0.25 : 0.5;
  const bottomAlpha = focus === 'photo' ? 0.78 : 0.9;

  return (
    <View style={styles.root} onLayout={onLayout}>
      <Image source={stadium} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[styles.top, { backgroundColor: `rgba(5, 14, 11, ${topAlpha})` }]} />
      <View style={[styles.bottom, { backgroundColor: `rgba(5, 12, 10, ${bottomAlpha})` }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07140c',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
  },
});
