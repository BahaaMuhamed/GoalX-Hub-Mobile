import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GROUP_LABEL, type AppScreen, type ScreenGroup } from '@/workspace/navigation';

const ORDER: ScreenGroup[] = ['main', 'manage', 'finance', 'advertising'];

export function ModuleTree({
  screens,
  accent,
  forceOpen = false,
  onOpen,
}: {
  screens: AppScreen[];
  accent: string;
  forceOpen?: boolean;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState<Partial<Record<ScreenGroup, boolean>>>({});

  return (
    <View style={styles.wrap}>
      {ORDER.map((group) => {
        const items = screens.filter((item) => item.group === group);
        if (!items.length) return null;
        const expanded = forceOpen || Boolean(open[group]);
        return (
          <View key={group}>
            <Pressable
              style={styles.parent}
              onPress={() => setOpen((current) => ({ ...current, [group]: !current[group] }))}
            >
              <Text style={styles.heading}>{GROUP_LABEL[group]}</Text>
              <Text style={[styles.chevron, { color: accent }]}>{expanded ? '▾' : '▸'}</Text>
            </Pressable>
            {expanded
              ? items.map((item) => (
                  <Pressable
                    key={`${item.path}-${item.label}`}
                    style={styles.child}
                    onPress={() => {
                      onOpen?.();
                      if (item.path === 'profile') {
                        router.push('/profile');
                        return;
                      }
                      router.push(`/screens/${item.path}` as Href);
                    }}
                  >
                    <View style={[styles.mark, { backgroundColor: accent }]} />
                    <Text style={styles.label}>{item.label}</Text>
                  </Pressable>
                ))
              : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  parent: {
    minHeight: 40,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    color: '#8e9bb0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chevron: { fontSize: 16, fontWeight: '800' },
  child: {
    minHeight: 44,
    marginLeft: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, color: '#f4f7fb', fontSize: 16, fontWeight: '700' },
});
