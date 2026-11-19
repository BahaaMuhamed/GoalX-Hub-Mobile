import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listBranches, type BranchOption } from '@/api/dashboard';
import { listGroups, listTraining, type GroupRecord, type TrainingSession } from '@/api/directory';
import { errorMessage } from '@/api/errors';
import {
  canManageAcademy,
  canOpenSession,
  cancelSession,
  createTraining,
  deactivateQr,
  generateQr,
  listMethodologies,
  loadQr,
  loadSession,
  qrImageUrl,
  type Methodology,
  type SessionDetail,
  type SessionQr,
} from '@/api/training';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, HScroll, ink, PinkButton, WhiteButton } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

const STAFF = new Set(['COACH', 'ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE']);

export function TrainingScreen() {
  const { lang, rtl } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const role = profile?.role ?? '';
  const workspace = useWorkspace();
  const canCreate = canManageAcademy(role);
  const canOpen = canOpenSession(role);
  const staff = STAFF.has(role);
  const [all, setAll] = useState<TrainingSession[]>([]);
  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [methods, setMethods] = useState<Methodology[]>([]);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [qr, setQr] = useState<SessionQr | null>(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ groupId: '', methodologyId: '', date: '', startTime: '18:00', endTime: '19:30', location: '' });

  const t = ar
    ? {
        title: 'التدريب',
        hint: 'كل الحصص، ثم سجل الحصص المكتملة. افتح الحصة لرؤية الحضور والنتيجة.',
        all: 'كل التدريبات',
        history: 'السجل',
        refresh: 'تحديث',
        create: 'تدريب جديد',
        branch: 'الفرع',
        allBranches: 'كل الفروع',
        cols: ['التاريخ', 'الوقت', 'المجموعة', 'المدرب', 'المنهج', 'الحالة'],
        empty: 'لا توجد حصص',
        open: 'فتح',
        qr: 'رمز التدريب',
        generate: 'إنشاء الرمز',
        stop: 'إلغاء تفعيل الرمز',
        scans: 'عدد الحضور',
        noScans: 'لم يمسح أحد هذا التدريب بعد.',
        locked: 'النقاط نهائية. أي تصحيح لاحق يجب أن يكون تسوية مدققة.',
        scheduled: 'تُفتح هذه الجلسة تلقائياً عند وصول وقت البداية.',
        cancel: 'إلغاء الجلسة',
        players: 'اللاعبون',
        present: 'حاضر',
        absent: 'غائب',
        average: 'متوسط النقاط',
        status: 'الحالة',
        save: 'حفظ',
        close: 'إغلاق',
        group: 'المجموعة',
        method: 'المنهج',
        date: 'التاريخ',
        start: 'البداية',
        end: 'النهاية',
        location: 'المكان',
      }
    : {
        title: 'Training',
        hint: 'Every session, then the completed history. Open a session to see attendance and the result.',
        all: 'All training',
        history: 'History',
        refresh: 'Refresh',
        create: 'New training',
        branch: 'Branch',
        allBranches: 'All branches',
        cols: ['Date', 'Time', 'Group', 'Coach', 'Method', 'Status'],
        empty: 'No sessions',
        open: 'Open',
        qr: 'Training QR',
        generate: 'Create QR',
        stop: 'Deactivate QR',
        scans: 'Attendance count',
        noScans: 'Nobody has scanned this training yet.',
        locked: 'Points are final. Any later correction must be an audited adjustment.',
        scheduled: 'This session opens automatically when the start time arrives.',
        cancel: 'Cancel session',
        players: 'Players',
        present: 'Present',
        absent: 'Absent',
        average: 'Average points',
        status: 'Status',
        save: 'Save',
        close: 'Close',
        group: 'Group',
        method: 'Methodology',
        date: 'Date',
        start: 'Start',
        end: 'End',
        location: 'Location',
      };

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const org = workspace.organizationId;
      const [sessions, past, branchList, squads, methodologies] = await Promise.all([
        listTraining(undefined, branchId),
        listTraining('history', branchId),
        listBranches(workspace.academies[0]?.id || org, org),
        listGroups(org),
        listMethodologies(org).catch(() => []),
      ]);
      setAll(sessions);
      setHistory(past);
      setBranches(branchList);
      setGroups(squads);
      setMethods(methodologies);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load training'));
    } finally {
      setLoading(false);
    }
  }, [branchId, workspace.academies, workspace.organizationId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function openSession(id: string) {
    if (!canOpen) return;
    setBusy(true);
    setNotice('');
    try {
      const session = await loadSession(id);
      setDetail(session);
      if (staff && session.status !== 'COMPLETED' && session.status !== 'CANCELLED') {
        setQr(await loadQr(id).catch(() => null));
      } else {
        setQr(null);
      }
    } catch (error) {
      setNotice(errorMessage(error, 'Could not open the session'));
    } finally {
      setBusy(false);
    }
  }

  async function makeQr() {
    if (!detail) return;
    setBusy(true);
    try {
      setQr(await generateQr(detail.id));
    } catch (error) {
      setNotice(errorMessage(error, 'Could not create the QR'));
    } finally {
      setBusy(false);
    }
  }

  async function stopQr() {
    if (!detail) return;
    setBusy(true);
    try {
      await deactivateQr(detail.id);
      setQr(null);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not deactivate the QR'));
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    if (!detail) return;
    Alert.alert(t.cancel, detail.groupName, [
      { text: t.close, style: 'cancel' },
      {
        text: t.cancel,
        style: 'destructive',
        onPress: () => {
          void cancelSession(detail.id)
            .then(() => openSession(detail.id))
            .then(() => load())
            .catch((error) => setNotice(errorMessage(error, 'Could not cancel')));
        },
      },
    ]);
  }

  async function saveTraining() {
    if (!branchId || !form.groupId || !form.methodologyId || !form.date || form.endTime <= form.startTime) {
      setNotice(ar ? 'اختر الفرع والمجموعة والمنهج والوقت' : 'Choose a branch, group, methodology, and a valid time');
      return;
    }
    setBusy(true);
    try {
      await createTraining({
        branchId,
        groupId: form.groupId,
        methodologyId: form.methodologyId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
      });
      setFormOpen(false);
      await load();
    } catch (error) {
      setNotice(errorMessage(error, 'Could not create training'));
    } finally {
      setBusy(false);
    }
  }

  function table(title: string, items: TrainingSession[]) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <HScroll>
          <View>
            <View style={styles.row}>
              {t.cols.map((label) => <Text key={label} style={styles.head}>{label}</Text>)}
            </View>
            {!loading && !items.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
            {items.map((item) => (
              <Pressable key={`${title}-${item.id}`} style={styles.row} onPress={() => void openSession(item.id)}>
                <Text style={styles.cell}>{item.trainingDate || '—'}</Text>
                <Text style={styles.cell}>{[item.startTime, item.endTime].filter(Boolean).join(' - ') || '—'}</Text>
                <Text style={styles.cell}>{item.groupName || '—'}</Text>
                <Text style={styles.cell}>{item.coachName || '—'}</Text>
                <Text style={styles.cell}>{item.methodologyName || '—'}</Text>
                <Text style={styles.cell}>{item.status}</Text>
              </Pressable>
            ))}
          </View>
        </HScroll>
      </View>
    );
  }

  const squads = groups.filter((group) => !branchId || group.branchId === branchId);
  const scanned = detail?.players.filter((player) => player.checkedInAt) ?? [];
  const live = detail && detail.status !== 'COMPLETED' && detail.status !== 'CANCELLED';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <View style={[styles.top, rtl && styles.reverse]}>
          <View style={styles.titles}>
            <Text style={[styles.title, rtl && styles.end]}>{t.title}</Text>
            <Text style={[styles.hint, rtl && styles.end]}>{t.hint}</Text>
          </View>
          <View style={styles.actions}>
            {canCreate ? <PinkButton label={t.create} onPress={() => setFormOpen(true)} /> : null}
            <WhiteButton label={t.refresh} onPress={() => void load()} />
          </View>
        </View>
        <DropDown
          label={t.branch}
          value={branchId}
          placeholder={t.allBranches}
          options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
          onChange={setBranchId}
        />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading || busy ? <ActivityIndicator color={ink.pink} /> : null}
        {table(t.all, all)}
        {table(t.history, history)}
      </ScrollView>
      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        <SafeAreaView style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content}>
            <WhiteButton label={t.close} onPress={() => setDetail(null)} />
            <Text style={[styles.title, rtl && styles.end]}>{detail?.groupName}</Text>
            <Text style={styles.hint}>{detail?.trainingDate} · {detail?.startTime} – {detail?.endTime} · {detail?.methodologyName}</Text>
            <View style={styles.stats}>
              <Stat label={t.status} value={detail?.status || '—'} />
              <Stat label={t.players} value={String(detail?.playerCount ?? 0)} />
              <Stat label={t.present} value={String(detail?.presentCount ?? 0)} hint={`${t.absent} ${detail?.absentCount ?? 0}`} />
              <Stat label={t.average} value={String(detail?.averagePoints ?? 0)} />
            </View>
            {staff && live ? (
              <View style={styles.card}>
                <Text style={[styles.cardTitle, rtl && styles.end]}>{t.qr}</Text>
                <View style={styles.actions}>
                  <PinkButton label={t.generate} onPress={() => void makeQr()} disabled={busy} />
                  {qr?.payload ? <WhiteButton label={t.stop} onPress={() => void stopQr()} /> : null}
                </View>
                {qr?.payload ? (
                  <>
                    <Text style={styles.hint}>{qr.branchName} · {qr.groupName} · {qr.status}</Text>
                    <Image source={{ uri: qrImageUrl(qr.payload) }} style={styles.qr} />
                  </>
                ) : null}
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={[styles.cardTitle, rtl && styles.end]}>{t.scans}</Text>
              <Text style={styles.hint}>{scanned.length}</Text>
              {!scanned.length ? <Text style={styles.empty}>{t.noScans}</Text> : null}
              {scanned.map((player) => (
                <Text key={player.playerId} style={styles.line}>{player.playerName} · {player.checkedInAt.slice(11, 16)}</Text>
              ))}
            </View>
            {detail?.status === 'SCHEDULED' ? <Text style={styles.banner}>{t.scheduled}</Text> : null}
            {detail?.status === 'COMPLETED' ? <Text style={styles.done}>{t.locked}</Text> : null}
            <View style={styles.card}>
              <Text style={[styles.cardTitle, rtl && styles.end]}>{detail?.methodologyName}</Text>
              <Text style={styles.hint}>{detail?.coachName}{detail?.location ? ` · ${detail.location}` : ''}</Text>
              {(detail?.players ?? []).map((player) => (
                <View key={player.playerId} style={styles.player}>
                  <Text style={styles.line}>{player.playerName}</Text>
                  <Text style={styles.hint}>{player.attendanceStatus === 'ATTENDED' ? t.present : t.absent} · {player.total}</Text>
                </View>
              ))}
              {staff && live ? <PinkButton label={t.cancel} onPress={cancel} /> : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.cardTitle}>{t.create}</Text>
            <DropDown
              label={t.group}
              value={form.groupId}
              placeholder={t.group}
              options={squads.map((group) => ({ id: group.id, label: group.name }))}
              onChange={(groupId) => setForm({ ...form, groupId })}
            />
            <DropDown
              label={t.method}
              value={form.methodologyId}
              placeholder={t.method}
              options={methods.map((item) => ({ id: item.id, label: item.name }))}
              onChange={(methodologyId) => setForm({ ...form, methodologyId })}
            />
            <Field label={t.date} value={form.date} onChange={(date) => setForm({ ...form, date })} placeholder="YYYY-MM-DD" />
            <Field label={t.start} value={form.startTime} onChange={(startTime) => setForm({ ...form, startTime })} placeholder="18:00" />
            <Field label={t.end} value={form.endTime} onChange={(endTime) => setForm({ ...form, endTime })} placeholder="19:30" />
            <Field label={t.location} value={form.location} onChange={(location) => setForm({ ...form, location })} />
            <View style={styles.actions}>
              <PinkButton label={t.save} onPress={() => void saveTraining()} disabled={busy} />
              <WhiteButton label={t.close} onPress={() => setFormOpen(false)} />
            </View>
          </ScrollView>
        </View>
      </Modal>
      <AppTabBar active="training" />
    </SafeAreaView>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.hint}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  reverse: { flexDirection: 'row-reverse' },
  titles: { flex: 1, gap: 4 },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  end: { textAlign: 'right' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  card: { backgroundColor: ink.card, borderRadius: 16, borderWidth: 1, borderColor: ink.line, padding: 14, gap: 10 },
  cardTitle: { color: ink.text, fontSize: 18, fontWeight: '800' },
  notice: { color: '#ffd1dc', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 8, gap: 8 },
  head: { width: 110, color: ink.muted, fontSize: 12, fontWeight: '800' },
  cell: { width: 110, color: ink.text, fontSize: 13 },
  empty: { color: ink.muted, paddingVertical: 12 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '47%', backgroundColor: ink.card, borderRadius: 14, borderWidth: 1, borderColor: ink.line, padding: 12, gap: 4 },
  statValue: { color: ink.text, fontSize: 22, fontWeight: '800' },
  qr: { width: 220, height: 220, alignSelf: 'center', backgroundColor: '#fff' },
  line: { color: ink.text, fontSize: 14, fontWeight: '700' },
  player: { borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 8 },
  banner: { color: '#9ecbff', backgroundColor: '#172433', borderRadius: 12, padding: 12 },
  done: { color: '#b7e7cc', backgroundColor: '#143024', borderRadius: 12, padding: 12 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '88%' },
});
