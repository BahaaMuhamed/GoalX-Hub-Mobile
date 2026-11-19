import { StyleSheet, View } from 'react-native';

export function EyeIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <View style={styles.box}>
      <View style={[styles.eye, { borderColor: color }]}>
        <View style={[styles.pupil, open ? { backgroundColor: color } : { borderColor: color, borderWidth: 1.5 }]} />
      </View>
      {open ? null : <View style={[styles.slash, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    width: 20,
    height: 12,
    borderRadius: 10,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  slash: {
    position: 'absolute',
    width: 20,
    height: 1.6,
    transform: [{ rotate: '-32deg' }],
  },
});
