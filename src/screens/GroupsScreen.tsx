import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  canManageBranches,
  listBranchCards,
  listGroupMembers,
  listGroupsInBranch,
  removeGroup,
  saveBranch,
  saveGroup,
  type AcademyGroupCard,
  type BranchCard,
  type GroupMember,
} from '@/api/branches';
import { listUsers, type StaffUser } from '@/api/directory';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, ink, PinkButton, WhiteButton } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

export function GroupsScreen() {
  const { lang } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const canManage = canManageBranches(profile?.role ?? '');
  const workspace = useWorkspace();
  const academyId = workspace.academies[0]?.id || '';
  const [branches, setBranches] = useState<BranchCard[]>([]);
  const [groups, setGroups] = useState<AcademyGroupCard[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [branchId, setBranchId] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [openGroup, setOpenGroup] = useState<AcademyGroupCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [branchForm, setBranchForm] = useState<{ id: string; name: string; ageGroup: string; address: string } | null>(null);
  const [groupForm, setGroupForm] = useState<{ id: string; name: string; description: string } | null>(null);

  const t = ar
    ? {
        title: 'الفروع والمجموعات',
        hint: 'أنشئ فرعاً للأكاديمية ثم أنشئ مجموعات صغيرة داخله.',
        academy: 'الأكاديمية',
        branch: 'الفرع',
        load: 'تحميل الفرع',
        branches: 'الفروع',
        groups: 'المجموعات',
        createBranch: 'إنشاء فرع',
        createGroup: 'إنشاء مجموعة',
        pickFirst: 'اختر فرعاً أولاً ثم أنشئ المجموعات داخله.',
        emptyGroups: 'لا توجد مجموعات في هذا الفرع بعد.',
        emptyBranches: 'لا توجد فروع',
        name: 'اسم الفرع',
        age: 'الفئة العمرية',
        address: 'العنوان',
        groupName: 'اسم المجموعة',
        description: 'الوصف',
        save: 'حفظ',
        close: 'إلغاء',
        members: 'الأعضاء',
        remove: 'حذف',
      }
    : {
        title: 'Branches & groups',
        hint: 'Create a branch, then create the small groups inside it.',
        academy: 'Academy',
        branch: 'Branch',
        load: 'Load branch',
        branches: 'Branches',
        groups: 'Groups',
        createBranch: 'Create branch',
        createGroup: 'Create group',
        pickFirst: 'Choose a branch first, then create the groups inside it.',
        emptyGroups: 'No groups in this branch yet.',
        emptyBranches: 'No branches',
        name: 'Branch name',
        age: 'Age group',
        address: 'Address',
        groupName: 'Group name',
        description: 'Description',
        save: 'Save',
        close: 'Cancel',
        members: 'Members',
        remove: 'Remove',
      };

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const [cards, people] = await Promise.all([
        listBranchCards(academyId, workspace.organizationId),
        listUsers(workspace.organizationId).catch(() => [] as StaffUser[]),
      ]);
      setBranches(cards);
      setStaff(people);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load branches'));
    } finally {
      setLoading(false);
    }
  }, [academyId, workspace.organizationId]);

  const loadGroups = useCallback(async (id: string) => {
    if (!id) {
      setGroups([]);
      return;
    }
    try {
      setGroups(await listGroupsInBranch(id));
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load groups'));
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadBranches(); }, [loadBranches]));

  function person(id: string): string {
    return staff.find((item) => item.id === id)?.fullName || '';
  }

  async function openMembers(group: AcademyGroupCard) {
    setOpenGroup(group);
    setMembers([]);
    try {
      setMembers(await listGroupMembers(group.id));
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load members'));
    }
  }

  async function submitBranch() {
    if (!branchForm?.name.trim() || !academyId) {
      setNotice(ar ? 'اسم الفرع والأكاديمية مطلوبان' : 'Branch name and academy are required');
      return;
    }
    setBusy(true);
    try {
      await saveBranch({
        id: branchForm.id || undefined,
        name: branchForm.name,
        ageGroup: branchForm.ageGroup,
        address: branchForm.address,
        academyId,
        organizationId: workspace.organizationId,
        headCoachId: '',
        administrativeId: '',
      });
      setBranchForm(null);
      await loadBranches();
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save the branch'));
    } finally {
      setBusy(false);
    }
  }

  async function submitGroup() {
    if (!groupForm?.name.trim() || !branchId) {
      setNotice(ar ? 'اختر الفرع واكتب اسم المجموعة' : 'Choose a branch and a group name');
      return;
    }
    setBusy(true);
    try {
      await saveGroup({
        id: groupForm.id || undefined,
        branchId,
        name: groupForm.name,
        description: groupForm.description,
        headCoachId: '',
        administrativeId: '',
      });
      setGroupForm(null);
      await loadGroups(branchId);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save the group'));
    } finally {
      setBusy(false);
    }
  }

  function askRemove(group: AcademyGroupCard) {
    Alert.alert(group.name, ar ? 'حذف المجموعة؟' : 'Remove this group?', [
      { text: t.close, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: () => {
          void removeGroup(group.id).then(() => loadGroups(branchId)).catch((error) => setNotice(errorMessage(error, 'Could not remove')));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <View style={styles.card}>
          <Text style={styles.label}>{t.academy}</Text>
          <Text style={styles.value}>{workspace.brandName}</Text>
          <DropDown label={t.branch} value={branchId} placeholder={t.branch} options={branches.map((item) => ({ id: item.id, label: item.ageGroup ? `${item.name} · ${item.ageGroup}` : item.name }))} onChange={setBranchId} />
          <Pressable style={styles.smallPink} onPress={() => void loadGroups(branchId)}><Text style={styles.smallText}>{t.load}</Text></Pressable>
        </View>
        <View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.hint}>{t.hint}</Text>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading ? <ActivityIndicator color={ink.pink} /> : null}
        <View style={styles.card}>
          <View style={styles.top}>
            <Text style={styles.cardTitle}>{t.branches}</Text>
            {canManage ? <Pressable style={styles.smallPink} onPress={() => setBranchForm({ id: '', name: '', ageGroup: '', address: '' })}><Text style={styles.smallText}>+ {t.createBranch}</Text></Pressable> : null}
          </View>
          {!branches.length ? <Text style={styles.empty}>{t.emptyBranches}</Text> : null}
          {branches.map((item) => (
            <Pressable key={item.id} style={[styles.rowCard, branchId === item.id && styles.rowOn]} onPress={() => { setBranchId(item.id); void loadGroups(item.id); }}>
              <View style={styles.grow}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.meta}>{item.ageGroup || '—'}</Text>
                <Text style={styles.meta}>{person(item.administrativeId) || person(item.headCoachId) || item.address || '—'}</Text>
              </View>
              {canManage ? (
                <Pressable style={styles.mini} onPress={() => setBranchForm({ id: item.id, name: item.name, ageGroup: item.ageGroup, address: item.address })}>
                  <Text style={styles.miniText}>✎</Text>
                </Pressable>
              ) : null}
            </Pressable>
          ))}
        </View>
        <View style={styles.card}>
          <View style={styles.top}>
            <Text style={styles.cardTitle}>{t.groups}</Text>
            {canManage && branchId ? <Pressable style={styles.smallPink} onPress={() => setGroupForm({ id: '', name: '', description: '' })}><Text style={styles.smallText}>+ {t.createGroup}</Text></Pressable> : null}
          </View>
          {!branchId ? <Text style={styles.meta}>{t.pickFirst}</Text> : !groups.length ? <Text style={styles.meta}>{t.emptyGroups}</Text> : null}
          {groups.map((item) => (
            <Pressable key={item.id} style={styles.rowCard} onPress={() => void openMembers(item)}>
              <View style={styles.grow}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.meta}>{item.description || person(item.headCoachId) || '—'}</Text>
              </View>
              {canManage ? (
                <View style={styles.icons}>
                  <Pressable style={styles.mini} onPress={() => setGroupForm({ id: item.id, name: item.name, description: item.description })}><Text style={styles.miniText}>✎</Text></Pressable>
                  <Pressable style={[styles.mini, styles.miniDanger]} onPress={() => askRemove(item)}><Text style={styles.miniText}>×</Text></Pressable>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Modal visible={branchForm !== null} transparent animationType="slide" onRequestClose={() => setBranchForm(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{t.createBranch}</Text>
            <Field label={t.name} value={branchForm?.name || ''} onChange={(name) => setBranchForm((form) => form ? { ...form, name } : form)} />
            <Field label={t.age} value={branchForm?.ageGroup || ''} onChange={(ageGroup) => setBranchForm((form) => form ? { ...form, ageGroup } : form)} />
            <Field label={t.address} value={branchForm?.address || ''} onChange={(address) => setBranchForm((form) => form ? { ...form, address } : form)} />
            <View style={styles.icons}>
              <PinkButton label={t.save} onPress={() => void submitBranch()} disabled={busy} />
              <WhiteButton label={t.close} onPress={() => setBranchForm(null)} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={groupForm !== null} transparent animationType="slide" onRequestClose={() => setGroupForm(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{t.createGroup}</Text>
            <Field label={t.groupName} value={groupForm?.name || ''} onChange={(name) => setGroupForm((form) => form ? { ...form, name } : form)} />
            <Field label={t.description} value={groupForm?.description || ''} onChange={(description) => setGroupForm((form) => form ? { ...form, description } : form)} />
            <View style={styles.icons}>
              <PinkButton label={t.save} onPress={() => void submitGroup()} disabled={busy} />
              <WhiteButton label={t.close} onPress={() => setGroupForm(null)} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={openGroup !== null} transparent animationType="slide" onRequestClose={() => setOpenGroup(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{openGroup?.name}</Text>
            <Text style={styles.meta}>{t.members}</Text>
            {!members.length ? <Text style={styles.empty}>—</Text> : null}
            {members.map((item) => (
              <Text key={item.id} style={styles.rowTitle}>{item.fullName}{item.role ? ` · ${item.role}` : ''}</Text>
            ))}
            <WhiteButton label={t.close} onPress={() => setOpenGroup(null)} />
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
  card: { backgroundColor: ink.card, borderRadius: 16, borderWidth: 1, borderColor: ink.line, padding: 14, gap: 10 },
  label: { color: ink.muted, fontSize: 12, fontWeight: '700' },
  value: { color: ink.text, fontSize: 16, fontWeight: '800' },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  notice: { color: '#ffd1dc', fontSize: 13 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: ink.text, fontSize: 18, fontWeight: '800' },
  smallPink: { minHeight: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: ink.pink, alignItems: 'center', justifyContent: 'center' },
  smallText: { color: ink.white, fontSize: 12, fontWeight: '800' },
  empty: { color: ink.muted, fontSize: 13 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: ink.line, borderRadius: 12, padding: 10 },
  rowOn: { borderColor: ink.pink },
  grow: { flex: 1, gap: 2 },
  rowTitle: { color: ink.text, fontWeight: '800' },
  meta: { color: ink.muted, fontSize: 12 },
  icons: { flexDirection: 'row', gap: 6 },
  mini: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: ink.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c2422' },
  miniDanger: { borderColor: '#6b2438', backgroundColor: '#3a1d24' },
  miniText: { color: ink.text, fontSize: 14, fontWeight: '800' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 12 },
});
