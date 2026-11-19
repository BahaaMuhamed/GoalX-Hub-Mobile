import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import {
  canManageAcademy,
  deleteMethodology,
  listActivityTypes,
  listMethodologies,
  saveMethodology,
  type ActivityType,
  type Methodology,
} from '@/api/training';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, HScroll, ink, PinkButton, WhiteButton } from '@/components/DirectoryChrome';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

const blank = { name: '', duration: '90', ageGroup: '', status: 'ACTIVE', difficulty: '', description: '', typeIds: [] as string[] };

export function MethodologiesScreen() {
  const { lang, rtl } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const canManage = canManageAcademy(profile?.role ?? '');
  const workspace = useWorkspace();
  const [rows, setRows] = useState<Methodology[]>([]);
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);

  const t = ar
    ? {
        title: 'منهجيات التدريب',
        hint: 'عرّف المنهج مرة واحدة. الجدول ينشئ الحصص، والنقاط تُحسب من أنشطته.',
        create: 'منهج جديد',
        cols: ['الاسم', 'نوع التدريب', 'المدة', 'الفئة', 'الحالة', 'الأنشطة'],
        empty: 'لا توجد منهجيات',
        active: 'نشط',
        inactive: 'غير نشط',
        save: 'حفظ',
        close: 'إغلاق',
        minutes: 'د',
      }
    : {
        title: 'Training methodologies',
        hint: 'Define a methodology once. The schedule creates sessions, and points are calculated from its activities.',
        create: 'New methodology',
        cols: ['Name', 'Training type', 'Duration', 'Age group', 'Status', 'Activities'],
        empty: 'No methodologies',
        active: 'Active',
        inactive: 'Inactive',
        save: 'Save',
        close: 'Close',
        minutes: 'min',
      };

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const [list, activityTypes] = await Promise.all([
        listMethodologies(workspace.organizationId),
        listActivityTypes(),
      ]);
      setRows(list);
      setTypes(activityTypes);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load methodologies'));
    } finally {
      setLoading(false);
    }
  }, [workspace.organizationId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const choices = types.filter((type) => type.code !== 'ATTENDANCE' && type.code !== 'BONUS');

  function startCreate() {
    setEditing('');
    setForm(blank);
  }

  function startEdit(row: Methodology) {
    setEditing(row.id);
    setForm({
      name: row.name,
      duration: String(row.durationMinutes || 90),
      ageGroup: row.ageGroup,
      status: row.status,
      difficulty: row.difficulty,
      description: row.description,
      typeIds: row.activities.map((item) => item.activityTypeId).filter((id) => choices.some((type) => type.id === id)),
    });
  }

  async function save() {
    const attendance = types.find((type) => type.code === 'ATTENDANCE');
    const selected = form.typeIds.slice(0, 4);
    if (!form.name.trim() || !selected.length) {
      setNotice(ar ? 'الاسم ونشاط واحد على الأقل مطلوبان' : 'Name and at least one activity are required');
      return;
    }
    const ids = attendance && !selected.includes(attendance.id) ? [attendance.id, ...selected] : selected;
    setBusy(true);
    try {
      await saveMethodology({
        id: editing || undefined,
        organizationId: workspace.organizationId,
        name: form.name,
        description: form.description,
        trainingType: selected.map((id) => types.find((type) => type.id === id)?.name || '').filter(Boolean).join(', ').slice(0, 64),
        durationMinutes: Number(form.duration) || 90,
        status: form.status,
        ageGroup: form.ageGroup,
        difficulty: form.difficulty,
        activities: ids.map((id, index) => ({
          activityTypeId: id,
          points: types.find((type) => type.id === id)?.defaultPoints || 0,
          sortOrder: index,
          active: true,
        })),
      });
      setEditing(null);
      await load();
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save the methodology'));
    } finally {
      setBusy(false);
    }
  }

  function remove(row: Methodology) {
    Alert.alert(row.name, ar ? 'حذف هذا المنهج؟' : 'Delete this methodology?', [
      { text: t.close, style: 'cancel' },
      {
        text: ar ? 'حذف' : 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteMethodology(row.id).then(load).catch((error) => setNotice(errorMessage(error, 'Could not delete')));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <View style={[styles.top, rtl && styles.reverse]}>
          <View style={styles.titles}>
            <Text style={[styles.title, rtl && styles.end]}>{t.title}</Text>
            <Text style={[styles.hint, rtl && styles.end]}>{t.hint}</Text>
          </View>
          {canManage ? (
            <Pressable style={styles.create} onPress={startCreate}>
              <Text style={styles.createText}>+ {t.create}</Text>
            </Pressable>
          ) : null}
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading ? <ActivityIndicator color={ink.pink} /> : null}
        <View style={styles.card}>
          <HScroll>
            <View>
              <View style={styles.row}>
                {t.cols.map((label) => <Text key={label} style={styles.head}>{label}</Text>)}
                {canManage ? <Text style={styles.head}>{ar ? 'إجراءات' : 'Actions'}</Text> : null}
              </View>
              {!loading && !rows.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
              {rows.map((row) => (
                <View key={row.id} style={styles.row}>
                  <Text style={styles.cell}>{row.name}</Text>
                  <Text style={styles.cell}>{row.trainingType || '—'}</Text>
                  <Text style={styles.cell}>{row.durationMinutes} {t.minutes}</Text>
                  <Text style={styles.cell}>{row.ageGroup || '—'}</Text>
                  <Text style={[styles.cell, row.status === 'ACTIVE' ? styles.good : styles.bad]}>{row.status === 'ACTIVE' ? t.active : t.inactive}</Text>
                  <Text style={styles.cell}>{row.activities.map((item) => `${item.name} · ${item.points}`).join('  ') || '—'}</Text>
                  {canManage ? (
                    <View style={styles.actions}>
                      <Pressable style={styles.mini} onPress={() => startEdit(row)}>
                        <Text style={styles.miniText}>✎</Text>
                      </Pressable>
                      <Pressable style={[styles.mini, styles.miniDanger]} onPress={() => remove(row)}>
                        <Text style={styles.miniText}>×</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </HScroll>
        </View>
      </ScrollView>
      <Modal visible={editing !== null} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.cardTitle}>{t.create}</Text>
            <Field label={t.cols[0]} value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Text style={styles.hint}>{t.cols[5]}</Text>
            <View style={styles.chips}>
              {choices.map((type) => {
                const on = form.typeIds.includes(type.id);
                return (
                  <Pressable
                    key={type.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setForm({
                      ...form,
                      typeIds: on ? form.typeIds.filter((id) => id !== type.id) : form.typeIds.length >= 4 ? form.typeIds : [...form.typeIds, type.id],
                    })}
                  >
                    <Text style={styles.chipText}>{type.name} · {type.defaultPoints}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field label={t.cols[2]} value={form.duration} onChange={(duration) => setForm({ ...form, duration })} />
            <Field label={t.cols[3]} value={form.ageGroup} onChange={(ageGroup) => setForm({ ...form, ageGroup })} placeholder="U14" />
            <View style={styles.actions}>
              <WhiteButton label={form.status === 'ACTIVE' ? t.active : t.inactive} onPress={() => setForm({ ...form, status: form.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })} />
            </View>
            <Field label={ar ? 'الوصف' : 'Description'} value={form.description} onChange={(description) => setForm({ ...form, description })} />
            <View style={styles.actions}>
              <PinkButton label={t.save} onPress={() => void save()} disabled={busy} />
              <WhiteButton label={t.close} onPress={() => setEditing(null)} />
            </View>
          </ScrollView>
        </View>
      </Modal>
      <AppTabBar active="training" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  reverse: { flexDirection: 'row-reverse' },
  titles: { flex: 1, gap: 4 },
  title: { color: ink.text, fontSize: 26, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  end: { textAlign: 'right' },
  card: { backgroundColor: ink.card, borderRadius: 16, borderWidth: 1, borderColor: ink.line, padding: 14 },
  cardTitle: { color: ink.text, fontSize: 18, fontWeight: '800' },
  notice: { color: '#ffd1dc', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 8, gap: 8 },
  head: { width: 120, color: ink.muted, fontSize: 12, fontWeight: '800' },
  cell: { width: 120, color: ink.text, fontSize: 13 },
  actions: { width: 72, flexDirection: 'row', gap: 6 },
  mini: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ink.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c2422',
  },
  miniDanger: { borderColor: '#6b2438', backgroundColor: '#3a1d24' },
  miniText: { color: ink.text, fontSize: 14, fontWeight: '800' },
  create: {
    alignSelf: 'center',
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: ink.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: { color: ink.white, fontSize: 12, fontWeight: '800' },
  empty: { color: ink.muted, paddingVertical: 12 },
  good: { color: '#8ee0b0' },
  bad: { color: '#ffb4b4' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: ink.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: ink.pink, borderColor: ink.pink },
  chipText: { color: ink.text, fontSize: 12, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '90%' },
});
