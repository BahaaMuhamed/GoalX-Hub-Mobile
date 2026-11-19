import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listBranches, type BranchOption } from '@/api/dashboard';
import { errorMessage } from '@/api/errors';
import { canSeeStaffReport, clock, formatHours, loadStaffReport, type StaffEmployee, type StaffReport } from '@/api/staffAttendance';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, HScroll, ink } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

function iso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function StaffAttendanceScreen() {
  const { lang } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const reportMode = canSeeStaffReport(profile?.role ?? '');
  const workspace = useWorkspace();
  const academyId = workspace.academies[0]?.id || '';
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(iso(now));
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [report, setReport] = useState<StaffReport | null>(null);
  const [openId, setOpenId] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const filters = useRef({ from, to, branchId });
  filters.current = { from, to, branchId };

  const t = ar
    ? {
        title: 'حضور الموظفين',
        hint: 'أوقات حضور وانتهاء المدربين والموظفين الإداريين.',
        from: 'من',
        to: 'إلى',
        branch: 'الفرع',
        all: 'كل الفروع',
        apply: 'عرض',
        days: 'أيام الحضور',
        missingDays: 'الأيام الناقصة',
        missingHours: 'الساعات الناقصة',
        cols: ['الموظف', 'الدور', 'وقت الحضور', 'وقت الانتهاء', 'الساعات الناقصة', 'الأيام الناقصة', 'أيام الحضور'],
        dayCols: ['التاريخ', 'الفرع', 'وقت الحضور', 'وقت الانتهاء', 'الساعات الناقصة'],
        empty: 'لا يوجد مدربون أو موظفون إداريون في هذه الأكاديمية.',
        loading: 'جارٍ التحميل…',
        mine: 'حضوري',
      }
    : {
        title: 'Employee attendance',
        hint: 'Check-in and finish times for coaches and administrative staff.',
        from: 'From',
        to: 'To',
        branch: 'Branch',
        all: 'All branches',
        apply: 'Show',
        days: 'Days attended',
        missingDays: 'Missing days',
        missingHours: 'Missing hours',
        cols: ['Employee', 'Role', 'Attendance', 'Finish', 'Missing hours', 'Missing days', 'Days attended'],
        dayCols: ['Date', 'Branch', 'Attendance', 'Finish', 'Missing hours'],
        empty: 'No coaches or administrative staff in this academy.',
        loading: 'Loading…',
        mine: 'My attendance',
      };

  const load = useCallback(async () => {
    const current = filters.current;
    setLoading(true);
    setNotice('');
    try {
      const [list, body] = await Promise.all([
        listBranches(academyId, workspace.organizationId),
        loadStaffReport({
          mine: !reportMode,
          organizationId: workspace.organizationId,
          academyId,
          branchId: current.branchId,
          from: current.from,
          to: current.to,
        }),
      ]);
      setBranches(list);
      setReport(body);
    } catch (error) {
      setReport(null);
      setNotice(errorMessage(error, 'Could not load employee attendance'));
    } finally {
      setLoading(false);
    }
  }, [academyId, reportMode, workspace.organizationId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const employees = report?.employees ?? [];
  const attended = employees.reduce((sum, row) => sum + row.daysAttended, 0);
  const missingDays = employees.reduce((sum, row) => sum + row.missingDays, 0);
  const missingHours = employees.reduce((sum, row) => sum + row.missingHours, 0);

  function roleLabel(role: string): string {
    if (!ar) return role || '—';
    if (role === 'COACH') return 'مدرب';
    if (role === 'ADMINISTRATIVE') return 'إداري';
    return role || '—';
  }

  function renderEmployee(row: StaffEmployee) {
    const open = openId === row.userId;
    return (
      <View key={row.userId}>
        <Pressable style={styles.row} onPress={() => setOpenId(open ? '' : row.userId)}>
          <Text style={styles.cell}>{row.fullName}</Text>
          <Text style={styles.cell}>{roleLabel(row.role)}</Text>
          <Text style={styles.cell}>{clock(row.attendanceTime)}</Text>
          <Text style={styles.cell}>{clock(row.finishTime)}</Text>
          <Text style={styles.cell}>{formatHours(row.missingHours)}</Text>
          <Text style={styles.cell}>{row.missingDays}</Text>
          <Text style={styles.cell}>{row.daysAttended}</Text>
        </Pressable>
        {open ? (
          <View style={styles.nested}>
            <View style={styles.headerRow}>
              {t.dayCols.map((label) => <Text key={label} style={styles.head}>{label}</Text>)}
            </View>
            {!row.days.length ? <Text style={styles.empty}>—</Text> : null}
            {row.days.map((day) => (
              <View key={`${row.userId}-${day.workDate}`} style={styles.row}>
                <Text style={styles.cell}>{day.workDate || '—'}</Text>
                <Text style={styles.cell}>{day.branchName || '—'}</Text>
                <Text style={styles.cell}>{clock(day.attendanceTime)}</Text>
                <Text style={styles.cell}>{clock(day.finishTime)}</Text>
                <Text style={styles.cell}>{formatHours(day.missingHours)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.hint}>{t.hint}</Text>
        </View>
        <View style={styles.card}>
          <Field label={t.from} value={from} onChange={setFrom} placeholder="YYYY-MM-DD" />
          <Field label={t.to} value={to} onChange={setTo} placeholder="YYYY-MM-DD" />
          {reportMode ? (
            <DropDown label={t.branch} value={branchId} placeholder={t.all} options={branches.map((item) => ({ id: item.id, label: item.name }))} onChange={setBranchId} />
          ) : null}
          <Pressable style={styles.smallPink} onPress={() => void load()}><Text style={styles.smallText}>{t.apply}</Text></Pressable>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading ? <ActivityIndicator color={ink.pink} /> : null}
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.meta}>{t.days}</Text><Text style={styles.statValue}>{attended}</Text></View>
          <View style={styles.stat}><Text style={styles.meta}>{t.missingDays}</Text><Text style={styles.statValue}>{missingDays}</Text></View>
          <View style={styles.stat}><Text style={styles.meta}>{t.missingHours}</Text><Text style={styles.statValue}>{formatHours(missingHours)}</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{reportMode ? t.title : t.mine}</Text>
          <HScroll>
            <View>
              <View style={styles.headerRow}>
                {t.cols.map((label) => <Text key={label} style={styles.head}>{label}</Text>)}
              </View>
              {!loading && !employees.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
              {loading && !employees.length ? <Text style={styles.empty}>{t.loading}</Text> : null}
              {employees.map(renderEmployee)}
            </View>
          </HScroll>
        </View>
      </ScrollView>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  card: { backgroundColor: ink.card, borderRadius: 16, borderWidth: 1, borderColor: ink.line, padding: 14, gap: 10 },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  notice: { color: '#ffd1dc', fontSize: 13 },
  cardTitle: { color: ink.text, fontSize: 18, fontWeight: '800' },
  smallPink: { alignSelf: 'flex-start', minHeight: 32, paddingHorizontal: 14, borderRadius: 8, backgroundColor: ink.pink, alignItems: 'center', justifyContent: 'center' },
  smallText: { color: ink.white, fontSize: 12, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: ink.card, borderRadius: 14, borderWidth: 1, borderColor: ink.line, padding: 10, gap: 4 },
  statValue: { color: ink.text, fontSize: 20, fontWeight: '800' },
  meta: { color: ink.muted, fontSize: 11 },
  headerRow: { flexDirection: 'row', backgroundColor: ink.pink, borderRadius: 8, paddingVertical: 8 },
  head: { width: 110, color: ink.white, fontSize: 11, fontWeight: '800', paddingHorizontal: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 10 },
  cell: { width: 110, color: ink.text, fontSize: 12, paddingHorizontal: 6 },
  empty: { color: ink.muted, padding: 12 },
  nested: { backgroundColor: '#101614', borderRadius: 10, padding: 8, marginBottom: 8 },
});
