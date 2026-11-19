import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  changeUserPassword,
  createUser,
  listGroups,
  listUsers,
  loadUserProfile,
  removeUser,
  STAFF_ROLES,
  updateUser,
  type GroupRecord,
  type StaffUser,
  type UserCard,
} from '@/api/directory';
import { listBranches, type BranchOption } from '@/api/dashboard';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, FilterInput, GhostButton, HScroll, ink, PinkButton, WhiteButton } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

const ROLE_LABEL: Record<string, { en: string; ar: string }> = {
  SUPER_ADMIN: { en: 'Super Admin', ar: 'مدير المنصة' },
  ORGANIZATION_ADMIN: { en: 'Academy Admin', ar: 'مسؤول الأكاديمية' },
  ADMINISTRATIVE: { en: 'Administrative', ar: 'إداري' },
  ACCOUNTANT: { en: 'Accountant', ar: 'محاسب' },
  COACH: { en: 'Coach', ar: 'مدرب' },
  PLAYER: { en: 'Player', ar: 'لاعب' },
  FREE_PLAYER: { en: 'Free player', ar: 'لاعب حر' },
};

const emptyForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  role: 'COACH',
  groupIds: [] as string[],
};

export function UsersScreen() {
  const { lang, rtl } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const workspace = useWorkspace();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [groupId, setGroupId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [card, setCard] = useState<UserCard | null>(null);

  const t = ar
    ? {
        title: 'المستخدمون',
        hint: 'مسؤولو الأكاديمية، المدربون، والإداريون في الأكاديمية.',
        refresh: 'تحديث',
        create: 'إنشاء مستخدم',
        directory: 'الدليل',
        branch: 'الفرع',
        cols: ['الاسم', 'البريد', 'الهاتف', 'تاريخ الميلاد', 'الدور', 'المجموعات', 'الفرع', 'إجراءات'],
        filter: 'تصفية',
        all: 'الكل',
        clear: 'مسح',
        file: 'الملف',
        edit: 'تعديل',
        disable: 'تعطيل',
        empty: 'لا يوجد مستخدمون',
        save: 'حفظ',
        cancel: 'إلغاء',
        saved: 'تم الحفظ',
        removed: 'تم تعطيل الحساب',
        imported: 'اكتمل الاستيراد',
        password: 'كلمة المرور',
      }
    : {
        title: 'Users',
        hint: 'Academy managers, coaches, and staff for this academy.',
        refresh: 'Refresh',
        create: 'Create user',
        directory: 'Directory',
        branch: 'Branch',
        cols: ['Name', 'Email', 'Phone', 'Birth date', 'Role', 'Groups', 'Branch', 'Actions'],
        filter: 'Filter',
        all: 'All',
        clear: 'Clear',
        file: 'Profile',
        edit: 'Edit',
        disable: 'Disable',
        empty: 'No users',
        save: 'Save',
        cancel: 'Cancel',
        saved: 'Saved',
        removed: 'Account disabled',
        imported: 'Import finished',
        password: 'Password',
      };

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const org = workspace.organizationId;
      const [people, squads, branchList] = await Promise.all([
        listUsers(org),
        listGroups(org),
        listBranches(workspace.academies[0]?.id || org, org),
      ]);
      setUsers(people);
      setGroups(squads);
      setBranches(branchList);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load users'));
    } finally {
      setLoading(false);
    }
  }, [workspace.academies, workspace.organizationId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = users.filter((user) => {
    if (name && !user.fullName.toLowerCase().includes(name.trim().toLowerCase())) return false;
    if (email && !user.email.toLowerCase().includes(email.trim().toLowerCase())) return false;
    if (phone && !(user.phone || '').includes(phone.trim())) return false;
    if (role && user.role !== role) return false;
    if (groupId && !user.groupIds.includes(groupId)) return false;
    if (branchId && !user.groupIds.some((id) => groups.find((group) => group.id === id)?.branchId === branchId)) return false;
    return true;
  });

  function groupNames(user: StaffUser): string {
    const names = user.groupIds.map((id) => groups.find((group) => group.id === id)?.name).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  function branchNames(user: StaffUser): string {
    const names = user.groupIds
      .map((id) => groups.find((group) => group.id === id)?.branchName)
      .filter((item): item is string => !!item);
    return [...new Set(names)].join(', ') || '—';
  }

  function roleText(value: string): string {
    return ROLE_LABEL[value]?.[ar ? 'ar' : 'en'] || value;
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(user: StaffUser) {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      groupIds: user.groupIds,
    });
    setFormOpen(true);
  }

  async function save() {
    setBusy(true);
    setNotice('');
    try {
      if (editing) {
        await updateUser(editing, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          groupIds: form.groupIds,
        });
        if (form.password.trim().length >= 8) await changeUserPassword(editing.id, form.password);
      } else {
        if (form.password.trim().length < 8) {
          setNotice(ar ? 'كلمة المرور ٨ أحرف على الأقل' : 'Password must be at least 8 characters');
          return;
        }
        await createUser({
          ...form,
          organizationId: workspace.organizationId,
        });
      }
      setFormOpen(false);
      setNotice(t.saved);
      await load();
    } catch (error) {
      setNotice(errorMessage(error, 'Save failed'));
    } finally {
      setBusy(false);
    }
  }

  function disable(user: StaffUser) {
    Alert.alert(t.disable, user.fullName, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.disable,
        style: 'destructive',
        onPress: () => {
          void removeUser(user.id)
            .then(() => {
              setNotice(t.removed);
              return load();
            })
            .catch((error) => setNotice(errorMessage(error, 'Could not disable user')));
        },
      },
    ]);
  }

  async function openCard(user: StaffUser) {
    setBusy(true);
    try {
      setCard(await loadUserProfile(user.id));
    } catch (error) {
      setNotice(errorMessage(error, 'Could not open profile'));
    } finally {
      setBusy(false);
    }
  }

  const headers = (
    <View style={[styles.top, rtl && styles.reverse]}>
      <View style={styles.titles}>
        <Text style={[styles.title, rtl && styles.end]}>{t.title}</Text>
        <Text style={[styles.hint, rtl && styles.end]}>{t.hint}</Text>
      </View>
      <View style={styles.actions}>
        <WhiteButton label={t.refresh} onPress={() => void load()} />
        <PinkButton label={t.create} onPress={openCreate} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        {headers}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <DropDown
          label={t.branch}
          value={branchId}
          placeholder={t.all}
          options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
          onChange={setBranchId}
        />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.directory}</Text>
          {loading ? <ActivityIndicator color={ink.pink} style={{ marginTop: 20 }} /> : null}
          <HScroll>
            <View>
              <View style={styles.row}>
                {t.cols.map((label) => (
                  <Text key={label} style={styles.head}>{label}</Text>
                ))}
              </View>
              <View style={styles.row}>
                <FilterInput value={name} onChange={setName} placeholder={t.filter} />
                <FilterInput value={email} onChange={setEmail} placeholder={t.filter} />
                <FilterInput value={phone} onChange={setPhone} placeholder={t.filter} />
                <View style={styles.cell} />
                <FilterInput value={role} onChange={setRole} placeholder={t.all} />
                <FilterInput value={groupId} onChange={setGroupId} placeholder={t.all} />
                <FilterInput value={branchId} onChange={setBranchId} placeholder={t.all} />
                <Pressable onPress={() => { setName(''); setEmail(''); setPhone(''); setRole(''); setGroupId(''); setBranchId(''); }}>
                  <Text style={styles.link}>{t.clear}</Text>
                </Pressable>
              </View>
              {!loading && !visible.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
              {visible.map((user) => (
                <View key={user.id} style={styles.row}>
                  <Text style={styles.cell}>{user.fullName}</Text>
                  <Text style={styles.cell}>{user.email}</Text>
                  <Text style={styles.cell}>{user.phone || '—'}</Text>
                  <Text style={styles.cell}>{user.dateOfBirth || user.contractStartDate || '—'}</Text>
                  <Text style={styles.cell}>{roleText(user.role)}</Text>
                  <Text style={styles.cell}>{groupNames(user)}</Text>
                  <Text style={styles.cell}>{branchNames(user)}</Text>
                  <View style={styles.rowActions}>
                    <GhostButton label={t.file} onPress={() => void openCard(user)} />
                    <GhostButton label={t.edit} onPress={() => openEdit(user)} />
                    {user.id !== profile?.userId ? <GhostButton label={t.disable} onPress={() => disable(user)} /> : null}
                  </View>
                </View>
              ))}
            </View>
          </HScroll>
          <View style={styles.chips}>
            <Pressable style={[styles.chip, !role && styles.chipOn]} onPress={() => setRole('')}>
              <Text style={styles.chipText}>{t.all}</Text>
            </Pressable>
            {STAFF_ROLES.map((item) => (
              <Pressable key={item} style={[styles.chip, role === item && styles.chipOn]} onPress={() => setRole(item)}>
                <Text style={styles.chipText}>{roleText(item)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chips}>
            {groups.map((group) => (
              <Pressable key={group.id} style={[styles.chip, groupId === group.id && styles.chipOn]} onPress={() => setGroupId(group.id === groupId ? '' : group.id)}>
                <Text style={styles.chipText}>{group.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.cardTitle}>{editing ? t.edit : t.create}</Text>
            <Field label={t.cols[0]} value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field label={ar ? 'اسم المستخدم' : 'Username'} value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
            <Field label={t.cols[1]} value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label={t.password} value={form.password} onChange={(value) => setForm({ ...form, password: value })} secure />
            <Field label={t.cols[2]} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <View style={styles.chips}>
              {(editing ? [editing.role, ...STAFF_ROLES.filter((item) => item !== editing.role)] : STAFF_ROLES).map((item) => (
                <Pressable key={item} style={[styles.chip, form.role === item && styles.chipOn]} onPress={() => setForm({ ...form, role: item })}>
                  <Text style={styles.chipText}>{roleText(item)}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.chips}>
              {groups.map((group) => {
                const on = form.groupIds.includes(group.id);
                return (
                  <Pressable
                    key={group.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() =>
                      setForm({
                        ...form,
                        groupIds: on ? form.groupIds.filter((id) => id !== group.id) : [...form.groupIds, group.id],
                      })
                    }
                  >
                    <Text style={styles.chipText}>{group.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.actions}>
              <PinkButton label={t.save} onPress={() => void save()} disabled={busy} />
              <WhiteButton label={t.cancel} onPress={() => setFormOpen(false)} />
            </View>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={!!card} animationType="fade" transparent onRequestClose={() => setCard(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{card?.fullName}</Text>
            <Text style={styles.hint}>{card ? roleText(card.role) : ''}</Text>
            <Text style={styles.cell}>{card?.email}</Text>
            <Text style={styles.cell}>{card?.phone || '—'}</Text>
            <Text style={styles.cell}>{card?.organizationName || '—'}</Text>
            <Text style={styles.cell}>{card?.branchName || '—'}</Text>
            <Text style={styles.cell}>{card?.groups || '—'}</Text>
            <WhiteButton label={t.cancel} onPress={() => setCard(null)} />
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
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
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
  rowActions: { width: 230, flexDirection: 'row', gap: 6 },
  link: { color: ink.pink, fontWeight: '800', width: 70 },
  empty: { color: ink.muted, paddingVertical: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: ink.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: ink.pink, borderColor: ink.pink },
  chipText: { color: ink.text, fontSize: 12, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '88%', gap: 8 },
});
