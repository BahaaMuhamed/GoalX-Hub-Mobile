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

export type AttendanceTeam = {
  id: string;
  name: string;
  ageGroup: string;
};

export type StaffSessionRow = {
  id: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string;
  locationName: string;
  status: string;
  branchName: string;
  groupName: string;
};

export type RosterPlayer = {
  id: string;
  name: string;
};

export type LedgerRecord = {
  playerId: string;
  trainingSessionId: string;
  status: string;
  checkInTime: string;
};

export type StaffBoard = {
  sessions: StaffSessionRow[];
  roster: RosterPlayer[];
  records: LedgerRecord[];
};

/** Teams the website shell loads before the attendance table. */
export async function listAttendanceTeams(role: string, organizationId: string, academyId: string): Promise<AttendanceTeam[]> {
  if (role === 'COACH') {
    return mapTeams(await readList('/teams?assignedToMe=true'));
  }
  if (academyId) {
    const byAcademy = await readList(`/organizations/academies/${encodeURIComponent(academyId)}/branches`).catch(() =>
      readList(`/organizations/academies/${encodeURIComponent(academyId)}/teams`),
    );
    if (byAcademy.length) return mapTeams(byAcademy);
  }
  if (!organizationId) return [];
  return mapTeams(await readList(`/teams?organizationId=${encodeURIComponent(organizationId)}`).catch(() => []));
}

/** Same team sessions, roster, and per-player history the website attendance table uses. */
export async function loadStaffBoard(teamId: string, organizationId: string, teams: AttendanceTeam[]): Promise<StaffBoard> {
  if (!teamId) return { sessions: [], roster: [], records: [] };
  const team = teams.find((item) => item.id === teamId);
  const [sessionRows, playerRows, userRows] = await Promise.all([
    readList(`/training/sessions/team/${encodeURIComponent(teamId)}`).catch(() => []),
    readList(`/players/team/${encodeURIComponent(teamId)}`).catch(() => []),
    organizationId
      ? readList(`/users?organizationId=${encodeURIComponent(organizationId)}&role=PLAYER`).catch(() => [])
      : Promise.resolve([]),
  ]);
  const names = new Map<string, string>();
  for (const user of userRows) {
    const id = text(user.id);
    const name = text(user.fullName) || text(user.username);
    if (id && name) names.set(id, name);
  }
  const roster = playerRows.map((row) => {
    const id = text(row.id);
    const userId = text(row.userId);
    const nested = record(row.user);
    const name =
      text(row.fullName) ||
      text(row.name) ||
      text(row.displayName) ||
      text(nested?.fullName) ||
      names.get(userId) ||
      names.get(id) ||
      jerseyName(row);
    return { id, name: name || 'Player' };
  }).filter((item) => item.id);
  const groups = await Promise.all(
    roster.map((player) => readList(`/attendance/player/${encodeURIComponent(player.id)}`).catch(() => [])),
  );
  const records = groups.flat().map((row) => ({
    playerId: text(row.playerId),
    trainingSessionId: text(row.trainingSessionId),
    status: text(row.status).toUpperCase(),
    checkInTime: text(row.checkInTime),
  })).filter((row) => row.playerId);
  const sessions = sessionRows.map((row) => ({
    id: text(row.id),
    title: text(row.title),
    scheduledStart: text(row.scheduledStart),
    scheduledEnd: text(row.scheduledEnd),
    locationName: text(row.locationName),
    status: text(row.status).toUpperCase(),
    branchName: team?.name || text(row.locationName) || '—',
    groupName: team?.ageGroup || text(row.title) || '—',
  })).filter((item) => item.id).sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  return { sessions, roster, records };
}

export async function generateAttendanceQr(trainingSessionId: string): Promise<string> {
  const body = await apiRequest<Record<string, unknown>>('/attendance/qr/generate', {
    method: 'POST',
    auth: true,
    body: { trainingSessionId, sessionLatitude: 0, sessionLongitude: 0 },
  });
  return text(body.token);
}

export type AttendanceHistoryRow = {
  id: string;
  checkInTime: string;
  status: string;
  attended: boolean;
};

export type PlayerAttendance = {
  percent: number;
  consumedLabel: string;
  contractEnd: string;
  rows: AttendanceHistoryRow[];
};

/** Same calls the website uses for a player's training attendance page. */
export async function loadPlayerAttendance(): Promise<PlayerAttendance> {
  const player = await apiRequest<Record<string, unknown>>('/players/me', { auth: true });
  const playerId = text(player.id);
  const history = playerId
    ? await readList(`/attendance/player/${encodeURIComponent(playerId)}`).catch(() => [])
    : [];
  const trainee = playerId
    ? await apiRequest<Record<string, unknown>>(`/players/${encodeURIComponent(playerId)}/trainee-info`, { auth: true }).catch(() => null)
    : null;
  const rows = history.map((item) => {
    const row = record(item);
    const status = text(row?.status).toUpperCase();
    return {
      id: text(row?.id) || `${text(row?.trainingSessionId)}-${text(row?.checkInTime)}`,
      checkInTime: text(row?.checkInTime),
      status,
      attended: status === 'PRESENT' || status === 'LATE' || status === 'ATTENDED',
    };
  }).filter((row) => row.id).sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));

  const present = rows.filter((row) => row.attended).length;
  let used = present;
  let plan = numberOrNull(player.sessionCount);
  let contractEnd = text(player.contractEndDate);
  if (trainee) {
    contractEnd = text(trainee.contractEndDate) || contractEnd;
    plan = numberOrNull(trainee.planSessions) ?? plan;
    const attended = numberOrNull(trainee.attendedSessions);
    const remaining = numberOrNull(trainee.remainingSessions);
    if (attended != null) used = attended;
    else if (plan != null && remaining != null) used = Math.max(0, plan - remaining);
  }
  return {
    percent: rows.length ? Math.round((present / rows.length) * 100) : 0,
    consumedLabel: plan != null ? `${used} / ${plan}` : String(used),
    contractEnd,
    rows,
  };
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

async function readList(path: string): Promise<Record<string, unknown>[]> {
  const raw = await apiRequest<unknown>(path, { auth: true });
  return asList(raw).map((item) => record(item)).filter((item): item is Record<string, unknown> => item !== null);
}

function asList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const row = record(raw);
  if (!row) return [];
  for (const key of ['data', 'content', 'items', 'records', 'result']) {
    const value = row[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function mapTeams(rows: Record<string, unknown>[]): AttendanceTeam[] {
  return rows.map((row) => ({
    id: text(row.id),
    name: text(row.name) || 'Branch',
    ageGroup: text(row.ageGroup),
  })).filter((item) => item.id);
}

function jerseyName(row: Record<string, unknown>): string {
  const jersey = text(row.jerseyNumber);
  const position = text(row.position);
  return `${jersey ? `#${jersey}` : ''} ${position}`.trim();
}
