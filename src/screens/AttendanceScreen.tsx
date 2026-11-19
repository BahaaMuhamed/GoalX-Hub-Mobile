import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listCompletedSessions, loadAttendance, type CompletedSession } from '@/api/attendance';
import { listBranches, type BranchOption } from '@/api/dashboard';
import { errorMessage } from '@/api/errors';
import type { SessionDetail } from '@/api/training';
import { AppTabBar } from '@/components/AppTabBar';
import { HScroll, ink } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

export function AttendanceScreen() {
  const { lang } = useLocale();
  const ar = lang === 'ar';
  const workspace = useWorkspace();
  const academyId = workspace.academies[0]?.id || '';
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState('');
  const [rows, setRows] = useState<CompletedSession[]>([]);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const t = ar
    ? {
        title: 'حضور التدريب',
        hint: 'الجلسات المكتملة. اضغط الجلسة لعرض من حضر ومن غاب.',
        academy: 'الأكاديمية',
        branch: 'الفرع',
        load: 'تحميل الفرع',
        sessions: 'جلسات التدريب',
        cols: ['التاريخ', 'الوقت', 'الفرع', 'المجموعة', 'الحضور'],
        empty: 'لا توجد جلسات تدريب مكتملة لهذا الفرع.',
        player: 'اللاعب',
        scan: 'وقت المسح',
        status: 'الحضور',
        present: 'حاضر',
        absent: 'غائب',
        close: 'إغلاق',
      }
    : {
        title: 'Training attendance',
        hint: 'Completed sessions. Tap a session to see who attended and who was absent.',
        academy: 'Academy',
        branch: 'Branch',
        load: 'Load branch',
        sessions: 'Training sessions',
        cols: ['Date', 'Time', 'Branch', 'Group', 'Attendance'],
        empty: 'No completed training sessions for this branch.',
        player: 'Player',
        scan: 'Scan time',
        status: 'Attendance',
        present: 'Present',
        absent: 'Absent',
        close: 'Close',
      };

  const load = useCallback(async (selected: string) => {
    setLoading(true);
    setNotice('');
    try {
      const [list, sessions] = await Promise.all([
        listBranches(academyId, workspace.organizationId),
        listCompletedSessions(selected),
      ]);
      setBranches(list);
      setRows(sessions);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load attendance'));
    } finally {
      setLoading(false);
    }
  }, [academyId, workspace.organizationId]);

  useFocusEffect(useCallback(() => { void load(branchId); }, [load, branchId]));

  async function open(session: CompletedSession) {
    setNotice('');
    try {
      setDetail(await loadAttendance(session.id));
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load this session'));
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <View style={styles.card}>
          <Text style={styles.label}>{t.academy}</Text>
          <Text style={styles.value}>{workspace.brandName}</Text>
          <DropDown label={t.branch} value={branchId} placeholder={t.branch} options={branches.map((item) => ({ id: item.id, label: item.name }))} onChange={setBranchId} />
          <Pressable style={styles.smallPink} onPress={() => void load(branchId)}><Text style={styles.smallText}>{t.load}</Text></Pressable>
        </View>
        <View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.hint}>{t.hint}</Text>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading ? <ActivityIndicator color={ink.pink} /> : null}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.sessions}</Text>
          <HScroll>
            <View>
              <View style={styles.headerRow}>
                {t.cols.map((label) => <Text key={label} style={styles.head}>{label}</Text>)}
              </View>
              {!loading && !rows.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
              {rows.map((item) => (
                <Pressable key={item.id} style={styles.row} onPress={() => void open(item)}>
                  <Text style={styles.cell}>{item.trainingDate || '—'}</Text>
                  <Text style={styles.cell}>{item.startTime}{item.endTime ? `–${item.endTime}` : ''}</Text>
                  <Text style={styles.cell}>{item.branchName}</Text>
                  <Text style={styles.cell}>{item.groupName}</Text>
                  <Text style={styles.cell}>{item.presentCount}/{item.playerCount}</Text>
                </Pressable>
              ))}
            </View>
          </HScroll>
        </View>
      </ScrollView>
      <Modal visible={detail !== null} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 10 }}>
            <Text style={styles.cardTitle}>{t.title}</Text>
            <Text style={styles.meta}>{detail?.groupName} · {detail?.trainingDate} · {detail?.startTime}</Text>
            <Text style={styles.meta}>{t.present} {detail?.presentCount ?? 0} · {t.absent} {detail?.absentCount ?? 0}</Text>
            <View style={styles.headerRow}>
              <Text style={styles.head}>{t.player}</Text>
              <Text style={styles.head}>{t.scan}</Text>
              <Text style={styles.head}>{t.status}</Text>
            </View>
            {!detail?.players.length ? <Text style={styles.empty}>—</Text> : null}
            {detail?.players.map((player) => {
              const present = player.attendanceStatus === 'ATTENDED';
              return (
                <View key={player.playerId} style={styles.row}>
                  <Text style={styles.cell}>{player.playerName || '—'}</Text>
                  <Text style={styles.cell}>{player.checkedInAt ? player.checkedInAt.slice(11, 16) : '—'}</Text>
                  <Text style={[styles.cell, present ? styles.good : styles.bad]}>{present ? t.present : t.absent}</Text>
                </View>
              );
            })}
            <Pressable style={styles.smallPink} onPress={() => setDetail(null)}><Text style={styles.smallText}>{t.close}</Text></Pressable>
          </ScrollView>
        </View>
      </Modal>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  card: { backgroundColor: ink.card, borderRadius: 16, borderWidth: 1, borderColor: ink.line, padding: 14, gap: 10 },
  label: { color: ink.muted, fontSize: 12, fontWeight: '700' },
  value: { color: ink.text, fontSize: 16, fontWeight: '800' },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  notice: { color: '#ffd1dc', fontSize: 13 },
  cardTitle: { color: ink.text, fontSize: 18, fontWeight: '800' },
  smallPink: { alignSelf: 'flex-start', minHeight: 32, paddingHorizontal: 12, borderRadius: 8, backgroundColor: ink.pink, alignItems: 'center', justifyContent: 'center' },
  smallText: { color: ink.white, fontSize: 12, fontWeight: '800' },
  headerRow: { flexDirection: 'row', backgroundColor: ink.pink, borderRadius: 8, paddingVertical: 8 },
  head: { width: 110, color: ink.white, fontSize: 12, fontWeight: '800', paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 10 },
  cell: { width: 110, color: ink.text, fontSize: 13, paddingHorizontal: 8 },
  empty: { color: ink.muted, padding: 12 },
  meta: { color: ink.muted, fontSize: 13 },
  good: { color: '#8ee0b0' },
  bad: { color: '#ffb4b4' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '88%' },
});
