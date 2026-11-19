import { apiRequest } from '@/api/client';

export type IncomeRow = {
  id: string;
  playerId: string;
  playerName: string;
  planName: string;
  period: string;
  periodMonths: number;
  startDate: string;
  endDate: string;
  amount: number;
  paid: number;
  pending: number;
  remaining: number;
  status: string;
  current: boolean;
  otherIncome: boolean;
  currency: string;
  notes: string;
};

export type IncomeBoard = {
  branchName: string;
  academyName: string;
  currency: string;
  billed: number;
  paid: number;
  remaining: number;
  rows: IncomeRow[];
};

export type ExpenseRow = {
  id: string;
  category: string;
  employeeName: string;
  employeeRole: string;
  amount: number;
  expenseDate: string;
  notes: string;
  currency: string;
};

export type StaffRef = { id: string; name: string; role: string };

export type CommercialRow = {
  id: string;
  kind: string;
  title: string;
  partyName: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
  currency: string;
};

export type CommercialBoard = {
  currency: string;
  activeCount: number;
  totalAmount: number;
  rows: CommercialRow[];
};

export type MonthCell = { month: number; income: number; expenses: number; profit: number };

export type BranchYear = {
  branchId: string;
  branchName: string;
  academyName: string;
  color: string;
  income: number;
  expenses: number;
  profit: number;
  months: MonthCell[];
};

export type ProfitPartner = { id: string; name: string; ownership: number; profit: number };

export type ProfitDistribution = {
  organizationId: string;
  academyName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  carriedLosses: number;
  reservePercentage: number;
  reserveAmount: number;
  distributable: number;
  canDistribute: boolean;
  ownershipComplete: boolean;
  ownershipTotal: number;
  partners: ProfitPartner[];
};

export type ProfitBoard = {
  year: number;
  currency: string;
  branch: BranchYear | null;
  branches: BranchYear[];
  distribution: ProfitDistribution | null;
};

export type AdReflection = {
  paidExpenses: number;
  outstanding: number;
  attributedRevenue: number;
  netReturn: number;
  currency: string;
};

export type SharePartner = { id: string; name: string; percentage: number; dividend: number };

export type ShareBranch = {
  branchId: string;
  branchName: string;
  academyName: string;
  color: string;
  income: number;
  expenses: number;
  profit: number;
};

export type ShareYear = {
  year: number;
  yearProfit: number;
  partnerShare: number;
  academyPercent: number;
  finalProfit: number;
  carriedOut: boolean;
  carriedAmount: number;
  carryStale: boolean;
  invoicable: boolean;
  partners: SharePartner[];
};

export type BranchAdvice = {
  decision: string;
  branchCount: number;
  profitable: number;
  losing: number;
  retainedProfit: number;
  capitalBase: number;
  coveragePercent: number;
};

export type ShareCapitalBoard = {
  year: number;
  currency: string;
  academyName: string;
  shareCapital: number;
  carriedIn: number;
  capitalInHand: number;
  yearProfit: number;
  partnerShare: number;
  academyPercent: number;
  finalProfit: number;
  carriedOut: boolean;
  carriedAmount: number;
  carryStale: boolean;
  branches: ShareBranch[];
  partners: SharePartner[];
  advice: BranchAdvice;
  years: ShareYear[];
};

const MANAGERS = new Set(['ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']);

