import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listBranches, type BranchOption } from '@/api/dashboard';
import { errorMessage } from '@/api/errors';
import {
  addPartner,
  approveIncome,
  canManageFinance,
  carryProfit,
  closeSubscription,
  createExpense,
  createSubscription,
  loadAdReflection,
  loadExpenses,
  loadIncome,
  loadIncomeHistory,
  loadProfit,
  loadShareCapital,
  loadStaff,
  loadSubscriptions,
  money,
  removePartner,
  saveOtherIncome,
  saveReserve,
  saveShareCapital,
  type AdReflection,
  type CommercialBoard,
  type ExpenseRow,
  type IncomeBoard,
  type IncomeRow,
  type ProfitBoard,
  type ShareCapitalBoard,
  type ShareYear,
  type StaffRef,
} from '@/api/finance';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { Field, HScroll, ink, PinkButton, WhiteButton } from '@/components/DirectoryChrome';
import { DropDown } from '@/components/DropDown';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';
import { useWorkspace } from '@/workspace/WorkspaceContext';

export type FinanceSection = 'income' | 'expenses' | 'subscriptions' | 'profit' | 'share-capital';

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''));
}

const CATEGORIES = ['STADIUM_RENT', 'PAYSLIP', 'TRANSPORTATION', 'BONUS', 'RETURN', 'TOOLS'];
const KINDS = ['FACILITY', 'LEAGUE', 'OTHER'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FinanceScreen({ section }: { section: FinanceSection }) {
  const { lang } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const canManage = canManageFinance(profile?.role ?? '');
  const workspace = useWorkspace();
  const academyId = workspace.academies[0]?.id || '';
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [search, setSearch] = useState('');
  const [income, setIncome] = useState<IncomeBoard | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [staff, setStaff] = useState<StaffRef[]>([]);
  const [commercial, setCommercial] = useState<CommercialBoard | null>(null);
  const [profit, setProfit] = useState<ProfitBoard | null>(null);
  const [ads, setAds] = useState<AdReflection | null>(null);
  const [capital, setCapital] = useState<ShareCapitalBoard | null>(null);
  const [history, setHistory] = useState<IncomeRow[] | null>(null);
  const [historyName, setHistoryName] = useState('');
  const [otherOpen, setOtherOpen] = useState(false);
  const [other, setOther] = useState({ title: '', amount: '', date: today(), notes: '' });
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expense, setExpense] = useState({ category: 'STADIUM_RENT', amount: '', date: today(), notes: '', staffId: '' });
  const [subOpen, setSubOpen] = useState(false);
  const [sub, setSub] = useState({ kind: 'FACILITY', title: '', party: '', amount: '', start: today(), end: '', notes: '' });
  const [reserve, setReserve] = useState('20');
  const [capitalInput, setCapitalInput] = useState('');
  const [partner, setPartner] = useState({ name: '', percent: '' });
  const [invoice, setInvoice] = useState<ShareYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const profitAll = useRef(false);

  const copy = ar
    ? {
        income: 'الدخل',
        expenses: 'المصروفات',
        subscriptions: 'اشتراكات جديدة',
        profit: 'ربح الفرع',
        capital: 'رأس المال',
        hintProfit: 'ربح الفرع هو ما تم تحصيله من خطط اللاعبين ناقص مصروفات الفرع، بما فيها الإعلان المدفوع.',
        allBranches: 'كل الفروع',
        result: 'الربح',
        formula: 'الدخل − المصروفات = الربح',
        adsTitle: 'الإعلان داخل هذا الربح',
        adsPaid: 'إعلان مدفوع داخل المصروفات',
        adsRevenue: 'إيراد منسوب داخل الدخل',
        adsReturn: 'العائد بعد مصروفات الإعلان',
        adsOpen: 'إعلان غير مدفوع',
        annual: 'توزيع الربح السنوي',
        losses: 'خسائر مرحلة',
        noProfit: 'لا يوجد توزيع عندما يكون الربح بعد الخسائر المرحلة صفراً أو خسارة.',
        adsHint: 'الإعلان المدفوع داخل إجمالي المصروفات ويُنقص الربح. الإيراد المنسوب داخل الدخل. العائد بعد الإعلان ليس صافي ربح الأكاديمية.',
        annualHint: 'كل فروع هذه الأكاديمية. الإيراد ناقص المصروف، ثم الخسائر المرحلة، ثم الاحتياطي.',
        allHint: 'المحصّل ناقص المصروفات لكل فرع في السنة المختارة.',
        ownershipShort: 'نسب الشركاء يجب أن تساوي 100٪ قبل اعتماد الحصص.',
        partnerProfit: 'ربح الشريك',
        ownership: 'نسبة الملكية',
        allMonths: 'كل الفروع، كل الشهور',
        months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        hint: 'كل خطة لاعب في هذا الفرع تظهر هنا فور تعيينها. المدة تتبع الخطة: شهر، أو 3 أشهر، أو يوم واحد.',
        academy: 'الأكاديمية',
        branch: 'الفرع',
        load: 'تحميل الفرع',
        search: 'ابحث في هذه القائمة',
        players: 'اللاعبون',
        billed: 'إجمالي الخطط',
        paid: 'المدفوع',
        remaining: 'المتبقي',
        cols: ['اللاعب', 'الخطة', 'الفترة', 'تاريخ البداية', 'تاريخ النهاية', 'المدفوع', 'المتبقي', 'الحالة'],
        empty: 'لا توجد خطط لاعبين لهذا الفرع بعد.',
        status: 'الحالة',
        approve: 'اعتماد',
        history: 'السجل',
        other: 'دخل آخر',
        save: 'حفظ',
        close: 'إغلاق',
        title: 'اسم الدخل',
        amount: 'المبلغ',
        date: 'التاريخ',
        notes: 'ملاحظات',
        addExpense: 'إضافة مصروف',
        category: 'التصنيف',
        employee: 'الموظف',
        addSub: 'إضافة اشتراك',
        kind: 'النوع',
        party: 'الجهة',
        year: 'السنة',
        reserve: 'الاحتياطي %',
        revenue: 'إجمالي الإيراد',
        net: 'صافي الربح',
        distributable: 'القابل للتوزيع',
        share: 'رأس المال',
        inHand: 'المتاح',
        yearProfit: 'ربح السنة',
        finalProfit: 'الربح النهائي',
        partner: 'شريك',
        percent: 'النسبة',
        addPartner: 'إضافة شريك',
        remove: 'إزالة',
        hintCapital: 'تُجمع أرباح الفروع في ربح السنة. نسبة كل شريك تأخذ توزيعاً من هذا الربح، والباقي هو الربح النهائي.',
        brought: 'مرحّل من السنة السابقة',
        shareHint: 'رأس المال المسجّل لهذه الأكاديمية.',
        broughtHint: 'الربح النهائي الذي نُقل من السنة الماضية.',
        yearHint: 'الدخل ناقص المصروفات لكل الفروع.',
        finalHint: 'ربح السنة بعد توزيع أرباح الشركاء.',
        years: 'ربح كل سنة',
        yearsHint: 'كل سنة مستقلة. انقل ربحها النهائي إلى السنة التالية ما دام النقل متاحاً.',
        dividend: 'التوزيع',
        moveShort: 'انقل إلى {{year}}',
        updateMove: 'تحديث المبلغ المرحّل إلى {{year}}',
        movedAmount: 'تم النقل إلى {{year}}',
        invoice: 'فاتورة',
        invoiceTitle: 'فاتورة توزيع الأرباح',
        stale: 'تغيّر الربح أو الشركاء بعد النقل. حدّث المبلغ المرحّل إلى السنة التالية.',
        branchesTitle: 'ربح كل فرع',
        branchesHint: 'المحصّل ناقص المصروفات لسنة {{year}}.',
        partnersTitle: 'الشركاء وتوزيع الأرباح',
        partnersHint: 'نسبة الشريك هي حصته من ربح هذه السنة، والخسارة تُوزَّع بنفس النسبة. الأكاديمية تحتفظ بالباقي.',
        academyShare: 'حصة الأكاديمية',
        percentLeft: 'متبقٍ {{n}}%',
        adviceRule: 'يُنصح بفتح فرع جديد فقط عندما يكون الربح النهائي موجباً، وكل الفروع رابحة، وهذا الربح لا يقل عن 15% من رأس المال المتاح.',
        adviceFigures: 'بناءً على هذه الأرقام: الربح النهائي {{profit}}، رأس المال المتاح {{capital}}، {{profitable}} فروع رابحة، {{losing}} فروع خاسرة.',
        adviceWaitTitle: 'لا تفتح فرعاً جديداً',
        adviceWaitBody: 'لا تفتح فرعاً جديداً هذه السنة. الربح النهائي {{profit}}. الفروع الخاسرة: {{losing}} من {{count}}. عالج الفروع الحالية أولاً.',
        adviceHoldTitle: 'لا تفتح فرعاً جديداً الآن',
        adviceHoldBody: 'أبقِ على الفروع الحالية. الربح النهائي {{profit}} عبر {{count}} فروع، وما زال {{losing}} منها خاسراً.',
        adviceOpenTitle: 'افتح فرعاً جديداً',
        adviceOpenBody: 'الحسابات تسمح بفرع آخر. الربح النهائي {{profit}}، وكل الفروع ({{count}}) رابحة، وهذا الربح يغطي {{coverage}}% من رأس المال المتاح.',
        adviceNoneTitle: 'لا توجد نتيجة فرع بعد',
        adviceNoneBody: 'لا يوجد ربح فروع لهذه الأكاديمية في هذه السنة.',
      }
    : {
        income: 'Income',
        expenses: 'Expenses',
        subscriptions: 'New subscriptions',
        profit: 'Branch profit',
        capital: 'Share capital',
        hintProfit: 'Branch profit is collected player-plan income minus branch expenses, including paid advertising.',
        allBranches: 'All branches',
        result: 'Profit',
        formula: 'Income − expenses = profit',
        adsTitle: 'Advertising inside this profit',
        adsPaid: 'Paid advertising in expenses',
        adsRevenue: 'Attributed revenue in income',
        adsReturn: 'Return after advertising cost',
        adsOpen: 'Unpaid advertising',
        annual: 'Annual profit distribution',
        losses: 'Carried losses',
        noProfit: 'There is no distribution when profit after carried losses is zero or a loss.',
        adsHint: 'Paid advertising sits inside expenses and reduces profit. Attributed revenue sits inside income. The return after ads is not academy net profit.',
        annualHint: 'Every branch in this academy. Revenue minus expenses, then carried losses, then the reserve.',
        allHint: 'Collected income minus expenses for each branch in the selected year.',
        ownershipShort: 'Partner shares must total 100% before these shares are approved.',
        partnerProfit: 'Partner profit',
        ownership: 'Ownership',
        allMonths: 'Every branch, every month',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        hint: 'Each player plan for this branch appears here as soon as it is assigned.',
        academy: 'Academy',
        branch: 'Branch',
        load: 'Load branch',
        search: 'Search this list',
        players: 'Players',
        billed: 'Plan total',
        paid: 'Paid',
        remaining: 'Remaining',
        cols: ['Player', 'Plan', 'Period', 'Start', 'End', 'Paid', 'Remaining', 'Status'],
        empty: 'No player plans for this branch yet.',
        status: 'Status',
        approve: 'Approve',
        history: 'History',
        other: 'Other income',
        save: 'Save',
        close: 'Close',
        title: 'Income name',
        amount: 'Amount',
        date: 'Date',
        notes: 'Notes',
        addExpense: 'Add expense',
        category: 'Category',
        employee: 'Employee',
        addSub: 'Add subscription',
        kind: 'Type',
        party: 'Party',
        year: 'Year',
        reserve: 'Reserve %',
        revenue: 'Total revenue',
        net: 'Net profit',
        distributable: 'Distributable',
        share: 'Share capital',
        inHand: 'In hand',
        yearProfit: 'Year profit',
        finalProfit: 'Final profit',
        partner: 'Partner',
        percent: 'Percent',
        addPartner: 'Add partner',
        remove: 'Remove',
        hintCapital: 'Branch profits are added into the year profit. Each partner’s percentage takes a dividend, and the remainder is the final profit.',
        brought: 'Brought forward',
        shareHint: 'The capital already recorded for this academy.',
        broughtHint: 'Final profit moved from last year.',
        yearHint: 'Income minus expenses, every branch.',
        finalHint: 'Year profit after partner dividends.',
        years: 'Profit of each year',
        yearsHint: 'Each year stands on its own. Move its final profit into the next year while that move is still open.',
        dividend: 'Dividend',
        moveShort: 'Move to {{year}}',
        updateMove: 'Update the amount moved to {{year}}',
        movedAmount: 'Already moved to {{year}}',
        invoice: 'Invoice',
        invoiceTitle: 'Share invoice',
        stale: 'Profit or partners changed after the move. Update the amount sent to next year.',
        branchesTitle: 'Profit of each branch',
        branchesHint: 'Collected income minus expenses for {{year}}.',
        partnersTitle: 'Partners and dividends',
        partnersHint: 'A partner’s percentage is their share of this year’s profit, including a loss. The academy keeps the rest.',
        academyShare: 'Academy share',
        percentLeft: '{{n}}% still available',
        adviceRule: 'Open a new branch only when the final profit is positive, every branch is profitable, and that profit is at least 15% of the capital in hand.',
        adviceFigures: 'Using these figures: final profit {{profit}}, capital in hand {{capital}}, {{profitable}} profitable branches, {{losing}} losing branches.',
        adviceWaitTitle: 'Do not open a new branch',
        adviceWaitBody: 'Do not open a new branch this year. Final profit is {{profit}}. Losing branches: {{losing}} of {{count}}. Recover the current branches first.',
        adviceHoldTitle: 'Do not open a new branch yet',
        adviceHoldBody: 'Keep the branches you have. Final profit is {{profit}} across {{count}} branches, and {{losing}} of them are still losing.',
        adviceOpenTitle: 'Open a new branch',
        adviceOpenBody: 'The books support another branch. Final profit is {{profit}}, all {{count}} branches are profitable, and that profit covers {{coverage}}% of the capital in hand.',
        adviceNoneTitle: 'No branch result yet',
        adviceNoneBody: 'This academy has no branch profit for the year.',
      };

  const title = section === 'income' ? copy.income : section === 'expenses' ? copy.expenses : section === 'subscriptions' ? copy.subscriptions : section === 'profit' ? copy.profit : copy.capital;

  const load = useCallback(async (selected: string) => {
    setLoading(true);
    setNotice('');
    const chosenYear = Number(year) || new Date().getFullYear();
    try {
      const list = await listBranches(academyId, workspace.organizationId);
      setBranches(list);
      const active = section === 'profit'
        ? (selected || (profitAll.current ? '' : list[0]?.id || ''))
        : (selected || list[0]?.id || '');
      if (active && active !== selected) setBranchId(active);
      if (section === 'share-capital') {
        const board = workspace.organizationId ? await loadShareCapital(workspace.organizationId, chosenYear) : null;
        setCapital(board);
        if (board) setCapitalInput(String(board.shareCapital || 0));
      } else if (!active && section !== 'profit') {
        setIncome(null);
        setExpenses([]);
        setCommercial(null);
      } else if (section === 'income') {
        setIncome(await loadIncome(active));
      } else if (section === 'expenses') {
        const [rows, people] = await Promise.all([loadExpenses(active), loadStaff(active).catch(() => [] as StaffRef[])]);
        setExpenses(rows);
        setStaff(people);
      } else if (section === 'subscriptions') {
        setCommercial(await loadSubscriptions(active));
      } else if (section === 'profit') {
        const [board, reflection] = await Promise.all([
          loadProfit(active, chosenYear, workspace.organizationId),
          loadAdReflection(workspace.organizationId, active, chosenYear),
        ]);
        setProfit(board);
        setAds(reflection);
        setReserve(String(board.distribution?.reservePercentage || 20));
      }
    } catch (error) {
      setNotice(errorMessage(error, 'Could not load finance'));
    } finally {
      setLoading(false);
    }
  }, [academyId, section, workspace.organizationId, year]);

  useFocusEffect(useCallback(() => { void load(branchId); }, [load, branchId]));

  function statusLabel(value: string): string {
    const labels: Record<string, [string, string]> = {
      PAID: ['مدفوع بالكامل', 'Paid'],
      PARTIALLY_PAID: ['مدفوع جزئياً', 'Partially paid'],
      UNPAID: ['غير مدفوع', 'Unpaid'],
      PENDING: ['قيد الانتظار', 'Pending'],
      OVERDUE: ['متأخر', 'Overdue'],
      PENDING_APPROVAL: ['بانتظار الاعتماد', 'Pending approval'],
      APPROVED: ['معتمد', 'Approved'],
      ACTIVE: ['نشط', 'Active'],
      CLOSED: ['مغلق', 'Closed'],
    };
    const pair = labels[value];
    return pair ? pair[ar ? 0 : 1] : value || '—';
  }

  function periodLabel(row: IncomeRow): string {
    if (row.otherIncome || row.period === 'OTHER') return ar ? 'أخرى' : 'Other';
    if (row.period === 'MONTHS') return ar ? `${row.periodMonths} أشهر` : `${row.periodMonths} months`;
    if (row.period === 'ONE_MONTH') return ar ? 'شهر واحد' : 'One month';
    if (row.period === 'THREE_MONTHS') return ar ? '3 أشهر' : '3 months';
    if (row.period === 'DAILY') return ar ? 'يوم واحد' : 'One day';
    return row.period || '—';
  }

  function categoryLabel(value: string): string {
    const labels: Record<string, [string, string]> = {
      STADIUM_RENT: ['إيجار الملعب', 'Stadium rent'],
      PAYSLIP: ['راتب الموظف', 'Payslip'],
      TRANSPORTATION: ['مواصلات', 'Transportation'],
      BONUS: ['مكافأة', 'Bonus'],
      RETURN: ['مرتجع', 'Return'],
      TOOLS: ['أدوات', 'Tools'],
      ADVERTISING: ['إعلانات', 'Advertising'],
      FACILITY: ['منشأة', 'Facility'],
      LEAGUE: ['دوري', 'League'],
      OTHER: ['أخرى', 'Other'],
    };
    const pair = labels[value];
    return pair ? pair[ar ? 0 : 1] : value || '—';
  }

  const query = search.trim().toLowerCase();
  const incomeRows = (income?.rows || []).filter((row) => !query || `${row.playerName} ${row.planName}`.toLowerCase().includes(query));
  const expenseRows = expenses.filter((row) => !query || `${row.employeeName} ${row.notes} ${row.category}`.toLowerCase().includes(query));
  const subRows = (commercial?.rows || []).filter((row) => !query || `${row.title} ${row.partyName}`.toLowerCase().includes(query));

  async function approve(row: IncomeRow) {
    setBusy(true);
    try {
      await approveIncome(row.id);
      setNotice(ar ? 'تم اعتماد الدفعة' : 'Payment approved');
      await load(branchId);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not approve'));
    } finally {
      setBusy(false);
    }
  }

  async function openHistory(row: IncomeRow) {
    if (!row.playerId) return;
    setHistoryName(row.playerName);
    setHistory([]);
    try {
      setHistory(await loadIncomeHistory(row.playerId));
    } catch (error) {
      setHistory(null);
      setNotice(errorMessage(error, 'Could not load history'));
    }
  }

  async function submitOther() {
    const amount = Number(other.amount);
    if (!branchId || !other.title.trim() || amount <= 0) {
      setNotice(ar ? 'أكمل بيانات الدخل' : 'Complete the income fields');
      return;
    }
    setBusy(true);
    try {
      await saveOtherIncome({ branchId, title: other.title.trim(), amount, incomeDate: other.date, notes: other.notes.trim() });
      setOtherOpen(false);
      await load(branchId);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save income'));
    } finally {
      setBusy(false);
    }
  }

  async function submitExpense() {
    const person = staff.find((item) => item.id === expense.staffId);
    const amount = Number(expense.amount);
    if (!branchId || amount <= 0) {
      setNotice(ar ? 'أكمل بيانات المصروف' : 'Complete the expense');
      return;
    }
    setBusy(true);
    try {
      await createExpense({
        branchId,
        category: expense.category,
        amount,
        expenseDate: expense.date,
        notes: expense.notes.trim(),
        employeeName: person?.name || '',
        employeeRole: person?.role || '',
      });
      setExpenseOpen(false);
      await load(branchId);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save the expense'));
    } finally {
      setBusy(false);
    }
  }

  async function submitSub() {
    const amount = Number(sub.amount);
    if (!branchId || !sub.title.trim() || amount <= 0) {
      setNotice(ar ? 'أكمل بيانات الاشتراك' : 'Complete the subscription');
      return;
    }
    setBusy(true);
    try {
      await createSubscription({
        branchId,
        kind: sub.kind,
        title: sub.title.trim(),
        partyName: sub.party.trim(),
        amount,
        startDate: sub.start,
        endDate: sub.end,
        status: 'ACTIVE',
        notes: sub.notes.trim(),
      });
      setSubOpen(false);
      await load(branchId);
    } catch (error) {
      setNotice(errorMessage(error, 'Could not save the subscription'));
    } finally {
      setBusy(false);
    }
  }

  const rows = profit?.branches || [];
  const summary = profit?.branch
    ? { label: profit.branch.branchName, academy: profit.branch.academyName, income: profit.branch.income, expenses: profit.branch.expenses, profit: profit.branch.profit }
    : {
        label: copy.allBranches,
        academy: rows[0]?.academyName || workspace.brandName,
        income: rows.reduce((sum, row) => sum + row.income, 0),
        expenses: rows.reduce((sum, row) => sum + row.expenses, 0),
        profit: rows.reduce((sum, row) => sum + row.profit, 0),
      };
  const tableDir = ar ? styles.reverse : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        {section !== 'share-capital' ? (
          <View style={styles.card}>
            <Text style={styles.label}>{copy.academy}</Text>
            <Text style={styles.value}>{workspace.brandName}</Text>
            <DropDown
              label={copy.branch}
              value={branchId}
              placeholder={section === 'profit' ? copy.allBranches : copy.branch}
              options={branches.map((item) => ({ id: item.id, label: item.name }))}
              onChange={(id) => {
                if (section === 'profit') profitAll.current = !id;
                setBranchId(id);
              }}
            />
            {section === 'profit' ? <Field label={copy.year} value={year} onChange={setYear} /> : null}
            <Pressable style={styles.smallPink} onPress={() => void load(branchId)}><Text style={styles.smallText}>{copy.load}</Text></Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>{copy.academy}</Text>
            <Text style={styles.value}>{workspace.brandName}</Text>
            <Field label={copy.year} value={year} onChange={setYear} />
            <Pressable style={styles.smallPink} onPress={() => void load(branchId)}><Text style={styles.smallText}>{copy.load}</Text></Pressable>
          </View>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {section === 'income' ? <Text style={styles.hint}>{copy.hint}</Text> : null}
          {section === 'profit' ? <Text style={styles.hint}>{copy.hintProfit}</Text> : null}
          {section === 'share-capital' ? <Text style={styles.hint}>{copy.hintCapital}</Text> : null}
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {loading ? <ActivityIndicator color={ink.pink} /> : null}

        {section === 'income' && income ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.meta}>{copy.billed}</Text><Text style={styles.statValue}>{money(income.billed, income.currency)}</Text></View>
              <View style={styles.stat}><Text style={styles.meta}>{copy.paid}</Text><Text style={styles.statValue}>{money(income.paid, income.currency)}</Text></View>
              <View style={styles.stat}><Text style={styles.meta}>{copy.remaining}</Text><Text style={styles.statValue}>{money(income.remaining, income.currency)}</Text></View>
              <View style={styles.stat}><Text style={styles.meta}>{copy.players}</Text><Text style={styles.statValue}>{income.rows.length}</Text><Text style={styles.meta}>{income.branchName}</Text></View>
            </View>
            <View style={styles.card}>
              {canManage ? <Pressable style={styles.smallPink} onPress={() => setOtherOpen(true)}><Text style={styles.smallText}>{copy.other}</Text></Pressable> : null}
              <TextInput value={search} onChangeText={setSearch} placeholder={copy.search} placeholderTextColor={ink.muted} style={styles.search} />
              <HScroll>
                <View>
                  <View style={styles.headerRow}>{copy.cols.map((label) => <Text key={label} style={styles.head}>{label}</Text>)}{canManage ? <Text style={styles.head} /> : null}</View>
                  {!incomeRows.length ? <Text style={styles.empty}>{copy.empty}</Text> : null}
                  {incomeRows.map((row) => (
                    <View key={row.id} style={styles.row}>
                      <Text style={styles.cell}>{row.playerName}</Text>
                      <Text style={styles.cell}>{row.planName || '—'}</Text>
                      <Text style={styles.cell}>{periodLabel(row)}</Text>
                      <Text style={styles.cell}>{row.startDate || '—'}</Text>
                      <Text style={styles.cell}>{row.endDate || '—'}</Text>
                      <Text style={styles.cell}>{money(row.paid, row.currency)}</Text>
                      <Text style={styles.cell}>{money(row.remaining, row.currency)}</Text>
                      <Text style={[styles.cell, row.status === 'OVERDUE' ? styles.bad : styles.good]}>{statusLabel(row.status)}</Text>
                      {canManage ? (
                        <View style={styles.actions}>
                          {row.current && (row.pending > 0 || row.remaining > 0) ? <Pressable style={styles.miniPink} onPress={() => void approve(row)} disabled={busy}><Text style={styles.miniText}>{copy.approve}</Text></Pressable> : null}
                          {row.playerId ? <Pressable style={styles.mini} onPress={() => void openHistory(row)}><Text style={styles.miniLabel}>{copy.history}</Text></Pressable> : null}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </HScroll>
            </View>
          </>
        ) : null}

        {section === 'expenses' ? (
          <View style={styles.card}>
            {canManage ? <Pressable style={styles.smallPink} onPress={() => setExpenseOpen(true)}><Text style={styles.smallText}>{copy.addExpense}</Text></Pressable> : null}
            <TextInput value={search} onChangeText={setSearch} placeholder={copy.search} placeholderTextColor={ink.muted} style={styles.search} />
            <HScroll>
              <View>
                <View style={styles.headerRow}>{[copy.date, copy.category, copy.employee, copy.amount, copy.notes].map((label) => <Text key={label} style={styles.head}>{label}</Text>)}</View>
                {!expenseRows.length ? <Text style={styles.empty}>—</Text> : null}
                {expenseRows.map((row) => (
                  <View key={row.id} style={styles.row}>
                    <Text style={styles.cell}>{row.expenseDate || '—'}</Text>
                    <Text style={styles.cell}>{categoryLabel(row.category)}</Text>
                    <Text style={styles.cell}>{row.employeeName || '—'}</Text>
                    <Text style={styles.cell}>{money(row.category === 'RETURN' ? -row.amount : row.amount, row.currency)}</Text>
                    <Text style={styles.cell}>{row.notes || '—'}</Text>
                  </View>
                ))}
              </View>
            </HScroll>
          </View>
        ) : null}

        {section === 'subscriptions' && commercial ? (
          <View style={styles.card}>
            <Text style={styles.meta}>{commercial.activeCount} · {money(commercial.totalAmount, commercial.currency)}</Text>
            {canManage ? <Pressable style={styles.smallPink} onPress={() => setSubOpen(true)}><Text style={styles.smallText}>{copy.addSub}</Text></Pressable> : null}
            <TextInput value={search} onChangeText={setSearch} placeholder={copy.search} placeholderTextColor={ink.muted} style={styles.search} />
            <HScroll>
              <View>
                <View style={styles.headerRow}>{[copy.title, copy.kind, copy.party, copy.amount, copy.date, copy.status].map((label) => <Text key={label} style={styles.head}>{label}</Text>)}</View>
                {subRows.map((row) => (
                  <View key={row.id} style={styles.row}>
                    <Text style={styles.cell}>{row.title}</Text>
                    <Text style={styles.cell}>{categoryLabel(row.kind)}</Text>
                    <Text style={styles.cell}>{row.partyName || '—'}</Text>
                    <Text style={styles.cell}>{money(row.amount, row.currency)}</Text>
                    <Text style={styles.cell}>{row.startDate || '—'}</Text>
                    <Text style={styles.cell}>{statusLabel(row.status)}</Text>
                    {canManage && row.status !== 'CLOSED' ? <Pressable style={styles.mini} onPress={() => void closeSubscription(row.id).then(() => load(branchId)).catch((error) => setNotice(errorMessage(error, 'Could not close')))}><Text style={styles.miniLabel}>{copy.close}</Text></Pressable> : null}
                  </View>
                ))}
              </View>
            </HScroll>
          </View>
        ) : null}

        {section === 'profit' && profit ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.meta}>{summary.label} · {copy.result}</Text>
                <Text style={[styles.statValue, summary.profit < 0 && styles.bad]}>{money(summary.profit, profit.currency)}</Text>
                <Text style={styles.meta}>{copy.formula}</Text>
              </View>
              <View style={styles.stat}><Text style={styles.meta}>{copy.income}</Text><Text style={styles.statValue}>{money(summary.income, profit.currency)}</Text></View>
              <View style={styles.stat}><Text style={styles.meta}>{copy.expenses}</Text><Text style={styles.statValue}>{money(summary.expenses, profit.currency)}</Text></View>
              <View style={styles.stat}><Text style={styles.meta}>{copy.academy}</Text><Text style={styles.statValue}>{summary.academy || workspace.brandName}</Text></View>
            </View>
            {ads ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{copy.adsTitle}</Text>
                <Text style={styles.hint}>{copy.adsHint}</Text>
                <View style={styles.stats}>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.adsPaid}</Text><Text style={styles.statValue}>{money(ads.paidExpenses, ads.currency)}</Text></View>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.adsRevenue}</Text><Text style={styles.statValue}>{money(ads.attributedRevenue, ads.currency)}</Text></View>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.adsReturn}</Text><Text style={[styles.statValue, ads.netReturn < 0 && styles.bad]}>{money(ads.netReturn, ads.currency)}</Text></View>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.adsOpen}</Text><Text style={styles.statValue}>{money(ads.outstanding, ads.currency)}</Text></View>
                </View>
              </View>
            ) : null}
            {profit.distribution ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{copy.annual} · {profit.distribution.academyName || profit.year}</Text>
                <Text style={styles.hint}>{copy.annualHint}</Text>
                <View style={styles.stats}>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.revenue}</Text><Text style={styles.statValue}>{money(profit.distribution.totalRevenue, profit.currency)}</Text></View>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.expenses}</Text><Text style={styles.statValue}>{money(profit.distribution.totalExpenses, profit.currency)}</Text></View>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.net}</Text><Text style={[styles.statValue, profit.distribution.netProfit < 0 && styles.bad]}>{money(profit.distribution.netProfit, profit.currency)}</Text></View>
                  <View style={styles.stat}><Text style={styles.meta}>{copy.losses}</Text><Text style={styles.statValue}>{money(profit.distribution.carriedLosses, profit.currency)}</Text></View>
                  <View style={styles.stat}>
                    <Text style={styles.meta}>{copy.distributable}</Text>
                    <Text style={[styles.statValue, profit.distribution.distributable <= 0 && styles.bad]}>{money(profit.distribution.distributable, profit.currency)}</Text>
                    <Text style={styles.meta}>{copy.reserve} {profit.distribution.reservePercentage}% · {money(profit.distribution.reserveAmount, profit.currency)}</Text>
                  </View>
                </View>
                {canManage ? (
                  <View style={styles.actions}>
                    <Field label={copy.reserve} value={reserve} onChange={setReserve} />
                    <PinkButton label={copy.save} disabled={busy} onPress={() => void saveReserve(profit.distribution?.organizationId || workspace.organizationId, Number(year), Number(reserve)).then(() => load(branchId)).catch((error) => setNotice(errorMessage(error, 'Could not save')))} />
                  </View>
                ) : null}
                {!profit.distribution.canDistribute ? <Text style={styles.meta}>{copy.noProfit}</Text> : !profit.distribution.ownershipComplete ? <Text style={styles.meta}>{copy.ownershipShort}</Text> : null}
                <HScroll>
                  <View>
                    <View style={[styles.headerRow, tableDir]}>
                      <Text style={styles.head}>{copy.partner}</Text>
                      <Text style={styles.head}>{copy.ownership}</Text>
                      <Text style={styles.head}>{copy.partnerProfit}</Text>
                    </View>
                    {profit.distribution.partners.map((item) => (
                      <View key={item.id || item.name} style={[styles.row, tableDir]}>
                        <Text style={styles.cell}>{item.name}</Text>
                        <Text style={styles.cell}>{item.ownership}%</Text>
                        <Text style={styles.cell}>{money(item.profit, profit.currency)}</Text>
                      </View>
                    ))}
                  </View>
                </HScroll>
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy.allMonths}</Text>
              <Text style={styles.hint}>{copy.allHint}</Text>
              <HScroll>
                <View>
                  <View style={[styles.headerRow, tableDir]}>
                    <Text style={styles.branchHead}>{copy.branch}</Text>
                    {copy.months.map((label) => <Text key={label} style={styles.month}>{label}</Text>)}
                    <Text style={styles.month}>{copy.result}</Text>
                  </View>
                  {profit.branches.map((row) => (
                    <View key={row.branchId || row.branchName} style={[styles.row, tableDir]}>
                      <View style={styles.branchCell}>
                        <View style={[styles.dot, { backgroundColor: row.color }]} />
                        <Text style={styles.headName}>{row.branchName}{'\n'}{row.academyName}</Text>
                      </View>
                      {row.months.map((cell) => (
                        <Text key={cell.month} style={[styles.month, cell.profit < 0 ? styles.bad : cell.profit > 0 ? styles.good : styles.meta]}>{money(cell.profit, profit.currency)}</Text>
                      ))}
                      <Text style={[styles.month, row.profit < 0 ? styles.bad : styles.good]}>{money(row.profit, profit.currency)}</Text>
                    </View>
                  ))}
                </View>
              </HScroll>
            </View>
          </>
        ) : null}

        {section === 'share-capital' && capital ? (
          <>
            {capital.carryStale ? <Text style={styles.notice}>{copy.stale}</Text> : null}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.meta}>{copy.share}</Text>
                <Text style={styles.statValue}>{money(capital.shareCapital, capital.currency)}</Text>
                <Text style={styles.meta}>{copy.shareHint}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.meta}>{copy.brought}</Text>
                <Text style={[styles.statValue, capital.carriedIn < 0 && styles.bad]}>{money(capital.carriedIn, capital.currency)}</Text>
                <Text style={styles.meta}>{copy.broughtHint}</Text>
              </View>
              <View style={styles.stat}><Text style={styles.meta}>{copy.inHand}</Text><Text style={styles.statValue}>{money(capital.capitalInHand, capital.currency)}</Text></View>
              <View style={styles.stat}>
                <Text style={styles.meta}>{copy.yearProfit}</Text>
                <Text style={[styles.statValue, capital.yearProfit < 0 && styles.bad]}>{money(capital.yearProfit, capital.currency)}</Text>
                <Text style={styles.meta}>{copy.yearHint}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.meta}>{copy.finalProfit} · {capital.year}</Text>
                <Text style={[styles.statValue, capital.finalProfit < 0 && styles.bad]}>{money(capital.finalProfit, capital.currency)}</Text>
                <Text style={styles.meta}>{copy.finalHint}</Text>
              </View>
            </View>
            {canManage ? (
              <View style={styles.formRow}>
                <Field label={copy.share} value={capitalInput} onChange={setCapitalInput} />
                <PinkButton label={copy.save} disabled={busy} onPress={() => void saveShareCapital(workspace.organizationId, Number(year), Number(capitalInput)).then(() => load(branchId)).catch((error) => setNotice(errorMessage(error, 'Could not save')))} />
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy.years}</Text>
              <Text style={styles.hint}>{copy.yearsHint}</Text>
              <HScroll>
                <View>
                  <View style={[styles.headerRow, tableDir]}>
                    <Text style={styles.head}>{copy.year}</Text>
                    <Text style={styles.head}>{copy.yearProfit}</Text>
                    <Text style={styles.head}>{copy.dividend}</Text>
                    <Text style={styles.head}>{copy.finalProfit}</Text>
                    <Text style={styles.yearAction} />
                  </View>
                  {capital.years.map((row) => {
                    const open = row.carryStale || (!row.carriedOut && row.finalProfit !== 0);
                    const canMove = canManage && row.year < 2100 && open;
                    return (
                      <View key={row.year} style={[styles.row, tableDir]}>
                        <Pressable onPress={() => { if (row.year !== capital.year) setYear(String(row.year)); }}><Text style={styles.cell}>{row.year}</Text></Pressable>
                        <Text style={[styles.cell, row.yearProfit < 0 ? styles.bad : row.yearProfit > 0 ? styles.good : styles.meta]}>{money(row.yearProfit, capital.currency)}</Text>
                        <Text style={[styles.cell, row.partnerShare < 0 && styles.bad]}>{money(row.partnerShare, capital.currency)}</Text>
                        <Text style={[styles.cell, row.finalProfit < 0 ? styles.bad : row.finalProfit > 0 ? styles.good : styles.meta]}>{money(row.finalProfit, capital.currency)}</Text>
                        <View style={styles.yearAction}>
                          {canMove ? (
                            <Pressable style={styles.miniPink} onPress={() => void carryProfit(workspace.organizationId, row.year).then(() => load(branchId)).catch((error) => setNotice(errorMessage(error, 'Could not move')))}>
                              <Text style={styles.miniText}>{fill(row.carryStale ? copy.updateMove : copy.moveShort, { year: row.year + 1 })}</Text>
                            </Pressable>
                          ) : row.carriedOut ? <Text style={styles.meta}>{fill(copy.movedAmount, { year: row.year + 1 })} · {money(row.carriedAmount, capital.currency)}</Text> : null}
                          {row.invoicable ? <Pressable style={styles.mini} onPress={() => setInvoice(row)}><Text style={styles.miniLabel}>{copy.invoice}</Text></Pressable> : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </HScroll>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy.branchesTitle}</Text>
              <Text style={styles.hint}>{fill(copy.branchesHint, { year: capital.year })}</Text>
              <HScroll>
                <View>
                  <View style={[styles.headerRow, tableDir]}>
                    <Text style={styles.branchHead}>{copy.branch}</Text>
                    <Text style={styles.head}>{copy.academy}</Text>
                    <Text style={styles.head}>{copy.income}</Text>
                    <Text style={styles.head}>{copy.expenses}</Text>
                    <Text style={styles.head}>{copy.result}</Text>
                  </View>
                  {capital.branches.map((row) => (
                    <View key={row.branchId || row.branchName} style={[styles.row, tableDir]}>
                      <View style={styles.branchCell}>
                        <View style={[styles.dot, { backgroundColor: row.color }]} />
                        <Text style={styles.headName}>{row.branchName}</Text>
                      </View>
                      <Text style={styles.cell}>{row.academyName || '—'}</Text>
                      <Text style={styles.cell}>{money(row.income, capital.currency)}</Text>
                      <Text style={styles.cell}>{money(row.expenses, capital.currency)}</Text>
                      <Text style={[styles.cell, row.profit < 0 ? styles.bad : row.profit > 0 ? styles.good : styles.meta]}>{money(row.profit, capital.currency)}</Text>
                    </View>
                  ))}
                  {capital.branches.length ? (
                    <View style={[styles.row, tableDir]}>
                      <Text style={styles.branchHead}>{copy.allBranches}</Text>
                      <Text style={styles.cell} />
                      <Text style={styles.cell}>{money(capital.branches.reduce((sum, row) => sum + row.income, 0), capital.currency)}</Text>
                      <Text style={styles.cell}>{money(capital.branches.reduce((sum, row) => sum + row.expenses, 0), capital.currency)}</Text>
                      <Text style={[styles.cell, capital.branches.reduce((sum, row) => sum + row.profit, 0) < 0 ? styles.bad : styles.good]}>{money(capital.branches.reduce((sum, row) => sum + row.profit, 0), capital.currency)}</Text>
                    </View>
                  ) : null}
                </View>
              </HScroll>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy.partnersTitle}</Text>
              <Text style={styles.hint}>{copy.partnersHint}</Text>
              <HScroll>
                <View>
                  <View style={[styles.headerRow, tableDir]}>
                    <Text style={styles.head}>{copy.partner}</Text>
                    <Text style={styles.head}>{copy.percent}</Text>
                    <Text style={styles.head}>{copy.dividend}</Text>
                    {canManage ? <Text style={styles.head} /> : null}
                  </View>
                  {capital.partners.map((item) => (
                    <View key={item.id || item.name} style={[styles.row, tableDir]}>
                      <Text style={styles.cell}>{item.name}</Text>
                      <Text style={styles.cell}>{item.percentage}%</Text>
                      <Text style={[styles.cell, item.dividend < 0 && styles.bad]}>{money(item.dividend, capital.currency)}</Text>
                      {canManage ? <Pressable style={styles.mini} onPress={() => void removePartner(item.id, workspace.organizationId, Number(year)).then(() => load(branchId)).catch((error) => setNotice(errorMessage(error, 'Could not remove')))}><Text style={styles.miniLabel}>{copy.remove}</Text></Pressable> : null}
                    </View>
                  ))}
                  <View style={[styles.row, tableDir]}>
                    <Text style={styles.cell}>{copy.academyShare}</Text>
                    <Text style={styles.cell}>{capital.academyPercent}%</Text>
                    <Text style={[styles.cell, capital.finalProfit < 0 && styles.bad]}>{money(capital.finalProfit, capital.currency)}</Text>
                  </View>
                </View>
              </HScroll>
              {canManage ? (
                <View style={styles.formRow}>
                  <Field label={copy.partner} value={partner.name} onChange={(name) => setPartner({ ...partner, name })} />
                  <Field label={copy.percent} value={partner.percent} onChange={(percent) => setPartner({ ...partner, percent })} />
                  <Text style={styles.meta}>{fill(copy.percentLeft, { n: Math.max(0, Math.round((100 - capital.partners.reduce((sum, item) => sum + item.percentage, 0)) * 100) / 100) })}</Text>
                  <PinkButton label={copy.addPartner} disabled={busy || capital.partners.reduce((sum, item) => sum + item.percentage, 0) >= 100} onPress={() => void addPartner(workspace.organizationId, Number(year), partner.name.trim(), Number(partner.percent)).then(() => { setPartner({ name: '', percent: '' }); return load(branchId); }).catch((error) => setNotice(errorMessage(error, 'Could not add')))} />
                </View>
              ) : null}
            </View>
            <View style={styles.advice}>
              <Text style={styles.adviceTitle}>{capital.advice.decision === 'OPEN' ? copy.adviceOpenTitle : capital.advice.decision === 'HOLD' ? copy.adviceHoldTitle : capital.advice.decision === 'WAIT' ? copy.adviceWaitTitle : copy.adviceNoneTitle}</Text>
              <Text style={styles.hint}>{fill(capital.advice.decision === 'OPEN' ? copy.adviceOpenBody : capital.advice.decision === 'HOLD' ? copy.adviceHoldBody : capital.advice.decision === 'WAIT' ? copy.adviceWaitBody : copy.adviceNoneBody, { profit: money(capital.advice.retainedProfit, capital.currency), capital: money(capital.advice.capitalBase, capital.currency), count: capital.advice.branchCount, profitable: capital.advice.profitable, losing: capital.advice.losing, coverage: capital.advice.coveragePercent })}</Text>
              <Text style={styles.meta}>{fill(copy.adviceFigures, { profit: money(capital.advice.retainedProfit, capital.currency), capital: money(capital.advice.capitalBase, capital.currency), profitable: capital.advice.profitable, losing: capital.advice.losing })}</Text>
              <Text style={styles.meta}>{copy.adviceRule}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={invoice !== null} transparent animationType="slide" onRequestClose={() => setInvoice(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{copy.invoiceTitle} {invoice?.year} · {capital?.academyName || workspace.brandName}</Text>
            <Text style={styles.meta}>{copy.yearProfit}: {money(invoice?.yearProfit || 0, capital?.currency)}</Text>
            <Text style={styles.meta}>{copy.finalProfit}: {money(invoice?.finalProfit || 0, capital?.currency)}</Text>
            {(invoice?.partners || []).map((item) => (
              <Text key={item.id || item.name} style={styles.value}>{item.name} · {item.percentage}% · {money(item.dividend, capital?.currency)}</Text>
            ))}
            <Text style={styles.value}>{copy.academyShare} · {invoice?.academyPercent || 0}% · {money(invoice?.finalProfit || 0, capital?.currency)}</Text>
            <WhiteButton label={copy.close} onPress={() => setInvoice(null)} />
          </View>
        </View>
      </Modal>
      <Modal visible={history !== null} transparent animationType="slide" onRequestClose={() => setHistory(null)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 8 }}>
            <Text style={styles.cardTitle}>{copy.history} · {historyName}</Text>
            {(history || []).map((row) => (
              <Text key={row.id} style={styles.meta}>{row.planName || '—'} · {periodLabel(row)} · {row.startDate || '—'} · {money(row.paid, row.currency)} · {statusLabel(row.status)}</Text>
            ))}
            <WhiteButton label={copy.close} onPress={() => setHistory(null)} />
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={otherOpen} transparent animationType="slide" onRequestClose={() => setOtherOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.cardTitle}>{copy.other}</Text>
            <Field label={copy.title} value={other.title} onChange={(title) => setOther({ ...other, title })} />
            <Field label={copy.amount} value={other.amount} onChange={(amount) => setOther({ ...other, amount })} />
            <Field label={copy.date} value={other.date} onChange={(date) => setOther({ ...other, date })} placeholder="YYYY-MM-DD" />
            <Field label={copy.notes} value={other.notes} onChange={(notes) => setOther({ ...other, notes })} />
            <View style={styles.actions}><PinkButton label={copy.save} disabled={busy} onPress={() => void submitOther()} /><WhiteButton label={copy.close} onPress={() => setOtherOpen(false)} /></View>
          </View>
        </View>
      </Modal>
      <Modal visible={expenseOpen} transparent animationType="slide" onRequestClose={() => setExpenseOpen(false)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 10 }}>
            <Text style={styles.cardTitle}>{copy.addExpense}</Text>
            <DropDown label={copy.category} value={expense.category} placeholder={copy.category} options={CATEGORIES.map((id) => ({ id, label: categoryLabel(id) }))} onChange={(category) => setExpense({ ...expense, category })} />
            <Field label={copy.amount} value={expense.amount} onChange={(amount) => setExpense({ ...expense, amount })} />
            <Field label={copy.date} value={expense.date} onChange={(date) => setExpense({ ...expense, date })} />
            <DropDown label={copy.employee} value={expense.staffId} placeholder={copy.employee} options={staff.map((item) => ({ id: item.id, label: item.name }))} onChange={(staffId) => setExpense({ ...expense, staffId })} />
            <Field label={copy.notes} value={expense.notes} onChange={(notes) => setExpense({ ...expense, notes })} />
            <View style={styles.actions}><PinkButton label={copy.save} disabled={busy} onPress={() => void submitExpense()} /><WhiteButton label={copy.close} onPress={() => setExpenseOpen(false)} /></View>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={subOpen} transparent animationType="slide" onRequestClose={() => setSubOpen(false)}>
        <View style={styles.modal}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 10 }}>
            <Text style={styles.cardTitle}>{copy.addSub}</Text>
            <DropDown label={copy.kind} value={sub.kind} placeholder={copy.kind} options={KINDS.map((id) => ({ id, label: categoryLabel(id) }))} onChange={(kind) => setSub({ ...sub, kind })} />
            <Field label={copy.title} value={sub.title} onChange={(title) => setSub({ ...sub, title })} />
            <Field label={copy.party} value={sub.party} onChange={(party) => setSub({ ...sub, party })} />
            <Field label={copy.amount} value={sub.amount} onChange={(amount) => setSub({ ...sub, amount })} />
            <Field label={copy.date} value={sub.start} onChange={(start) => setSub({ ...sub, start })} />
            <View style={styles.actions}><PinkButton label={copy.save} disabled={busy} onPress={() => void submitSub()} /><WhiteButton label={copy.close} onPress={() => setSubOpen(false)} /></View>
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
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '47%', backgroundColor: ink.card, borderRadius: 14, borderWidth: 1, borderColor: ink.pink, padding: 10, gap: 4 },
  statValue: { color: ink.text, fontSize: 16, fontWeight: '800' },
  meta: { color: ink.muted, fontSize: 12 },
  search: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: ink.line, color: ink.text, paddingHorizontal: 12 },
  headerRow: { flexDirection: 'row', backgroundColor: '#6b1230', borderRadius: 8, paddingVertical: 8 },
  head: { width: 110, color: ink.white, fontSize: 11, fontWeight: '800', paddingHorizontal: 6 },
  month: { width: 78, color: ink.text, fontSize: 11, fontWeight: '700', paddingHorizontal: 4 },
  branchHead: { width: 128, color: ink.white, fontSize: 11, fontWeight: '800', paddingHorizontal: 6 },
  branchCell: { width: 128, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 },
  headName: { flex: 1, color: ink.text, fontSize: 12, fontWeight: '800' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  reverse: { flexDirection: 'row-reverse' },
  yearAction: { width: 168, gap: 6, paddingHorizontal: 6 },
  formRow: { gap: 8 },
  advice: { borderRadius: 16, borderWidth: 1, borderColor: '#6b1230', backgroundColor: '#2a1218', padding: 14, gap: 8 },
  adviceTitle: { color: '#f0c14a', fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 10 },
  cell: { width: 110, color: ink.text, fontSize: 12, paddingHorizontal: 6 },
  actions: { width: 150, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 6 },
  miniPink: { minHeight: 28, paddingHorizontal: 8, borderRadius: 8, backgroundColor: ink.pink, alignItems: 'center', justifyContent: 'center' },
  miniText: { color: ink.white, fontSize: 11, fontWeight: '800' },
  mini: { minHeight: 28, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: ink.line, alignItems: 'center', justifyContent: 'center' },
  miniLabel: { color: ink.text, fontSize: 11, fontWeight: '800' },
  empty: { color: ink.muted, padding: 12 },
  good: { color: '#8ee0b0' },
  bad: { color: '#ffb4b4' },
  rowCard: { gap: 2, borderBottomWidth: 1, borderBottomColor: ink.line, paddingVertical: 8 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: ink.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 12, maxHeight: '90%' },
});
