import { apiRequest } from '@/api/client';

export type TrainingScanResult = {
  message: string;
  remainingSessions: number | null;
};

export type StaffScanResult = {
  action: string;
  workDate: string;
  branchName: string;
  attendanceTime: string;
  finishTime: string;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** Players scan a training QR. The API records attendance and consumes one session. */
export async function scanTrainingQr(token: string): Promise<TrainingScanResult> {
  const body = await apiRequest<Record<string, unknown>>('/training-sessions/scan', {
    method: 'POST',
    auth: true,
    body: { token },
  });
  if (body.success === false) {
    throw new Error(text(body.message) || 'Attendance was not recorded');
  }
  const data = record(body.data);
  const remaining = data?.remainingSessions;
  return {
    message: text(body.message),
    remainingSessions: typeof remaining === 'number' ? remaining : null,
  };
}

/** Coaches and administrative staff scan a branch QR. The API records attendance only. */
export async function scanStaffQr(token: string, latitude: number, longitude: number): Promise<StaffScanResult> {
  const body = await apiRequest<Record<string, unknown>>('/staff-attendance/scan', {
    method: 'POST',
    auth: true,
    body: { token, latitude, longitude },
  });
  return {
    action: text(body.action),
    workDate: text(body.workDate),
    branchName: text(body.branchName),
    attendanceTime: text(body.attendanceTime),
    finishTime: text(body.finishTime),
  };
}