export function canManageFinance(role: string): boolean {
  return MANAGERS.has(role);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function numberOf(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function mapIncome(value: unknown): IncomeRow | null {
  const row = record(value);
  const id = text(row?.id);
  if (!id) return null;
  return {
    id,
    playerId: text(row?.playerId),
    playerName: text(row?.playerName) || '—',
    planName: text(row?.planName),
    period: text(row?.period),
    periodMonths: numberOf(row?.periodMonths),
    startDate: text(row?.startDate),
    endDate: text(row?.endDate),
    amount: numberOf(row?.amount),
    paid: numberOf(row?.paid),
    pending: numberOf(row?.pending),
    remaining: numberOf(row?.remaining),
    status: text(row?.status),
    current: row?.current !== false,
    otherIncome: row?.otherIncome === true,
    currency: text(row?.currency) || 'EGP',
    notes: text(row?.notes),
  };
}

export async function loadIncome(branchId: string): Promise<IncomeBoard> {
  const body = await apiRequest<Record<string, unknown>>(`/finance/income?branchId=${encodeURIComponent(branchId)}`, { auth: true });
  const rows = Array.isArray(body.rows) ? body.rows : [];
  return {
    branchName: text(body.branchName),
    academyName: text(body.academyName),
    currency: text(body.currency) || 'EGP',
    billed: numberOf(body.billed),
    paid: numberOf(body.paid),
    remaining: numberOf(body.remaining),
    rows: rows.map(mapIncome).filter((item): item is IncomeRow => !!item),
  };
}

export async function loadIncomeHistory(playerId: string): Promise<IncomeRow[]> {
  const body = await apiRequest<unknown>(`/finance/income/history?playerId=${encodeURIComponent(playerId)}`, { auth: true });
  return (Array.isArray(body) ? body : []).map(mapIncome).filter((item): item is IncomeRow => !!item);
}

export async function approveIncome(subscriptionId: string): Promise<void> {
  await apiRequest(`/finance/income/${subscriptionId}/approve`, { method: 'POST', auth: true, body: {} });
}

export async function saveOtherIncome(input: { branchId: string; title: string; amount: number; incomeDate: string; notes: string }): Promise<void> {
  await apiRequest('/finance/income/other', { method: 'POST', auth: true, body: input });
}

export async function loadExpenses(branchId: string): Promise<ExpenseRow[]> {
  const body = await apiRequest<unknown>(`/finance/expenses?branchId=${encodeURIComponent(branchId)}`, { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    return {
      id: text(row?.id),
      category: text(row?.category),
      employeeName: text(row?.employeeName),
      employeeRole: text(row?.employeeRole),
      amount: numberOf(row?.amount),
      expenseDate: text(row?.expenseDate),
      notes: text(row?.notes),
      currency: text(row?.currency) || 'EGP',
    };
  }).filter((item) => item.id);
}

export async function loadStaff(branchId: string): Promise<StaffRef[]> {
  const body = await apiRequest<unknown>(`/finance/staff?branchId=${encodeURIComponent(branchId)}`, { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    return { id: text(row?.id), name: text(row?.name), role: text(row?.role) };
  }).filter((item) => item.id);
}

export async function createExpense(input: {
  branchId: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes: string;
  employeeName: string;
  employeeRole: string;
}): Promise<void> {
  await apiRequest('/finance/expenses', { method: 'POST', auth: true, body: input });
}

export async function loadSubscriptions(branchId: string): Promise<CommercialBoard> {
  const body = await apiRequest<Record<string, unknown>>(`/finance/subscriptions?branchId=${encodeURIComponent(branchId)}`, { auth: true });
  const rows = Array.isArray(body.rows) ? body.rows : [];
  return {
    currency: text(body.currency) || 'EGP',
    activeCount: numberOf(body.activeCount),
    totalAmount: numberOf(body.totalAmount),
    rows: rows.map((item) => {
      const row = record(item);
      return {
        id: text(row?.id),
        kind: text(row?.kind),
        title: text(row?.title),
        partyName: text(row?.partyName),
        amount: numberOf(row?.amount),
        startDate: text(row?.startDate),
        endDate: text(row?.endDate),
        status: text(row?.status),
        notes: text(row?.notes),
        currency: text(row?.currency) || 'EGP',
      };
    }).filter((item) => item.id),
  };
}

export async function createSubscription(input: {
  branchId: string;
  kind: string;
  title: string;
  partyName: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
}): Promise<void> {
  await apiRequest('/finance/subscriptions', { method: 'POST', auth: true, body: input });
}

export async function closeSubscription(id: string): Promise<void> {
  await apiRequest(`/finance/subscriptions/${id}/close`, { method: 'POST', auth: true, body: {} });
}

function mapYear(value: unknown): BranchYear | null {
  const row = record(value);
  if (!row) return null;
  const months = Array.isArray(row.months) ? row.months : [];
  return {
    branchId: text(row.branchId),
    branchName: text(row.branchName),
    academyName: text(row.academyName),
    color: text(row.color) || '#ff2d6a',
    income: numberOf(row.income),
    expenses: numberOf(row.expenses),
    profit: numberOf(row.profit),
    months: months.map((item) => {
      const cell = record(item);
      return { month: numberOf(cell?.month), income: numberOf(cell?.income), expenses: numberOf(cell?.expenses), profit: numberOf(cell?.profit) };
    }),
  };
}

export async function loadProfit(branchId: string, year: number, organizationId: string): Promise<ProfitBoard> {
  const params = [`year=${year}`];
  if (branchId) params.push(`branchId=${encodeURIComponent(branchId)}`);
  if (organizationId) params.push(`organizationId=${encodeURIComponent(organizationId)}`);
  const body = await apiRequest<Record<string, unknown>>(`/finance/profit?${params.join('&')}`, { auth: true });
  const distribution = record(body.distribution);
  const partners = Array.isArray(distribution?.partners) ? distribution.partners : [];
  const branches = Array.isArray(body.branches) ? body.branches.map(mapYear).filter((item): item is BranchYear => !!item) : [];
  return {
    year: numberOf(body.year) || year,
    currency: text(body.currency) || 'EGP',
    branch: mapYear(body.branch),
    branches,
    distribution: distribution
      ? {
          organizationId: text(distribution.organizationId),
          academyName: text(distribution.academyName),
          totalRevenue: numberOf(distribution.totalRevenue),
          totalExpenses: numberOf(distribution.totalExpenses),
          netProfit: numberOf(distribution.netProfit),
          carriedLosses: numberOf(distribution.carriedLosses),
          reservePercentage: numberOf(distribution.reservePercentage),
          reserveAmount: numberOf(distribution.reserveAmount),
          distributable: numberOf(distribution.distributable),
          canDistribute: distribution.canDistribute === true,
          ownershipTotal: numberOf(distribution.ownershipTotal),
          ownershipComplete: distribution.ownershipComplete === true,
          partners: partners.map((item) => {
            const row = record(item);
            return { id: text(row?.partnerId), name: text(row?.name), ownership: numberOf(row?.ownership), profit: numberOf(row?.profit) };
          }).filter((item) => item.id || item.name),
        }
      : null,
  };
}

export async function loadAdReflection(organizationId: string, branchId: string, year: number): Promise<AdReflection | null> {
  const params = [`year=${year}`];
  if (organizationId) params.push(`organizationId=${encodeURIComponent(organizationId)}`);
  if (branchId) params.push(`branchId=${encodeURIComponent(branchId)}`);
  try {
    const body = await apiRequest<Record<string, unknown>>(`/advertising/finance-reflection?${params.join('&')}`, { auth: true });
    return {
      paidExpenses: numberOf(body.paidExpenses),
      outstanding: numberOf(body.outstanding),
      attributedRevenue: numberOf(body.attributedRevenue),
      netReturn: numberOf(body.netReturn),
      currency: text(body.currency) || 'EGP',
    };
  } catch {
    return null;
  }
}

export async function saveReserve(organizationId: string, year: number, reservePercentage: number): Promise<void> {
  await apiRequest('/finance/profit/reserve', { method: 'PUT', auth: true, body: { organizationId, year, reservePercentage } });
}

function mapPartner(value: unknown): SharePartner | null {
  const row = record(value);
  const id = text(row?.id);
  const name = text(row?.name);
  if (!id && !name) return null;
  return { id, name, percentage: numberOf(row?.percentage), dividend: numberOf(row?.dividend) };
}

function mapShare(body: Record<string, unknown>, year: number): ShareCapitalBoard {
  const advice = record(body.advice);
  const partners = Array.isArray(body.partners) ? body.partners.map(mapPartner).filter((item): item is SharePartner => !!item) : [];
  const branches = Array.isArray(body.branches) ? body.branches : [];
  const years = Array.isArray(body.years) ? body.years : [];
  return {
    year: numberOf(body.year) || year,
    currency: text(body.currency) || 'EGP',
    academyName: text(body.academyName),
    shareCapital: numberOf(body.shareCapital),
    carriedIn: numberOf(body.carriedIn),
    capitalInHand: numberOf(body.capitalInHand),
    yearProfit: numberOf(body.yearProfit),
    partnerShare: numberOf(body.partnerShare),
    academyPercent: numberOf(body.academyPercent),
    finalProfit: numberOf(body.finalProfit),
    carriedOut: body.carriedOut === true,
    carriedAmount: numberOf(body.carriedAmount),
    carryStale: body.carryStale === true,
    branches: branches.map((item) => {
      const row = record(item);
      return {
        branchId: text(row?.branchId),
        branchName: text(row?.branchName),
        academyName: text(row?.academyName),
        color: text(row?.color) || '#ff2d6a',
        income: numberOf(row?.income),
        expenses: numberOf(row?.expenses),
        profit: numberOf(row?.profit),
      };
    }).filter((item) => item.branchId || item.branchName),
    partners,
    advice: {
      decision: text(advice?.decision) || 'NONE',
      branchCount: numberOf(advice?.branchCount),
      profitable: numberOf(advice?.profitable),
      losing: numberOf(advice?.losing),
      retainedProfit: numberOf(advice?.retainedProfit),
      capitalBase: numberOf(advice?.capitalBase),
      coveragePercent: numberOf(advice?.coveragePercent),
    },
    years: years.map((item) => {
      const row = record(item);
      const people = Array.isArray(row?.partners) ? row.partners.map(mapPartner).filter((person): person is SharePartner => !!person) : [];
      return {
        year: numberOf(row?.year),
        yearProfit: numberOf(row?.yearProfit),
        partnerShare: numberOf(row?.partnerShare),
        academyPercent: numberOf(row?.academyPercent),
        finalProfit: numberOf(row?.finalProfit),
        carriedOut: row?.carriedOut === true,
        carriedAmount: numberOf(row?.carriedAmount),
        carryStale: row?.carryStale === true,
        invoicable: row?.invoicable === true,
        partners: people,
      };
    }).filter((item) => item.year > 0),
  };
}

export async function loadShareCapital(organizationId: string, year: number): Promise<ShareCapitalBoard> {
  const body = await apiRequest<Record<string, unknown>>(
    `/finance/share-capital?organizationId=${encodeURIComponent(organizationId)}&year=${year}`,
    { auth: true },
  );
  return mapShare(body, year);
}

export async function saveShareCapital(organizationId: string, year: number, shareCapital: number): Promise<void> {
  await apiRequest('/finance/share-capital', { method: 'PUT', auth: true, body: { organizationId, year, shareCapital } });
}

export async function addPartner(organizationId: string, year: number, name: string, percentage: number): Promise<void> {
  await apiRequest('/finance/share-capital/partners', { method: 'POST', auth: true, body: { organizationId, year, name, percentage } });
}

export async function removePartner(id: string, organizationId: string, year: number): Promise<void> {
  await apiRequest(`/finance/share-capital/partners/${id}?organizationId=${encodeURIComponent(organizationId)}&year=${year}`, { method: 'DELETE', auth: true });
}

export async function carryProfit(organizationId: string, year: number): Promise<void> {
  await apiRequest('/finance/share-capital/carry', { method: 'POST', auth: true, body: { organizationId, year } });
}

export function money(amount: number, currency = 'EGP'): string {
  const formatted = Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${currency} ${formatted}`;
}
