import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ink } from '@/components/DirectoryChrome';

export function DropDown({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  placeholder: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.id === value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.box} onPress={() => setOpen(true)}>
        <Text style={styles.value} numberOfLines={1}>{selected?.label || placeholder}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView>
              <Pressable
                style={styles.option}
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{placeholder}</Text>
              </Pressable>
              {options.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.option, item.id === value && styles.optionOn]}
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: ink.muted, fontSize: 12, fontWeight: '700' },
  box: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: ink.input,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: { color: ink.text, fontSize: 14, fontWeight: '700', flex: 1 },
  chevron: { color: ink.muted, fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '70%',
    backgroundColor: ink.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 8,
  },
  sheetTitle: { color: ink.text, fontSize: 16, fontWeight: '800' },
  option: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingHorizontal: 4 },
  optionOn: { backgroundColor: '#2a1a22' },
  optionText: { color: ink.text, fontSize: 15 },
});
