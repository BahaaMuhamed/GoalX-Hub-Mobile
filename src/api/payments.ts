import { apiRequest } from '@/api/client';

export type PayMethod = { id: string; name: string; academyId: string; archived: boolean };
export type PayPlan = {
  id: string;
  name: string;
  durationMonths: number;
  sessionCount: number | null;
  amount: number;
  currency: string;
  academyId: string;
  active: boolean;
  archived: boolean;
};

const MANAGERS = new Set(['ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE', 'ACCOUNTANT']);

export function canManagePayments(role: string): boolean {
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

export async function listPaymentMethods(organizationId: string): Promise<PayMethod[]> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  const body = await apiRequest<unknown>(`/payment-methods${query}`, { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    return {
      id: text(row?.id),
      name: text(row?.name),
      academyId: text(row?.academyId),
      archived: row?.archived === true,
    };
  }).filter((item) => item.id && !item.archived);
}

export async function savePaymentMethod(input: { id?: string; name: string; organizationId: string; academyId: string }): Promise<void> {
  await apiRequest(input.id ? `/payment-methods/${input.id}` : '/payment-methods', {
    method: input.id ? 'PUT' : 'POST',
    auth: true,
    body: { name: input.name.trim(), organizationId: input.organizationId, academyId: input.academyId },
  });
}

export async function removePaymentMethod(id: string): Promise<void> {
  await apiRequest(`/payment-methods/${id}`, { method: 'DELETE', auth: true });
}

export async function listPaymentPlans(organizationId: string): Promise<PayPlan[]> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  const body = await apiRequest<unknown>(`/payment-plans${query}`, { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    return {
      id: text(row?.id),
      name: text(row?.name),
      durationMonths: numberOf(row?.durationMonths),
      sessionCount: row?.sessionCount == null ? null : numberOf(row?.sessionCount),
      amount: numberOf(row?.amount),
      currency: text(row?.currency) || 'EGP',
      academyId: text(row?.academyId),
      active: row?.active !== false,
      archived: row?.archived === true,
    };
  }).filter((item) => item.id && !item.archived && item.active);
}

export async function savePaymentPlan(input: {
  id?: string;
  name: string;
  durationMonths: number;
  sessionCount: number;
  amount: number;
  organizationId: string;
  academyId: string;
}): Promise<void> {
  await apiRequest(input.id ? `/payment-plans/${input.id}` : '/payment-plans', {
    method: input.id ? 'PUT' : 'POST',
    auth: true,
    body: {
      name: input.name.trim(),
      durationMonths: input.durationMonths,
      sessionCount: input.sessionCount,
      amount: input.amount,
      currency: 'EGP',
      organizationId: input.organizationId,
      academyId: input.academyId,
      active: true,
    },
  });
}

export async function removePaymentPlan(id: string): Promise<void> {
  await apiRequest(`/payment-plans/${id}`, { method: 'DELETE', auth: true });
}

export async function assignPlan(input: {
  organizationId: string;
  playerId: string;
  planId: string;
  paymentMethodId: string;
  branchId: string;
  groupId: string;
  amountPaid: number;
  startDate: string;
  notes: string;
}): Promise<void> {
  await apiRequest('/payment-plans/assign', { method: 'POST', auth: true, body: input });
}

export function contractEnd(start: string, months: number): string {
  if (!start || !months) return '';
  const date = new Date(`${start}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + months * 31);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
