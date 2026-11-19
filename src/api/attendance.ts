import { apiRequest } from '@/api/client';
import { loadSession, type SessionDetail } from '@/api/training';

export type CompletedSession = {
  id: string;
  branchId: string;
  place: string;
  branchName: string;
  groupName: string;
  trainingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  presentCount: number;
  playerCount: number;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export async function listCompletedSessions(branchId: string): Promise<CompletedSession[]> {
  const query = branchId ? `?scope=history&groupId=${encodeURIComponent(branchId)}` : '?scope=history';
  const body = await apiRequest<unknown>(`/training-sessions${query}`, { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    const place = text(row?.groupName);
    const [branchName, groupName] = place.includes(' · ') ? place.split(' · ') : [place, ''];
    return {
      id: text(row?.id),
      branchId: text(row?.groupId),
      place,
      branchName: branchName || '—',
      groupName: groupName || '—',
      trainingDate: text(row?.trainingDate),
      startTime: text(row?.startTime).slice(0, 5),
      endTime: text(row?.endTime).slice(0, 5),
      status: text(row?.status),
      presentCount: typeof row?.presentCount === 'number' ? row.presentCount : 0,
      playerCount: typeof row?.playerCount === 'number' ? row.playerCount : 0,
    };
  }).filter((item) => item.id && item.status === 'COMPLETED');
}

export function loadAttendance(sessionId: string): Promise<SessionDetail> {
  return loadSession(sessionId);
}
