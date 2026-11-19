import { apiRequest } from '@/api/client';

export type ActivityType = {
  id: string;
  code: string;
  name: string;
  defaultPoints: number;
};

export type Methodology = {
  id: string;
  name: string;
  trainingType: string;
  durationMinutes: number;
  ageGroup: string;
  status: string;
  difficulty: string;
  description: string;
  activities: { activityTypeId: string; code: string; name: string; points: number }[];
};

export type SessionPlayer = {
  playerId: string;
  playerName: string;
  attendanceStatus: string;
  bonusPoints: number;
  total: number;
  checkedInAt: string;
  cells: { code: string; points: number; sessionActivityId: string }[];
};

export type SessionDetail = {
  id: string;
  groupName: string;
  trainingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  coachName: string;
  methodologyName: string;
  status: string;
  playerCount: number;
  presentCount: number;
  absentCount: number;
  averagePoints: number;
  canEdit: boolean;
  players: SessionPlayer[];
  activities: { id: string; code: string; name: string; points: number }[];
};

export type SessionQr = {
  payload: string;
  status: string;
  active: boolean;
  branchName: string;
  groupName: string;
  trainingDate: string;
  startTime: string;
  endTime: string;
  trainingLevel: string;
};

export type BoardEntry = {
  rank: number;
  playerId: string;
  name: string;
  score: number;
};

const MANAGERS = new Set(['ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE']);

export function canManageAcademy(role: string): boolean {
  return MANAGERS.has(role);
}

export function canOpenSession(role: string): boolean {
  return role !== 'COACH';
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function clock(value: string): string {
  return value.slice(0, 5);
}

export async function listMethodologies(organizationId: string): Promise<Methodology[]> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  const body = await apiRequest<unknown>(`/training-methodologies${query}`, { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    const activities = Array.isArray(row?.activities) ? row.activities : [];
    return {
      id: text(row?.id),
      name: text(row?.name),
      trainingType: text(row?.trainingType),
      durationMinutes: typeof row?.durationMinutes === 'number' ? row.durationMinutes : 0,
      ageGroup: text(row?.ageGroup),
      status: text(row?.status) || 'ACTIVE',
      difficulty: text(row?.difficulty),
      description: text(row?.description),
      activities: activities.map((activity) => {
        const line = record(activity);
        return {
          activityTypeId: text(line?.activityTypeId),
          code: text(line?.code),
          name: text(line?.name),
          points: typeof line?.points === 'number' ? line.points : 0,
        };
      }),
    };
  }).filter((item) => item.id);
}

export async function listActivityTypes(): Promise<ActivityType[]> {
  const body = await apiRequest<unknown>('/training-activity-types', { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    return {
      id: text(row?.id),
      code: text(row?.code),
      name: text(row?.name),
      defaultPoints: typeof row?.defaultPoints === 'number' ? row.defaultPoints : 0,
    };
  }).filter((item) => item.id);
}

export async function saveMethodology(input: {
  id?: string;
  organizationId: string;
  name: string;
  description: string;
  trainingType: string;
  durationMinutes: number;
  status: string;
  ageGroup: string;
  difficulty: string;
  activities: { activityTypeId: string; points: number; sortOrder: number; active: boolean }[];
}): Promise<void> {
  const body = {
    organizationId: input.organizationId || null,
    name: input.name.trim(),
    description: input.description,
    trainingType: input.trainingType,
    durationMinutes: input.durationMinutes,
    status: input.status,
    ageGroup: input.ageGroup,
    difficulty: input.difficulty,
    activities: input.activities,
  };
  await apiRequest(input.id ? `/training-methodologies/${input.id}` : '/training-methodologies', {
    method: input.id ? 'PUT' : 'POST',
    auth: true,
    body,
  });
}

export async function deleteMethodology(id: string): Promise<void> {
  await apiRequest(`/training-methodologies/${id}`, { method: 'DELETE', auth: true });
}

export async function createTraining(input: {
  branchId: string;
  groupId: string;
  methodologyId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}): Promise<void> {
  const date = new Date(`${input.date}T00:00:00`);
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  await apiRequest('/training-schedules', {
    method: 'POST',
    auth: true,
    body: {
      groupId: input.branchId,
      academyGroupId: input.groupId,
      methodologyId: input.methodologyId,
      dayOfWeek: days[date.getDay()],
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      active: true,
      effectiveStart: input.date,
      effectiveEnd: input.date,
    },
  });
  await apiRequest('/training-schedules/generate', { method: 'POST', auth: true, body: {} });
}

