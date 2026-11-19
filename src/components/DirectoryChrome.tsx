import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export const ink = {
  bg: '#0d100f',
  card: '#151917',
  line: '#2a312e',
  text: '#f4f7f5',
  muted: '#9aa59c',
  pink: '#ff2d6a',
  white: '#ffffff',
  input: '#0e1210',
};

export function PinkButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.pink, disabled && styles.disabled]} disabled={disabled} onPress={onPress}>
      <Text style={styles.pinkText}>{label}</Text>
    </Pressable>
  );
}

export function WhiteButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.white, disabled && styles.disabled]} disabled={disabled} onPress={onPress}>
      <Text style={styles.whiteText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.ghost} onPress={onPress}>
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={ink.muted}
        secureTextEntry={secure}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

export function FilterInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={ink.muted}
      style={styles.filter}
    />
  );
}

export function HScroll({ children }: { children: ReactNode }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  pink: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: ink.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinkText: { color: ink.white, fontWeight: '800', fontSize: 13 },
  white: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: ink.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: { color: '#111', fontWeight: '800', fontSize: 13 },
  ghost: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ink.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: ink.text, fontWeight: '700', fontSize: 12 },
  disabled: { opacity: 0.45 },
  field: { gap: 6 },
  fieldLabel: { color: ink.muted, fontSize: 12, fontWeight: '700' },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: ink.input,
    color: ink.text,
    paddingHorizontal: 12,
  },
  filter: {
    minWidth: 110,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: ink.input,
    color: ink.text,
    paddingHorizontal: 8,
    fontSize: 12,
  },
});
