import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listBranches, type BranchOption } from '@/api/dashboard';
import {
  createPlayer,
  listGroups,
  listPlayers,
  loadTrainee,
  updatePlayer,
  type GroupRecord,
  type PlayerRecord,
  type TraineeInfo,
} from '@/api/directory';
import { errorMessage } from '@/api/errors';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, FilterInput, GhostButton, HScroll, ink, PinkButton, WhiteButton } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

const blank = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  dateOfBirth: '',
  contractStartDate: '',
  groupId: '',
  active: true,
};

export function PlayersScreen() {
  const { lang, rtl } = useLocale();
  const ar = lang === 'ar';
  const workspace = useWorkspace();
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerRecord | null>(null);
  const [form, setForm] = useState(blank);
  const [trainee, setTrainee] = useState<TraineeInfo | null>(null);

  const t = ar
    ? {
        crumb: 'الأكاديمية / اللاعبون',
        title: 'اللاعبون',
        hint: 'أضف لاعباً إلى الأكاديمية ثم عيّنه لفرع من قائمة المجموعات.',
        academy: 'الأكاديمية',
        branch: 'الفرع',
        load: 'تحميل الفرع',
        add: 'إضافة لاعب',
        refresh: 'تحديث',
        list: 'القائمة',
        cols: ['الاسم', 'الكود', 'الهاتف', 'بداية العقد', 'المجموعة', 'الفرع', 'الحالة', 'النقاط', 'إجراءات'],
        filter: 'تصفية',
        all: 'الكل',
        active: 'نشط',
        inactive: 'غير نشط',
        share: 'الاشتراك',
        edit: 'تعديل',
        empty: 'لا يوجد لاعبون',
        save: 'حفظ',
        cancel: 'إلغاء',
        saved: 'تم الحفظ',
      }
    : {
        crumb: 'Academy / Players',
        title: 'Players',
        hint: 'Add a player to the academy, then assign a branch from the group list.',
        academy: 'Academy',
        branch: 'Branch',
        load: 'Load branch',
        add: 'Add player',
        refresh: 'Refresh',
        list: 'Roster',
        cols: ['Name', 'Code', 'Phone', 'Contract start', 'Group', 'Branch', 'Status', 'Points', 'Actions'],
        filter: 'Filter',
        all: 'All',
        active: 'Active',
        inactive: 'Inactive',
        share: 'Subscription',
        edit: 'Edit',
        empty: 'No players',
        save: 'Save',
        cancel: 'Cancel',
        saved: 'Saved',
      };

  const load = useCallback(async (teamId = branchId) => {
    setLoading(true);
    setNotice('');
    try {
      const org = workspace.organizationId;
      const [roster, squads, branchList] = await Promise.all([
        listPlayers(org, teamId),
        listGroups(org),
        listBranches(workspace.academies[0]?.id || org, org),
      ]);
      setPlayers(roster);
      setGroups(squads);
      setBranches(branchList);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load players'));
    } finally {
      setLoading(false);
    }
  }, [branchId, workspace.academies, workspace.organizationId]);

  useFocusEffect(
    useCallback(() => {
      void load(branchId);
    }, [load, branchId]),
  );

  const visible = useMemo(
    () =>
      players.filter((player) => {
        if (name && !player.fullName.toLowerCase().includes(name.trim().toLowerCase())) return false;
        if (code && !player.playerCode.toLowerCase().includes(code.trim().toLowerCase())) return false;
        if (phone && !player.phone.includes(phone.trim())) return false;
        if (groupId && player.groupId !== groupId) return false;
        if (status === 'active' && !player.active) return false;
        if (status === 'inactive' && player.active) return false;
        return true;
      }),
    [players, name, code, phone, groupId, status],
  );

  function openAdd() {
    setEditing(null);
    setForm({ ...blank, groupId });
    setFormOpen(true);
  }

  function openEdit(player: PlayerRecord) {
    setEditing(player);
    setForm({
      fullName: player.fullName,
      username: '',
      email: player.email,
      password: '',
      phone: player.phone,
      dateOfBirth: player.dateOfBirth,
      contractStartDate: player.contractStartDate,
      groupId: player.groupId,
      active: player.active,
    });
    setFormOpen(true);
  }

  async function save() {
    setBusy(true);
    setNotice('');
    try {
      if (editing) {
        await updatePlayer(editing, {
          phone: form.phone,
          dateOfBirth: form.dateOfBirth,
          contractStartDate: form.contractStartDate,
          groupId: form.groupId,
          teamId: branchId,
          active: form.active,
        });
      } else {
        if (form.password.trim().length < 8 || !form.email.trim() || !form.fullName.trim()) {
          setNotice(ar ? 'الاسم والبريد وكلمة المرور مطلوبة' : 'Name, email, and password are required');
          return;
        }
        await createPlayer({
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone,
          dateOfBirth: form.dateOfBirth,
          organizationId: workspace.organizationId,
          groupId: form.groupId,
          teamId: branchId,
        });
      }
      setFormOpen(false);
      setNotice(t.saved);
      await load(branchId);
    } catch (error) {
      setNotice(errorMessage(error, 'Save failed'));
    } finally {
      setBusy(false);
    }
  }

  async function openTrainee(player: PlayerRecord) {
    setBusy(true);
    try {
      setTrainee(await loadTrainee(player.id));
    } catch (error) {
      setNotice(errorMessage(error, 'Could not open subscription'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <Text style={[styles.crumb, rtl && styles.end]}>{workspace.brandName} / {t.title}</Text>
        <View style={[styles.top, rtl && styles.reverse]}>
          <View style={styles.titles}>
            <Text style={[styles.title, rtl && styles.end]}>{t.title}</Text>
            <Text style={[styles.hint, rtl && styles.end]}>{t.hint}</Text>
          </View>
          <View style={styles.actions}>
            <PinkButton label={t.add} onPress={openAdd} />
            <WhiteButton label={t.refresh} onPress={() => void load(branchId)} />
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.academy}</Text>
          <Text style={styles.cellWide}>{workspace.brandName}</Text>
          <DropDown
            label={t.branch}
            value={branchId}
            placeholder={t.all}
            options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
            onChange={setBranchId}
          />
          <PinkButton label={t.load} onPress={() => void load(branchId)} />
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.list}</Text>
          {loading ? <ActivityIndicator color={ink.pink} style={{ marginTop: 16 }} /> : null}
          <HScroll>
            <View>
              <View style={styles.row}>
                {t.cols.map((label) => (
                  <Text key={label} style={styles.head}>{label}</Text>
                ))}
              </View>
              <View style={styles.row}>
                <FilterInput value={name} onChange={setName} placeholder={t.filter} />
                <FilterInput value={code} onChange={setCode} placeholder={t.filter} />
                <FilterInput value={phone} onChange={setPhone} placeholder={t.filter} />
                <View style={styles.gap} />
                <FilterInput value={groupId} onChange={setGroupId} placeholder={t.all} />
                <View style={styles.gap} />
                <FilterInput value={status} onChange={setStatus} placeholder={t.all} />
                <View style={styles.gap} />
                <Pressable onPress={() => { setName(''); setCode(''); setPhone(''); setGroupId(''); setStatus(''); }}>
                  <Text style={styles.link}>{ar ? 'مسح' : 'Clear'}</Text>
                </Pressable>
              </View>
              {!loading && !visible.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
              {visible.map((player) => (
                <View key={player.id} style={styles.row}>
                  <Text style={styles.cell}>{player.fullName || '—'}</Text>
                  <Text style={styles.cell}>{player.playerCode || '—'}</Text>
                  <Text style={styles.cell}>{player.phone || '—'}</Text>
                  <Text style={styles.cell}>{player.contractStartDate || player.dateOfBirth || '—'}</Text>
                  <Text style={styles.cell}>{player.groupName || '—'}</Text>
                  <Text style={styles.cell}>{player.branchName || '—'}</Text>
                  <Text style={[styles.cell, player.active ? styles.good : styles.bad]}>{player.active ? t.active : t.inactive}</Text>
                  <Text style={[styles.cell, styles.good]}>{player.points}</Text>
                  <View style={styles.rowActions}>
                    <GhostButton label={t.share} onPress={() => void openTrainee(player)} />
                    <GhostButton label={t.edit} onPress={() => openEdit(player)} />
                  </View>
                </View>
              ))}
            </View>
          </HScroll>
          <View style={styles.chips}>
            <Pressable style={[styles.chip, !groupId && styles.chipOn]} onPress={() => setGroupId('')}>
              <Text style={styles.chipText}>{t.all}</Text>
            </Pressable>
            {groups.map((group) => (
              <Pressable key={group.id} style={[styles.chip, groupId === group.id && styles.chipOn]} onPress={() => setGroupId(group.id)}>
                <Text style={styles.chipText}>{group.name}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.chip, status === 'active' && styles.chipOn]} onPress={() => setStatus(status === 'active' ? '' : 'active')}>
              <Text style={styles.chipText}>{t.active}</Text>
            </Pressable>
            <Pressable style={[styles.chip, status === 'inactive' && styles.chipOn]} onPress={() => setStatus(status === 'inactive' ? '' : 'inactive')}>
              <Text style={styles.chipText}>{t.inactive}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.cardTitle}>{editing ? t.edit : t.add}</Text>
            {!editing ? (
              <>
                <Field label={t.cols[0]} value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
                <Field label={ar ? 'اسم المستخدم' : 'Username'} value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
                <Field label={ar ? 'البريد' : 'Email'} value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                <Field label={ar ? 'كلمة المرور' : 'Password'} value={form.password} onChange={(value) => setForm({ ...form, password: value })} secure />
              </>
            ) : null}
            <Field label={t.cols[2]} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label={ar ? 'تاريخ الميلاد' : 'Birth date'} value={form.dateOfBirth} onChange={(value) => setForm({ ...form, dateOfBirth: value })} placeholder="YYYY-MM-DD" />
            <Field label={t.cols[3]} value={form.contractStartDate} onChange={(value) => setForm({ ...form, contractStartDate: value })} placeholder="YYYY-MM-DD" />
            <View style={styles.chips}>
              {groups.map((group) => (
                <Pressable key={group.id} style={[styles.chip, form.groupId === group.id && styles.chipOn]} onPress={() => setForm({ ...form, groupId: group.id })}>
                  <Text style={styles.chipText}>{group.name}</Text>
                </Pressable>
              ))}
              {editing ? (
                <Pressable style={[styles.chip, form.active && styles.chipOn]} onPress={() => setForm({ ...form, active: !form.active })}>
                  <Text style={styles.chipText}>{form.active ? t.active : t.inactive}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.actions}>
              <PinkButton label={t.save} onPress={() => void save()} disabled={busy} />
              <WhiteButton label={t.cancel} onPress={() => setFormOpen(false)} />
            </View>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={!!trainee} animationType="fade" transparent onRequestClose={() => setTrainee(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{trainee?.fullName}</Text>
            <Text style={styles.hint}>{trainee?.playerCode}</Text>
            <Text style={styles.cellWide}>{trainee?.phone || '—'}</Text>
            <Text style={styles.cellWide}>{trainee?.groupName || '—'} · {trainee?.branchName || '—'}</Text>
            <Text style={styles.cellWide}>{trainee?.planName || '—'}</Text>
            <Text style={styles.cellWide}>{trainee?.contractStartDate || '—'} → {trainee?.contractEndDate || '—'}</Text>
            <Text style={styles.cellWide}>{ar ? 'الحصص المتبقية' : 'Remaining'}: {trainee?.remainingSessions || '—'}</Text>
            <Text style={styles.cellWide}>{ar ? 'الحالة' : 'Status'}: {trainee?.paymentStatus || '—'}</Text>
            <Text style={styles.cellWide}>{trainee?.notes || '—'}</Text>
            <WhiteButton label={t.cancel} onPress={() => setTrainee(null)} />
          </View>
        </View>
      </Modal>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  crumb: { color: ink.muted, fontSize: 12, fontWeight: '700' },
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
  fileName: { color: ink.muted, fontSize: 12, maxWidth: 140 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 8, gap: 8 },
  head: { width: 120, color: ink.muted, fontSize: 12, fontWeight: '800' },
  cell: { width: 120, color: ink.text, fontSize: 13 },
  cellWide: { color: ink.text, fontSize: 14 },
  rowActions: { width: 190, flexDirection: 'row', gap: 6 },
  gap: { width: 120 },
  link: { color: ink.pink, fontWeight: '800', width: 70 },
  empty: { color: ink.muted, paddingVertical: 16 },
  good: { color: '#8ee0b0' },
  bad: { color: '#ffb4b4' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: ink.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: ink.pink, borderColor: ink.pink },
  chipText: { color: ink.text, fontSize: 12, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '88%', gap: 8 },
});
