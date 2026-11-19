import { apiRequest } from '@/api/client';

export type StaffDay = {
  workDate: string;
  branchName: string;
  attendanceTime: string;
  finishTime: string;
  missingHours: number;
};

export type StaffEmployee = {
  userId: string;
  fullName: string;
  role: string;
  daysAttended: number;
  missingDays: number;
  missingHours: number;
  attendanceTime: string;
  finishTime: string;
  days: StaffDay[];
};

export type StaffReport = {
  expectedDailyHours: number;
  employees: StaffEmployee[];
};

const REPORT_ROLES = new Set(['ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN']);

export function canSeeStaffReport(role: string): boolean {
  return REPORT_ROLES.has(role);
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

function mapEmployee(value: unknown): StaffEmployee | null {
  const row = record(value);
  const userId = text(row?.userId);
  if (!userId) return null;
  const days = Array.isArray(row?.days) ? row.days : [];
  return {
    userId,
    fullName: text(row?.fullName) || 'Employee',
    role: text(row?.role),
    daysAttended: numberOf(row?.daysAttended),
    missingDays: numberOf(row?.missingDays),
    missingHours: numberOf(row?.missingHours),
    attendanceTime: text(row?.attendanceTime),
    finishTime: text(row?.finishTime),
    days: days.map((item) => {
      const day = record(item);
      return {
        workDate: text(day?.workDate),
        branchName: text(day?.branchName),
        attendanceTime: text(day?.attendanceTime),
        finishTime: text(day?.finishTime),
        missingHours: numberOf(day?.missingHours),
      };
    }),
  };
}

export async function loadStaffReport(input: {
  mine: boolean;
  organizationId: string;
  academyId: string;
  branchId: string;
  from: string;
  to: string;
}): Promise<StaffReport> {
  const params = [`from=${encodeURIComponent(input.from)}`, `to=${encodeURIComponent(input.to)}`];
  if (!input.mine) {
    if (input.organizationId) params.push(`organizationId=${encodeURIComponent(input.organizationId)}`);
    if (input.academyId) params.push(`academyId=${encodeURIComponent(input.academyId)}`);
    if (input.branchId) params.push(`branchId=${encodeURIComponent(input.branchId)}`);
  }
  const body = await apiRequest<Record<string, unknown>>(
    input.mine ? `/staff-attendance/me?${params.join('&')}` : `/staff-attendance/report?${params.join('&')}`,
    { auth: true },
  );
  const employees = Array.isArray(body.employees) ? body.employees : [];
  return {
    expectedDailyHours: numberOf(body.expectedDailyHours),
    employees: employees.map(mapEmployee).filter((item): item is StaffEmployee => !!item),
  };
}

export function formatHours(value: number): string {
  const total = Math.max(0, Math.round(value * 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export function clock(value: string): string {
  if (!value) return '—';
  const match = value.match(/(\d{2}:\d{2})/);
  return match ? match[1] : value;
}
