import { apiRequest } from '@/api/client';
import { apiBaseUrl } from '@/config';
import { ApiError } from '@/api/errors';
import { getAccessToken } from '@/auth/storage';

export type StaffUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string | null;
  enabled: boolean;
  groupIds: string[];
  phone: string | null;
  position: string | null;
  jerseyNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  sessionCount: number | null;
};

export type GroupRecord = {
  id: string;
  name: string;
  branchId: string | null;
  branchName: string | null;
};

export type PlayerRecord = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  jerseyNumber: string;
  dateOfBirth: string;
  contractStartDate: string;
  contractEndDate: string;
  sessionCount: number | null;
  groupId: string;
  groupName: string;
  teamId: string;
  branchName: string;
  playerCode: string;
  active: boolean;
  points: number;
  photoUrl: string | null;
};

export type TraineeInfo = {
  playerCode: string;
  fullName: string;
  phone: string;
  branchName: string;
  groupName: string;
  planName: string;
  contractStartDate: string;
  contractEndDate: string;
  remainingSessions: string;
  attendedSessions: string;
  paymentStatus: string;
  amountPaid: string;
  amountDue: string;
  notes: string;
  active: boolean;
};

export type TrainingSession = {
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
};

export type SheetFile = { uri: string; name: string; mimeType: string };
export type ImportResult = { created: number; failed: number; errors: string[] };

const ROLES = ['ORGANIZATION_ADMIN', 'ADMINISTRATIVE', 'ACCOUNTANT', 'COACH'] as const;

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function mapUser(value: unknown): StaffUser | null {
  const row = asRecord(value);
  const id = text(row?.id);
  if (!id) return null;
  const groups = Array.isArray(row?.groupIds) ? row.groupIds.map(text).filter(Boolean) : [];
  return {
    id,
    username: text(row?.username),
    email: text(row?.email),
    fullName: text(row?.fullName) || text(row?.username) || 'User',
    role: text(row?.role) || 'PLAYER',
    organizationId: text(row?.organizationId) || null,
    enabled: row?.enabled !== false,
    groupIds: groups,
    phone: text(row?.phone) || null,
    position: text(row?.position) || null,
    jerseyNumber: text(row?.jerseyNumber) || null,
    dateOfBirth: text(row?.dateOfBirth) || null,
    gender: text(row?.gender) || null,
    contractStartDate: text(row?.contractStartDate) || null,
    contractEndDate: text(row?.contractEndDate) || null,
    sessionCount: typeof row?.sessionCount === 'number' ? row.sessionCount : null,
  };
}

function mapGroup(value: unknown): GroupRecord | null {
  const row = asRecord(value);
  const id = text(row?.id);
  if (!id) return null;
  const branch = asRecord(row?.branch);
  return {
    id,
    name: text(row?.name) || text(row?.code) || 'Group',
    branchId: text(row?.branchId) || text(branch?.id) || null,
    branchName: text(row?.branchName) || text(branch?.name) || null,
  };
}

function mapPlayer(value: unknown): PlayerRecord | null {
  const row = asRecord(value);
  const id = text(row?.id);
  if (!id) return null;
  const user = asRecord(row?.user);
  const group = asRecord(row?.group);
  const team = asRecord(row?.team);
  return {
    id,
    userId: text(row?.userId) || text(user?.id),
    fullName: text(row?.fullName) || text(row?.displayName) || text(row?.name) || text(user?.fullName),
    email: text(row?.email) || text(user?.email),
    phone: text(row?.phone) || text(user?.phone),
    position: text(row?.position),
    jerseyNumber: text(row?.jerseyNumber),
    dateOfBirth: text(row?.dateOfBirth),
    contractStartDate: text(row?.contractStartDate),
    contractEndDate: text(row?.contractEndDate),
    sessionCount: typeof row?.sessionCount === 'number' ? row.sessionCount : null,
    groupId: text(row?.groupId) || text(group?.id),
    groupName: text(row?.groupName) || text(group?.name),
    teamId: text(row?.teamId) || text(team?.id),
    branchName: text(row?.branchName) || text(row?.teamName) || text(team?.name),
    playerCode: text(row?.playerCode),
    active: row?.active !== false,
    points: typeof row?.points === 'number' ? row.points : 0,
    photoUrl: text(row?.photoUrl) || null,
  };
}