export async function loadSession(id: string): Promise<SessionDetail> {
  const body = await apiRequest<Record<string, unknown>>(`/training-sessions/${id}`, { auth: true });
  const players = Array.isArray(body.players) ? body.players : [];
  const activities = Array.isArray(body.activities) ? body.activities : [];
  return {
    id: text(body.id),
    groupName: text(body.groupName),
    trainingDate: text(body.trainingDate),
    startTime: clock(text(body.startTime)),
    endTime: clock(text(body.endTime)),
    location: text(body.location),
    coachName: text(body.coachName),
    methodologyName: text(body.methodologyName),
    status: text(body.status),
    playerCount: typeof body.playerCount === 'number' ? body.playerCount : 0,
    presentCount: typeof body.presentCount === 'number' ? body.presentCount : 0,
    absentCount: typeof body.absentCount === 'number' ? body.absentCount : 0,
    averagePoints: typeof body.averagePoints === 'number' ? body.averagePoints : 0,
    canEdit: body.canEdit === true,
    activities: activities.map((item) => {
      const row = record(item);
      return {
        id: text(row?.id),
        code: text(row?.code),
        name: text(row?.name),
        points: typeof row?.points === 'number' ? row.points : 0,
      };
    }),
    players: players.map((item) => {
      const row = record(item);
      const cells = Array.isArray(row?.cells) ? row.cells : [];
      return {
        playerId: text(row?.playerId),
        playerName: text(row?.playerName),
        attendanceStatus: text(row?.attendanceStatus) || 'ABSENT',
        bonusPoints: typeof row?.bonusPoints === 'number' ? row.bonusPoints : 0,
        total: typeof row?.total === 'number' ? row.total : 0,
        checkedInAt: text(row?.checkedInAt),
        cells: cells.map((cell) => {
          const line = record(cell);
          return {
            code: text(line?.code),
            points: typeof line?.points === 'number' ? line.points : 0,
            sessionActivityId: text(line?.sessionActivityId),
          };
        }),
      };
    }),
  };
}

export async function loadQr(id: string): Promise<SessionQr | null> {
  const body = await apiRequest<Record<string, unknown>>(`/training-sessions/${id}/qr`, { auth: true });
  if (!text(body.payload)) return null;
  return {
    payload: text(body.payload),
    status: text(body.status),
    active: body.active === true,
    branchName: text(body.branchName),
    groupName: text(body.groupName),
    trainingDate: text(body.trainingDate),
    startTime: clock(text(body.startTime)),
    endTime: clock(text(body.endTime)),
    trainingLevel: text(body.trainingLevel),
  };
}

export async function generateQr(id: string): Promise<SessionQr> {
  const body = await apiRequest<Record<string, unknown>>(`/training-sessions/${id}/qr`, { method: 'POST', auth: true, body: {} });
  return {
    payload: text(body.payload),
    status: text(body.status),
    active: body.active === true,
    branchName: text(body.branchName),
    groupName: text(body.groupName),
    trainingDate: text(body.trainingDate),
    startTime: clock(text(body.startTime)),
    endTime: clock(text(body.endTime)),
    trainingLevel: text(body.trainingLevel),
  };
}

export async function deactivateQr(id: string): Promise<void> {
  await apiRequest(`/training-sessions/${id}/qr/deactivate`, { method: 'POST', auth: true, body: {} });
}

export async function cancelSession(id: string): Promise<void> {
  await apiRequest(`/training-sessions/${id}/cancel`, { method: 'POST', auth: true, body: {} });
}

export async function loadLeaderboard(): Promise<BoardEntry[]> {
  const body = await apiRequest<unknown>('/leaderboard/global?limit=50', { auth: true });
  return (Array.isArray(body) ? body : []).map((item) => {
    const row = record(item);
    return {
      rank: typeof row?.rank === 'number' ? row.rank : 0,
      playerId: text(row?.playerId),
      name: text(row?.playerName) || text(row?.name) || 'Player',
      score: typeof row?.score === 'number' ? row.score : typeof row?.points === 'number' ? row.points : 0,
    };
  });
}

export function qrImageUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;
}
