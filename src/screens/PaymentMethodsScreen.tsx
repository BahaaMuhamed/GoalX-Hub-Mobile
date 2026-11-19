import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listBranches, type BranchOption } from '@/api/dashboard';
import { listGroups, listPlayers, type GroupRecord, type PlayerRecord } from '@/api/directory';
import { errorMessage } from '@/api/errors';
import {
  assignPlan,
  canManagePayments,
  contractEnd,
  listPaymentMethods,
  listPaymentPlans,
  removePaymentMethod,
  removePaymentPlan,
  savePaymentMethod,
  savePaymentPlan,
  type PayMethod,
  type PayPlan,
} from '@/api/payments';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, HScroll, ink, PinkButton, WhiteButton } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

export function PaymentMethodsScreen() {
  const { lang, rtl } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const canManage = canManagePayments(profile?.role ?? '');
  const workspace = useWorkspace();
  const academyId = workspace.academies[0]?.id || '';
  const [methods, setMethods] = useState<PayMethod[]>([]);
  const [plans, setPlans] = useState<PayPlan[]>([]);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState('');
  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState({ name: '', months: '1', sessions: '0', amount: '' });
  const [renewOpen, setRenewOpen] = useState(false);
  const [renew, setRenew] = useState({ playerId: '', planId: '', methodId: '', groupId: '', paid: '0', start: '', note: '' });

  const t = ar
    ? {
        title: 'طرق الدفع',
        hint: 'أضف طريقة دفع ثم أضف خطة للاعب. حمل الاشتراك إلى المالية.',
        academy: 'الأكاديمية',
        branch: 'الفرع',
        load: 'تحميل الفرع',
        renew: 'تجديد الاشتراك',
        add: 'إضافة طريقة دفع',
        search: 'ابحث باسم طريقة الدفع...',
        name: 'اسم طريقة الدفع',
        actions: 'إجراءات',
        empty: 'لا توجد طرق دفع',
        plans: 'خطط الاشتراك',
        addPlan: 'إضافة خطة',
        cols: ['اسم الخطة', 'الأشهر', 'الحصص', 'السعر'],
        emptyPlans: 'لا توجد خطط',
        save: 'حفظ',
        close: 'إلغاء',
        player: 'اللاعب',
        plan: 'الخطة',
        method: 'طريقة الدفع',
        group: 'المجموعة',
        paid: 'المبلغ المدفوع',
        start: 'تاريخ البداية',
        end: 'تاريخ النهاية',
        note: 'ملاحظة',
        submit: 'تأكيد التجديد',
      }
    : {
        title: 'Payment methods',
        hint: 'Add a payment method, then assign a plan to a player. The subscription is sent to finance.',
        academy: 'Academy',
        branch: 'Branch',
        load: 'Load branch',
        renew: 'Renew subscription',
        add: 'Add payment method',
        search: 'Search by payment method name...',
        name: 'Payment method name',
        actions: 'Actions',
        empty: 'No payment methods',
        plans: 'Subscription plans',
        addPlan: 'Add plan',
        cols: ['Plan', 'Months', 'Sessions', 'Price'],
        emptyPlans: 'No plans',
        save: 'Save',
        close: 'Cancel',
        player: 'Player',
        plan: 'Plan',
        method: 'Payment method',
        group: 'Group',
        paid: 'Amount paid',
        start: 'Start date',
        end: 'End date',
        note: 'Note',
        submit: 'Confirm renewal',
      };

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    const org = workspace.organizationId;
    try {
      const [methodRows, planRows, roster, squads, branchList] = await Promise.all([
        listPaymentMethods(org),
        listPaymentPlans(org),
        listPlayers(org, branchId),
        listGroups(org),
        listBranches(academyId || org, org),
      ]);
      setMethods(methodRows);
      setPlans(planRows);
      setPlayers(roster);
      setGroups(squads);
      setBranches(branchList);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load payment methods'));
    } finally {
      setLoading(false);
    }
  }, [academyId, branchId, workspace.organizationId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const catalog = methods.filter((item) => !academyId || item.academyId === academyId);
  const visibleMethods = catalog.filter((item) => !query.trim() || item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const academyPlans = plans.filter((item) => !academyId || item.academyId === academyId);
  const squads = groups.filter((group) => !branchId || group.branchId === branchId);
  const selectedPlan = academyPlans.find((item) => item.id === renew.planId);
  const endDate = contractEnd(renew.start, selectedPlan?.durationMonths || 0);

  function openMethod(item?: PayMethod) {
    setMethodId(item?.id || '');
    setMethodName(item?.name || '');
  }

  async function saveMethod() {
    if (!methodName.trim() || !academyId) {
      setNotice(ar ? 'اسم الطريقة والأكاديمية مطلوبان' : 'Method name and academy are required');
      return;
    }
    setBusy(true);
    try {
      await savePaymentMethod({
        id: methodId || undefined,
        name: methodName,
        organizationId: workspace.organizationId,
        academyId,
      });
      setMethodId(null);
      await load();
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save the method'));
    } finally {
      setBusy(false);
    }
  }

  function removeMethod(item: PayMethod) {
    Alert.alert(item.name, ar ? 'حذف طريقة الدفع؟' : 'Remove this payment method?', [
      { text: t.close, style: 'cancel' },
      { text: ar ? 'حذف' : 'Remove', style: 'destructive', onPress: () => { void removePaymentMethod(item.id).then(load).catch((error) => setNotice(errorMessage(error, 'Could not remove'))); } },
    ]);
  }

  function openPlan(item?: PayPlan) {
    setPlanId(item?.id || '');
    setPlan({
      name: item?.name || '',
      months: String(item?.durationMonths || 1),
      sessions: String(item?.sessionCount ?? 0),
      amount: String(item?.amount || ''),
    });
  }

  async function savePlan() {
    const months = Number(plan.months);
    const amount = Number(plan.amount);
    if (!plan.name.trim() || !academyId || months < 1 || amount <= 0) {
      setNotice(ar ? 'اسم الخطة والمدة والسعر مطلوبة' : 'Plan name, duration, and price are required');
      return;
    }
    setBusy(true);
    try {
      await savePaymentPlan({
        id: planId || undefined,
        name: plan.name,
        durationMonths: months,
        sessionCount: Number(plan.sessions) || 0,
        amount,
        organizationId: workspace.organizationId,
        academyId,
      });
      setPlanId(null);
      await load();
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save the plan'));
    } finally {
      setBusy(false);
    }
  }

  function removePlan(item: PayPlan) {
    Alert.alert(item.name, ar ? 'حذف الخطة؟' : 'Remove this plan?', [
      { text: t.close, style: 'cancel' },
      { text: ar ? 'حذف' : 'Remove', style: 'destructive', onPress: () => { void removePaymentPlan(item.id).then(load).catch((error) => setNotice(errorMessage(error, 'Could not remove'))); } },
    ]);
  }

  async function renewSubscription() {
    const paid = Number(renew.paid);
    if (!renew.playerId || !renew.planId || !renew.methodId || !branchId || !renew.groupId || !renew.start) {
      setNotice(ar ? 'أكمل بيانات التجديد' : 'Complete the renewal fields');
      return;
    }
    if (!selectedPlan || paid < 0 || paid > selectedPlan.amount) {
      setNotice(ar ? 'المبلغ أكبر من سعر الخطة' : 'The amount is higher than the plan price');
      return;
    }
    setBusy(true);
    try {
      await assignPlan({
        organizationId: workspace.organizationId,
        playerId: renew.playerId,
        planId: renew.planId,
        paymentMethodId: renew.methodId,
        branchId,
        groupId: renew.groupId,
        amountPaid: paid,
        startDate: renew.start,
        notes: renew.note.trim(),
      });
      setRenewOpen(false);
      setNotice(ar ? 'تم تجديد الاشتراك' : 'Subscription renewed');
    } catch (error) {
      setNotice(errorMessage(error, 'Could not renew the subscription'));
    } finally {
      setBusy(false);
    }
  }

  const playerOptions = useMemo(() => players.map((item) => ({ id: item.id, label: item.fullName || item.playerCode })), [players]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <View style={styles.card}>
          <Text style={styles.label}>{t.academy}</Text>
          <Text style={styles.value}>{workspace.brandName}</Text>
          <DropDown label={t.branch} value={branchId} placeholder={t.branch} options={branches.map((item) => ({ id: item.id, label: item.name }))} onChange={setBranchId} />
          <View style={styles.actions}>
            <Pressable style={styles.smallPink} onPress={() => void load()}><Text style={styles.smallText}>{t.load}</Text></Pressable>
            {canManage ? <Pressable style={styles.smallPink} onPress={() => setRenewOpen(true)}><Text style={styles.smallText}>{t.renew}</Text></Pressable> : null}
            {canManage ? <Pressable style={styles.smallPink} onPress={() => openMethod()}><Text style={styles.smallText}>+ {t.add}</Text></Pressable> : null}
          </View>
        </View>
        <View style={[styles.head, rtl && styles.reverse]}>
          <View style={styles.titles}>
            <Text style={[styles.title, rtl && styles.end]}>{t.title}</Text>
            <Text style={[styles.hint, rtl && styles.end]}>{t.hint}</Text>
          </View>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading ? <ActivityIndicator color={ink.pink} /> : null}
        <View style={styles.card}>
          <TextInput value={query} onChangeText={setQuery} placeholder={t.search} placeholderTextColor={ink.muted} style={styles.search} />
          <HScroll>
            <View>
              <View style={[styles.headerRow, rtl && styles.reverse]}>
                <Text style={styles.headCell}>{t.name}</Text>
                <Text style={styles.headCell}>{t.actions}</Text>
              </View>
              {!visibleMethods.length ? <Text style={styles.empty}>{t.empty}</Text> : null}
              {visibleMethods.map((item) => (
                <View key={item.id} style={[styles.row, rtl && styles.reverse]}>
                  <Text style={styles.cell}>{item.name}</Text>
                  {canManage ? (
                    <View style={styles.icons}>
                      <Pressable style={styles.mini} onPress={() => openMethod(item)}><Text style={styles.miniText}>✎</Text></Pressable>
                      <Pressable style={[styles.mini, styles.miniDanger]} onPress={() => removeMethod(item)}><Text style={styles.miniText}>×</Text></Pressable>
                    </View>
                  ) : <View style={styles.icons} />}
                </View>
              ))}
            </View>
          </HScroll>
        </View>
        <View style={styles.card}>
          <View style={[styles.top, rtl && styles.reverse]}>
            <Text style={styles.cardTitle}>{t.plans}</Text>
            {canManage ? <Pressable style={styles.smallPink} onPress={() => openPlan()}><Text style={styles.smallText}>{t.addPlan}</Text></Pressable> : null}
          </View>
          <HScroll>
            <View>
              <View style={[styles.headerRow, rtl && styles.reverse]}>
                <Text style={[styles.headCell, styles.planName]}>{t.cols[0]}</Text>
                <Text style={[styles.headCell, styles.planShort]}>{t.cols[1]}</Text>
                <Text style={[styles.headCell, styles.planShort]}>{t.cols[2]}</Text>
                <Text style={[styles.headCell, styles.planPrice]}>{t.cols[3]}</Text>
                <Text style={[styles.headCell, styles.planActions]}>{t.actions}</Text>
              </View>
              {!academyPlans.length ? <Text style={styles.empty}>{t.emptyPlans}</Text> : null}
              {academyPlans.map((item) => (
                <View key={item.id} style={[styles.row, rtl && styles.reverse]}>
                  <Text style={[styles.cell, styles.planName]}>{item.name}</Text>
                  <Text style={[styles.cell, styles.planShort]}>{item.durationMonths}</Text>
                  <Text style={[styles.cell, styles.planShort]}>{item.sessionCount ?? '—'}</Text>
                  <Text style={[styles.cell, styles.planPrice]}>{item.amount} {item.currency}</Text>
                  {canManage ? (
                    <View style={[styles.icons, styles.planActions]}>
                      <Pressable style={styles.mini} onPress={() => openPlan(item)}><Text style={styles.miniText}>✎</Text></Pressable>
                      <Pressable style={[styles.mini, styles.miniDanger]} onPress={() => removePlan(item)}><Text style={styles.miniText}>×</Text></Pressable>
                    </View>
                  ) : <View style={[styles.icons, styles.planActions]} />}
                </View>
              ))}
            </View>
          </HScroll>
        </View>
      </ScrollView>
      <Modal visible={methodId !== null} transparent animationType="slide" onRequestClose={() => setMethodId(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{t.add}</Text>
            <Field label={t.name} value={methodName} onChange={setMethodName} />
            <View style={styles.actions}>
              <PinkButton label={t.save} onPress={() => void saveMethod()} disabled={busy} />
              <WhiteButton label={t.close} onPress={() => setMethodId(null)} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={planId !== null} transparent animationType="slide" onRequestClose={() => setPlanId(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{t.addPlan}</Text>
            <Field label={t.cols[0]} value={plan.name} onChange={(name) => setPlan({ ...plan, name })} />
            <Field label={t.cols[1]} value={plan.months} onChange={(months) => setPlan({ ...plan, months })} />
            <Field label={t.cols[2]} value={plan.sessions} onChange={(sessions) => setPlan({ ...plan, sessions })} />
            <Field label={t.cols[3]} value={plan.amount} onChange={(amount) => setPlan({ ...plan, amount })} />
            <View style={styles.actions}>
              <PinkButton label={t.save} onPress={() => void savePlan()} disabled={busy} />
              <WhiteButton label={t.close} onPress={() => setPlanId(null)} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={renewOpen} transparent animationType="slide" onRequestClose={() => setRenewOpen(false)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.cardTitle}>{t.renew}</Text>
            <DropDown label={t.player} value={renew.playerId} placeholder={t.player} options={playerOptions} onChange={(playerId) => setRenew({ ...renew, playerId })} />
            <DropDown label={t.plan} value={renew.planId} placeholder={t.plan} options={academyPlans.map((item) => ({ id: item.id, label: `${item.name} · ${item.amount} ${item.currency}` }))} onChange={(id) => setRenew({ ...renew, planId: id, paid: String(academyPlans.find((item) => item.id === id)?.amount ?? renew.paid) })} />
            <DropDown label={t.method} value={renew.methodId} placeholder={t.method} options={catalog.map((item) => ({ id: item.id, label: item.name }))} onChange={(methodId) => setRenew({ ...renew, methodId })} />
            <DropDown label={t.group} value={renew.groupId} placeholder={t.group} options={squads.map((item) => ({ id: item.id, label: item.name }))} onChange={(groupId) => setRenew({ ...renew, groupId })} />
            <Field label={t.paid} value={renew.paid} onChange={(paid) => setRenew({ ...renew, paid })} />
            <Field label={t.start} value={renew.start} onChange={(start) => setRenew({ ...renew, start })} placeholder="YYYY-MM-DD" />
            <Text style={styles.hint}>{t.end}: {endDate || '—'}</Text>
            <Field label={t.note} value={renew.note} onChange={(note) => setRenew({ ...renew, note })} />
            <View style={styles.actions}>
              <PinkButton label={t.submit} onPress={() => void renewSubscription()} disabled={busy} />
              <WhiteButton label={t.close} onPress={() => setRenewOpen(false)} />
            </View>
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallPink: { minHeight: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: ink.pink, alignItems: 'center', justifyContent: 'center' },
  smallText: { color: ink.white, fontSize: 12, fontWeight: '800' },
  head: { flexDirection: 'row' },
  reverse: { flexDirection: 'row-reverse' },
  titles: { flex: 1, gap: 4 },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  end: { textAlign: 'right' },
  notice: { color: '#ffd1dc', fontSize: 13 },
  search: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: ink.line, color: ink.text, paddingHorizontal: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: ink.text, fontSize: 18, fontWeight: '800' },
  headerRow: { flexDirection: 'row', backgroundColor: ink.pink, borderRadius: 8, paddingVertical: 8 },
  headCell: { width: 150, color: ink.white, fontSize: 11, fontWeight: '800', paddingHorizontal: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 8 },
  cell: { width: 150, color: ink.text, fontSize: 12, paddingHorizontal: 6 },
  planName: { width: 88 },
  planShort: { width: 58 },
  planPrice: { width: 72 },
  planActions: { width: 64 },
  icons: { width: 150, flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
  mini: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: ink.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c2422' },
  miniDanger: { borderColor: '#6b2438', backgroundColor: '#3a1d24' },
  miniText: { color: ink.text, fontSize: 14, fontWeight: '800' },
  empty: { color: ink.muted, padding: 12 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 12, maxHeight: '90%' },
});