function mapSession(value: unknown): TrainingSession | null {
  const row = asRecord(value);
  const id = text(row?.id);
  if (!id) return null;
  return {
    id,
    groupName: text(row?.groupName),
    trainingDate: text(row?.trainingDate),
    startTime: text(row?.startTime).slice(0, 5),
    endTime: text(row?.endTime).slice(0, 5),
    location: text(row?.location),
    coachName: text(row?.coachName),
    methodologyName: text(row?.methodologyName),
    status: text(row?.status) || 'SCHEDULED',
    playerCount: typeof row?.playerCount === 'number' ? row.playerCount : 0,
    presentCount: typeof row?.presentCount === 'number' ? row.presentCount : 0,
    absentCount: typeof row?.absentCount === 'number' ? row.absentCount : 0,
  };
}

async function rows(path: string): Promise<unknown[]> {
  const body = await apiRequest<unknown>(path, { auth: true });
  return Array.isArray(body) ? body : [];
}

export async function listUsers(organizationId: string): Promise<StaffUser[]> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  return (await rows(`/users${query}`)).map(mapUser).filter((item): item is StaffUser => !!item);
}

export async function createUser(input: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  organizationId: string;
  phone: string;
  groupIds: string[];
}): Promise<void> {
  await apiRequest('/users', {
    method: 'POST',
    auth: true,
    body: {
      username: input.username.trim(),
      email: input.email.trim(),
      password: input.password,
      fullName: input.fullName.trim(),
      role: input.role,
      organizationId: input.organizationId || null,
      phone: input.phone.trim() || null,
      groupIds: input.groupIds,
    },
  });
}

export async function updateUser(
  user: StaffUser,
  patch: { fullName: string; email: string; phone: string; groupIds: string[] },
): Promise<void> {
  await apiRequest(`/users/${user.id}`, {
    method: 'PUT',
    auth: true,
    body: {
      username: user.username,
      email: patch.email.trim(),
      fullName: patch.fullName.trim(),
      phone: patch.phone.trim() || null,
      position: user.position,
      jerseyNumber: user.jerseyNumber,
      groupIds: patch.groupIds,
      contractStartDate: user.contractStartDate,
      contractEndDate: user.contractEndDate,
      sessionCount: user.sessionCount,
    },
  });
}

export async function changeUserPassword(userId: string, password: string): Promise<void> {
  await apiRequest(`/users/${userId}/password`, { method: 'PUT', auth: true, body: { password } });
}

export async function removeUser(userId: string): Promise<void> {
  await apiRequest(`/users/${userId}`, { method: 'DELETE', auth: true });
}

export async function loadUserProfile(userId: string): Promise<UserCard> {
  const body = await apiRequest<Record<string, unknown>>(`/users/${userId}/profile`, { auth: true });
  const groups = Array.isArray(body.groups)
    ? body.groups.map((item) => text(asRecord(item)?.name)).filter(Boolean)
    : [];
  return {
    fullName: text(body.fullName),
    username: text(body.username),
    email: text(body.email),
    role: text(body.role),
    phone: text(body.phone),
    organizationName: text(body.organizationName),
    branchName: text(body.branchName),
    enabled: body.enabled !== false,
    groups: groups.join(', '),
  };
}

export type UserCard = {
  fullName: string;
  username: string;
  email: string;
  role: string;
  phone: string;
  organizationName: string;
  branchName: string;
  enabled: boolean;
  groups: string;
};

export async function listGroups(organizationId: string): Promise<GroupRecord[]> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  return (await rows(`/groups${query}`)).map(mapGroup).filter((item): item is GroupRecord => !!item);
}

export async function listPlayers(organizationId: string, teamId: string): Promise<PlayerRecord[]> {
  const path = teamId
    ? `/players?teamId=${encodeURIComponent(teamId)}`
    : organizationId
      ? `/players?organizationId=${encodeURIComponent(organizationId)}`
      : '/players';
  const orgQuery = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  const [playerRows, userRows, groupRows, teamRows] = await Promise.all([
    rows(path),
    organizationId ? rows(`/users${orgQuery}&role=PLAYER`.replace('?&', '?')) : Promise.resolve([]),
    organizationId ? rows(`/groups${orgQuery}`) : Promise.resolve([]),
    organizationId ? rows(`/teams${orgQuery}`).catch(() => []) : Promise.resolve([]),
  ]);
  const accounts = userRows.map(mapUser).filter((item): item is StaffUser => !!item);
  const squads = groupRows.map(mapGroup).filter((item): item is GroupRecord => !!item);
  const teams = teamRows.map(mapGroup).filter((item): item is GroupRecord => !!item);
  const players = playerRows.map(mapPlayer).filter((item): item is PlayerRecord => !!item).map((player) => {
    const account = accounts.find((item) => item.id === player.userId || item.id === player.id);
    const squad = squads.find((item) => item.id === player.groupId);
    const branch = teams.find((item) => item.id === player.teamId || item.id === squad?.branchId);
    return {
      ...player,
      fullName: player.fullName || account?.fullName || '',
      email: player.email || account?.email || '',
      phone: player.phone || account?.phone || '',
      groupName: player.groupName || squad?.name || '',
      branchName: player.branchName || branch?.name || squad?.branchName || '',
    };
  });
  return Promise.all(
    players.map(async (player) => {
      try {
        const balance = await apiRequest<{ availableBalance?: number }>(`/points/${player.id}/balance`, { auth: true });
        return { ...player, points: balance?.availableBalance ?? player.points };
      } catch {
        return player;
      }
    }),
  );
}

