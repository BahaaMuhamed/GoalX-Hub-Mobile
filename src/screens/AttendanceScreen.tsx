import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  generateAttendanceQr,
  listAttendanceTeams,
  loadPlayerAttendance,
  loadStaffBoard,
  type AttendanceTeam,
  type LedgerRecord,
  type PlayerAttendance,
  type RosterPlayer,
  type StaffBoard,
  type StaffSessionRow,
} from '@/api/attendance';
import { errorMessage } from '@/api/errors';
import { listAdvertisements, loadNoticeBar, type AdCard, type NoticeBar } from '@/api/feed';
import { useAuth } from '@/auth/AuthContext';
import { AdBanner } from '@/components/AdBanner';
import { AppTabBar } from '@/components/AppTabBar';
import { HScroll, ink } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

const emptyBoard: StaffBoard = { sessions: [], roster: [], records: [] };
const emptyNotices: NoticeBar = { ending: 0, waiting: 0, announcements: 0 };
const qrRoles = new Set(['COACH', 'ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE']);

export function AttendanceScreen() {
  const { lang } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const workspace = useWorkspace();
  const playerView = profile?.role === 'PLAYER';
  const canGenerate = qrRoles.has(profile?.role ?? '');
  const academyId = workspace.academies[0]?.id || '';
  const [ads, setAds] = useState<AdCard[]>([]);
  const [notices, setNotices] = useState<NoticeBar>(emptyNotices);
  const [attendance, setAttendance] = useState<PlayerAttendance | null>(null);
  const [teams, setTeams] = useState<AttendanceTeam[]>([]);
  const [teamId, setTeamId] = useState('');
  const [board, setBoard] = useState<StaffBoard>(emptyBoard);
  const [selected, setSelected] = useState<StaffSessionRow | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');

  const t = ar
    ? {
        title: 'حضور التدريب',
        playerHint: 'الجلسات المستهلكة وتاريخ نهاية العقد وسجل حضورك.',
        staffHint: 'يُسجَّل الحضور عندما يمسح اللاعب رمز QR الخاص بالجلسة.',
        percent: 'الحضور',
        consumed: 'الجلسات المستهلكة',
        contract: 'تاريخ انتهاء العقد',
        history: 'سجل الحضور',
        date: 'التاريخ',
        scan: 'وقت المسح',
        status: 'الحالة',
        empty: 'لا توجد سجلات حضور للاعبين المحمّلين.',
        attended: 'حاضر',
        absent: 'غائب',
        sessions: 'جلسات التدريب',
        time: 'الوقت',
        branch: 'الفرع',
        group: 'المجموعة',
        attendance: 'الحضور',
        noSessions: 'لا توجد جلسات تدريب لهذا الفرع بعد.',
        upcoming: 'قادمة',
        live: 'جارية',
        completed: 'مكتملة',
        detail: 'حضور التدريب',
        scanner: 'ماسح QR يعمل. يمسح اللاعبون ليُسجَّل حضورهم.',
        generate: 'إنشاء رمز QR',
        qrActive: 'رمز QR نشط لهذه الجلسة.',
        qrToken: 'رمز QR:',
        player: 'اللاعب',
        close: 'إغلاق',
        endingOne: 'اشتراك سينتهي قريباً.',
        endingMany: (count: number) => `${count} اشتراكات ستنتهي قريباً.`,
        requestOne: 'طلب تسجيل واحد بانتظار القرار.',
        requestMany: (count: number) => `${count} طلبات تسجيل بانتظار القرار.`,
        announcements: 'إعلانات الموسم من المنصة.',
        summary: 'طلبات التسجيل والاشتراكات وإعلانات المنصة.',
      }
    : {
        title: 'Training Attendance',
        playerHint: 'Sessions used, contract end date, and your attendance history.',
        staffHint: 'Attendance is recorded when a player scans the session QR code.',
        percent: 'Attendance',
        consumed: 'Sessions consumed',
        contract: 'Contract end date',
        history: 'Attendance history',
        date: 'Date',
        scan: 'Scan time',
        status: 'STATUS',
        empty: 'No attendance records for loaded players.',
        attended: 'Attended',
        absent: 'Absent',
        sessions: 'Training sessions',
        time: 'Time',
        branch: 'Branch',
        group: 'Group',
        attendance: 'Attendance',
        noSessions: 'No training sessions for this branch yet.',
        upcoming: 'Upcoming',
        live: 'In progress',
        completed: 'Completed',
        detail: 'Training attendance',
        scanner: 'QR scanner is active. Players scan to be marked attended.',
        generate: 'Generate QR code',
        qrActive: 'QR code is active for this session.',
        qrToken: 'QR token:',
        player: 'PLAYER',
        close: 'Close',
        endingOne: 'A subscription will end soon.',
        endingMany: (count: number) => `${count} subscriptions will end soon.`,
        requestOne: '1 registration request is waiting for a decision.',
        requestMany: (count: number) => `${count} registration requests are waiting for a decision.`,
        announcements: 'Season announcements from the platform.',
        summary: 'Registration requests, subscriptions and platform announcements.',
      };

  const load = useCallback(async (selectedTeam: string, pull: boolean) => {
    if (pull) setRefreshing(true);
    else setLoading(true);
    setNotice('');
    try {
      const [adRows, bar] = await Promise.all([
        listAdvertisements().catch(() => [] as AdCard[]),
        loadNoticeBar(),
      ]);
      setAds(adRows);
      setNotices(bar);
      if (playerView) {
        setAttendance(await loadPlayerAttendance());
        return;
      }
      const list = await listAttendanceTeams(profile?.role ?? '', workspace.organizationId, academyId);
      setTeams(list);
      const id = selectedTeam && list.some((item) => item.id === selectedTeam) ? selectedTeam : list[0]?.id || '';
      if (id !== selectedTeam) setTeamId(id);
      setBoard(id ? await loadStaffBoard(id, workspace.organizationId, list) : emptyBoard);
    } catch (error) {
      setNotice(errorMessage(error, ar ? 'تعذر تحميل الحضور' : 'Could not load attendance'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [academyId, ar, playerView, profile?.role, workspace.organizationId]);

  useFocusEffect(useCallback(() => {
    void load(teamId, false);
  }, [load, teamId]));

  function summary(): string {
    if (notices.ending === 1) return t.endingOne;
    if (notices.ending > 1) return t.endingMany(notices.ending);
    if (notices.waiting === 1) return t.requestOne;
    if (notices.waiting > 1) return t.requestMany(notices.waiting);
    if (notices.announcements) return t.announcements;
    return t.summary;
  }

  const badge = notices.ending + notices.waiting;

  async function openQr(session: StaffSessionRow) {
    setNotice('');
    try {
      setQrToken(await generateAttendanceQr(session.id));
    } catch (error) {
      setNotice(errorMessage(error, ar ? 'تعذر إنشاء رمز QR' : 'QR generation failed'));
    }
  }

  function openSession(session: StaffSessionRow) {
    setQrToken('');
    setSelected(session);
  }

  const phaseLabel = (session: StaffSessionRow) => {
    const kind = phaseOf(session);
    if (kind === 'upcoming') return t.upcoming;
    if (kind === 'live') return t.live;
    return t.completed;
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(teamId, true)} tintColor={ink.text} />}
      >
        <ScreenBack />
        <AdBanner ads={ads} accent={workspace.accent || '#19a967'} />
        <Pressable style={styles.noticeBar} onPress={() => router.push('/notifications')}>
          <View style={styles.bell}><Text style={styles.bellIcon}>🔔</Text></View>
          <Text style={styles.noticeText} numberOfLines={2}>{summary()}</Text>
          {badge > 0 ? (
            <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
          ) : null}
        </Pressable>

        <View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.hint}>{playerView ? t.playerHint : t.staffHint}</Text>
        </View>
        {notice ? <Text style={styles.error}>{notice}</Text> : null}
        {loading && !refreshing ? <ActivityIndicator color={ink.pink} /> : null}

        {playerView ? (
          <>
            <View style={styles.stats}>
              <Stat label={t.percent} value={attendance ? `${attendance.percent}%` : '0%'} />
              <Stat label={t.consumed} value={attendance?.consumedLabel || '0'} />
              <Stat label={t.contract} value={formatStamp(attendance?.contractEnd, ar)} />
            </View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t.history}</Text>
              <View style={styles.head}>
                <Text style={[styles.headText, styles.dateCol]}>{t.date}</Text>
                <Text style={[styles.headText, styles.scanCol]}>{t.scan}</Text>
                <Text style={[styles.headText, styles.statusCol]}>{t.status}</Text>
              </View>
              {!loading && !attendance?.rows.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
              {attendance?.rows.map((row) => {
                const marked = row.status === 'PRESENT' || row.status === 'LATE';
                return (
                  <View key={row.id} style={styles.line}>
                    <Text style={[styles.cell, styles.dateCol]}>{row.checkInTime ? formatStamp(row.checkInTime, ar) : '—'}</Text>
                    <Text style={[styles.cell, styles.scanCol]}>{row.checkInTime ? formatClock(row.checkInTime, ar) : '—'}</Text>
                    <View style={styles.statusCol}>
                      <Text style={[styles.pill, marked ? styles.pillOn : styles.pillOff]}>{marked ? t.attended : t.absent}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.panel}>
            {teams.length > 1 ? (
              <DropDown
                label={t.branch}
                value={teamId}
                placeholder={t.branch}
                options={teams.map((item) => ({ id: item.id, label: item.ageGroup && item.ageGroup !== item.name ? `${item.name} · ${item.ageGroup}` : item.name }))}
                onChange={setTeamId}
              />
            ) : null}
            <Text style={styles.panelTitle}>{t.sessions}</Text>
            <HScroll>
              <View>
                <View style={styles.head}>
                  {[t.date, t.time, t.branch, t.group, t.status, t.attendance].map((label) => (
                    <Text key={label} style={[styles.headText, styles.wide]}>{label}</Text>
                  ))}
                </View>
                {!loading && !board.sessions.length ? <Text style={styles.empty}>{t.noSessions}</Text> : null}
                {board.sessions.map((session) => (
                  <Pressable key={session.id} style={styles.line} onPress={() => openSession(session)}>
                    <Text style={[styles.cell, styles.wide]}>{formatStamp(session.scheduledStart, ar)}</Text>
                    <Text style={[styles.cell, styles.wide]}>
                      {formatClock(session.scheduledStart, ar)}{session.scheduledEnd ? `–${formatClock(session.scheduledEnd, ar)}` : ''}
                    </Text>
                    <Text style={[styles.cell, styles.wide]}>{session.branchName}</Text>
                    <Text style={[styles.cell, styles.wide]}>{session.groupName}</Text>
                    <Text style={[styles.cell, styles.wide]}>{phaseLabel(session)}</Text>
                    <Text style={[styles.cell, styles.wide]}>{countLabel(session, board.records, board.roster.length)}</Text>
                  </Pressable>
                ))}
              </View>
            </HScroll>
          </View>
        )}
      </ScrollView>

      <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetBody}>
            <Text style={styles.panelTitle}>{t.detail}</Text>
            {selected ? (
              <Text style={styles.meta}>
                {(selected.title || selected.groupName)} · {formatStamp(selected.scheduledStart, ar)} · {formatClock(selected.scheduledStart, ar)}
                {selected.scheduledEnd ? ` – ${formatClock(selected.scheduledEnd, ar)}` : ''}
              </Text>
            ) : null}
            {selected ? <Text style={[styles.pill, phaseOf(selected) === 'live' ? styles.pillLive : styles.pillOn]}>{phaseLabel(selected)}</Text> : null}
            {selected && phaseOf(selected) === 'live' ? (
              <View style={styles.liveBox}>
                <Text style={styles.meta}>{t.scanner}</Text>
                {canGenerate ? (
                  <Pressable style={styles.qrButton} onPress={() => void openQr(selected)}>
                    <Text style={styles.qrButtonText}>{t.generate}</Text>
                  </Pressable>
                ) : null}
                {qrToken ? <Text style={styles.meta}>{t.qrActive}{'\n'}{t.qrToken} {qrToken}</Text> : null}
              </View>
            ) : null}
            <View style={styles.head}>
              <Text style={[styles.headText, styles.nameCol]}>{t.player}</Text>
              <Text style={[styles.headText, styles.scanCol]}>{t.scan}</Text>
              <Text style={[styles.headText, styles.statusCol]}>{t.status}</Text>
            </View>
            {selected && !rosterRows(selected.id, board.roster, board.records, ar).length ? <Text style={styles.empty}>{t.empty}</Text> : null}
            {selected ? rosterRows(selected.id, board.roster, board.records, ar).map((row) => (
              <View key={row.playerId} style={styles.line}>
                <Text style={[styles.cell, styles.nameCol]}>{row.name}</Text>
                <Text style={[styles.cell, styles.scanCol]}>{row.scanTime}</Text>
                <View style={styles.statusCol}>
                  <Text style={[styles.pill, row.attended ? styles.pillOn : styles.pillOff]}>{row.attended ? t.attended : t.absent}</Text>
                </View>
              </View>
            )) : null}
            <Pressable style={styles.qrButton} onPress={() => setSelected(null)}>
              <Text style={styles.qrButtonText}>{t.close}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function phaseOf(session: StaffSessionRow): 'upcoming' | 'live' | 'completed' {
  const start = new Date(session.scheduledStart).getTime();
  const end = session.scheduledEnd ? new Date(session.scheduledEnd).getTime() : start + 90 * 60 * 1000;
  const now = Date.now();
  const status = session.status;
  if (status === 'COMPLETED' || status === 'APPROVED' || status === 'LOCKED' || status === 'PENDING_APPROVAL') return 'completed';
  if (Number.isFinite(start) && now < start) return 'upcoming';
  if ((Number.isFinite(end) && now <= end) || status === 'IN_PROGRESS' || status === 'LIVE') return 'live';
  return 'completed';
}

function attendedStatus(status: string): boolean {
  return status === 'PRESENT' || status === 'LATE' || status === 'ATTENDED';
}

function countLabel(session: StaffSessionRow, records: LedgerRecord[], rosterSize: number): string {
  if (phaseOf(session) === 'upcoming') return '—';
  const mine = records.filter((row) => row.trainingSessionId === session.id);
  const present = mine.filter((row) => attendedStatus(row.status)).length;
  const expected = Math.max(mine.length, rosterSize);
  if (!expected) return '—';
  return `${present}/${expected}`;
}

function rosterRows(sessionId: string, roster: RosterPlayer[], records: LedgerRecord[], ar: boolean) {
  const mine = records.filter((row) => row.trainingSessionId === sessionId);
  return roster.map((player) => {
    const match = mine.find((row) => row.playerId === player.id);
    return {
      playerId: player.id,
      name: player.name,
      scanTime: match?.checkInTime ? formatClock(match.checkInTime, ar) : '—',
      attended: !!match && attendedStatus(match.status),
    };
  });
}

function formatStamp(value: string | undefined, ar: boolean): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(ar ? 'ar-EG' : 'en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

function formatClock(value: string | undefined, ar: boolean): string {
  if (!value) return '—';
  const clock = /^(\d{2}):(\d{2})/.exec(value);
  if (clock && !value.includes('T') && !value.includes('-')) return `${clock[1]}:${clock[2]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(ar ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a201e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,45,106,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,106,0.55)',
  },
  bellIcon: { fontSize: 16 },
  noticeText: { flex: 1, color: '#f4f7f6', fontSize: 15, fontWeight: '600' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: ink.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: ink.white, fontSize: 11, fontWeight: '800' },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  error: { color: '#ffd1dc', fontSize: 13 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: ink.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ink.line,
    paddingHorizontal: 10,
    paddingVertical: 14,
    gap: 8,
    minHeight: 92,
  },
  statLabel: { color: ink.muted, fontSize: 11, fontWeight: '600' },
  statValue: { color: ink.white, fontSize: 20, fontWeight: '800' },
  panel: {
    backgroundColor: ink.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ink.line,
    padding: 14,
    gap: 10,
  },
  panelTitle: { color: ink.text, fontSize: 18, fontWeight: '800' },
  head: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2420', borderRadius: 8, paddingVertical: 10 },
  headText: { color: ink.muted, fontSize: 12, fontWeight: '700', paddingHorizontal: 8 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: ink.line },
  cell: { color: ink.text, fontSize: 13, paddingHorizontal: 8 },
  dateCol: { flex: 1.3 },
  scanCol: { flex: 0.9 },
  statusCol: { flex: 0.9, paddingHorizontal: 8 },
  nameCol: { flex: 1.4 },
  wide: { width: 120 },
  empty: { color: ink.muted, fontSize: 14, paddingVertical: 14, paddingHorizontal: 8 },
  pill: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: '800' },
  pillOn: { backgroundColor: '#e8f8ef', color: '#159b60' },
  pillOff: { backgroundColor: '#fff1f1', color: '#aa3333' },
  pillLive: { backgroundColor: '#fff6e8', color: '#b86a12' },
  meta: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  liveBox: { gap: 8 },
  qrButton: { alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#19a967', alignItems: 'center', justifyContent: 'center' },
  qrButtonText: { color: ink.white, fontSize: 13, fontWeight: '800' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '88%' },
  sheetBody: { padding: 16, gap: 10 },
});