export async function createPlayer(input: {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  organizationId: string;
  groupId: string;
  teamId: string;
}): Promise<void> {
  await apiRequest('/players/org', {
    method: 'POST',
    auth: true,
    body: {
      username: input.username.trim() || null,
      email: input.email.trim(),
      password: input.password,
      fullName: input.fullName.trim(),
      phone: input.phone.trim() || null,
      dateOfBirth: input.dateOfBirth || null,
      organizationId: input.organizationId || null,
      academyId: input.organizationId || null,
      groupId: input.groupId || null,
      teamId: input.teamId || null,
    },
  });
}

export async function updatePlayer(
  player: PlayerRecord,
  patch: { phone: string; dateOfBirth: string; contractStartDate: string; groupId: string; teamId: string; active: boolean },
): Promise<void> {
  await apiRequest(`/players/${player.id}`, {
    method: 'PUT',
    auth: true,
    body: {
      phone: patch.phone.trim() || null,
      dateOfBirth: patch.dateOfBirth || null,
      contractStartDate: patch.contractStartDate || null,
      contractEndDate: player.contractEndDate || null,
      sessionCount: player.sessionCount,
      position: player.position || null,
      jerseyNumber: player.jerseyNumber || null,
      teamId: patch.teamId || player.teamId || null,
      academyId: null,
      active: patch.active,
    },
  });
  if (patch.groupId && patch.groupId !== player.groupId) {
    await apiRequest(`/groups/${patch.groupId}/players`, {
      method: 'POST',
      auth: true,
      body: { playerId: player.id, teamId: patch.teamId || null, position: player.position || null },
    });
  }
}

export async function loadTrainee(playerId: string): Promise<TraineeInfo> {
  const body = await apiRequest<Record<string, unknown>>(`/players/${playerId}/trainee-info`, { auth: true });
  return {
    playerCode: text(body.playerCode),
    fullName: text(body.fullName),
    phone: text(body.phone),
    branchName: text(body.branchName),
    groupName: text(body.groupName),
    planName: text(body.planName),
    contractStartDate: text(body.contractStartDate),
    contractEndDate: text(body.contractEndDate),
    remainingSessions: text(body.remainingSessions),
    attendedSessions: text(body.attendedSessions),
    paymentStatus: text(body.paymentStatus),
    amountPaid: text(body.amountPaid),
    amountDue: text(body.amountDue),
    notes: text(body.notes) || text(body.subscriptionNote),
    active: body.active !== false,
  };
}

export async function listTraining(scope?: 'history', groupId?: string): Promise<TrainingSession[]> {
  const params = [scope ? `scope=${scope}` : '', groupId ? `groupId=${encodeURIComponent(groupId)}` : ''].filter(Boolean);
  const query = params.length ? `?${params.join('&')}` : '';
  return (await rows(`/training-sessions${query}`)).map(mapSession).filter((item): item is TrainingSession => !!item);
}

export async function importSheet(kind: 'users' | 'players', file: SheetFile, organizationId: string): Promise<ImportResult> {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as unknown as Blob);
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  const response = await fetch(`${apiBaseUrl()}/${kind}/import${query}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const payload = (await response.json().catch(() => null)) as
    | { created?: number; failed?: number; errors?: { message?: string }[]; message?: string }
    | null;
  if (!response.ok) {
    throw new ApiError(response.status, 'IMPORT_FAILED', payload?.message || 'Import failed');
  }
  return {
    created: payload?.created ?? 0,
    failed: payload?.failed ?? 0,
    errors: (payload?.errors ?? []).map((item) => item.message || '').filter(Boolean),
  };
}

export async function downloadTemplate(kind: 'users' | 'players'): Promise<ArrayBuffer> {
  const token = await getAccessToken();
  const response = await fetch(`${apiBaseUrl()}/imports/template?kind=${kind}`, {
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'TEMPLATE_FAILED', 'Template download failed');
  }
  return response.arrayBuffer();
}

export const STAFF_ROLES = ROLES;
