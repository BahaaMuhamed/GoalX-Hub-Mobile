import { apiRequest } from '@/api/client';
import { mediaUrl } from '@/api/platform';

export type BranchOption = {
  id: string;
  name: string;
};

export type DashPlayer = {
  id: string;
  name: string;
  position: string;
  points: number;
  photoUrl: string | null;
};

export type DashSession = {
  id: string;
  groupName: string;
  day: string;
  range: string;
  coach: string;
  methodology: string;
  location: string;
  status: string;
  sortKey: string;
  endAt: number;
};

export type DashSnapshot = {
  players: DashPlayer[];
  today: DashSession[];
  upcoming: DashSession[];
  catalogCount: number;
};

export async function listBranches(academyId: string, organizationId: string): Promise<BranchOption[]> {
  if (academyId) {
    const byAcademy = await readRows(`/organizations/academies/${academyId}/branches`).catch(() =>
      readRows(`/organizations/academies/${academyId}/teams`),
    );
    if (byAcademy.length) return byAcademy.map(mapBranch).filter(hasId);
  }
  if (!organizationId) return [];
  const byOrg = await readRows(`/teams?organizationId=${encodeURIComponent(organizationId)}`).catch(() => []);
  return byOrg.map(mapBranch).filter(hasId);
}

export async function loadDashboard(branchId: string, organizationId: string): Promise<DashSnapshot> {
  const branchQuery = branchId ? `&groupId=${encodeURIComponent(branchId)}` : '';
  const [players, today, upcoming, catalog] = await Promise.all([
    branchId
      ? readRows(`/players/team/${encodeURIComponent(branchId)}`)
      : organizationId
        ? readRows(`/players?organizationId=${encodeURIComponent(organizationId)}`)
        : Promise.resolve([]),
    readRows(`/training-sessions?scope=today${branchQuery}`).catch(() => []),
    readRows(`/training-sessions?scope=upcoming${branchQuery}`).catch(() => []),
    readRows('/rewards/catalog').catch(() => []),
  ]);
  const roster = await namedPlayers(players, organizationId);
  return {
    players: [...roster].sort((a, b) => b.points - a.points),
    today: today.map(mapSession),
    upcoming: upcoming
      .map(mapSession)
      .filter(isIncoming)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(0, 4),
    catalogCount: catalog.length,
  };
}

function mapBranch(row: Record<string, unknown>): BranchOption {
  const name = text(row.name) || 'Branch';
  const age = text(row.ageGroup);
  return { id: text(row.id), name: age && age !== name ? `${name} · ${age}` : name };
}

async function namedPlayers(rows: Record<string, unknown>[], organizationId: string): Promise<DashPlayer[]> {
  const users = organizationId
    ? await readRows(`/users?organizationId=${encodeURIComponent(organizationId)}&role=PLAYER`)
    : [];
  const roster = rows.map((row) => mapPlayer(row, users)).filter((item) => item.id);
  return Promise.all(
    roster.map(async (player) => {
      const balance = await readRecord(`/points/${encodeURIComponent(player.id)}/balance`);
      const points = Number(balance.totalBalance ?? balance.availableBalance ?? player.points) || 0;
      return { ...player, points };
    }),
  );
}

function mapPlayer(row: Record<string, unknown>, users: Record<string, unknown>[]): DashPlayer {
  const nested = isRecord(row.user) ? row.user : {};
  const userId = text(row.userId);
  const user = users.find((item) => text(item.id) === userId || text(item.id) === text(row.id)) ?? {};
  const name =
    text(row.fullName) ||
    text(row.name) ||
    text(row.displayName) ||
    text(nested.fullName) ||
    text(user.fullName) ||
    text(user.username) ||
    text(row.playerCode) ||
    'Player';
  const jersey = text(row.jerseyNumber);
  return {
    id: text(row.id),
    name,
    position: [text(row.position), jersey ? `#${jersey}` : ''].filter(Boolean).join(' · '),
    points: Number(row.points ?? 0) || 0,
    photoUrl: mediaUrl(text(row.photoUrl) || text(row.avatarUrl) || text(nested.photoUrl) || text(user.photoUrl)),
  };
}

function mapSession(row: Record<string, unknown>): DashSession {
  const start = clock(text(row.startTime));
  const end = clock(text(row.endTime));
  const group = text(row.groupName) || 'Training';
  const date = text(row.trainingDate);
  const endClock = (text(row.endTime) || '23:59').slice(0, 5);
  const endAt = date ? new Date(`${date}T${endClock}:00`).getTime() : 0;
  return {
    id: text(row.id) || `${group}-${date}-${start}`,
    groupName: group,
    day: date ? sessionDay(date) : '',
    range: ltr(`${start} – ${end}`),
    coach: text(row.coachName) || 'Coach not set',
    methodology: text(row.methodologyName),
    location: text(row.location),
    status: text(row.status) || 'SCHEDULED',
    sortKey: `${date}T${start}`,
    endAt: Number.isNaN(endAt) ? 0 : endAt,
  };
}

function isIncoming(row: DashSession): boolean {
  const status = row.status.toUpperCase();
  if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'PENDING_APPROVAL') return false;
  if (!row.day) return false;
  if (!row.endAt) return status === 'SCHEDULED' || status === 'OPEN' || status === 'IN_PROGRESS';
  return row.endAt > Date.now();
}

function sessionDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function clock(value: string): string {
  return value ? value.slice(0, 5) : '--:--';
}

function ltr(value: string): string {
  return `\u2066${value}\u2069`;
}

async function readRows(path: string): Promise<Record<string, unknown>[]> {
  try {
    const raw = await apiRequest<unknown>(path, { auth: true });
    return asRows(raw);
  } catch {
    return [];
  }
}

async function readRecord(path: string): Promise<Record<string, unknown>> {
  try {
    const raw = await apiRequest<unknown>(path, { auth: true });
    return isRecord(raw) ? raw : {};
  } catch {
    return {};
  }
}

function asRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) return [];
  for (const key of ['data', 'content', 'items', 'players', 'sessions', 'result']) {
    const value = raw[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function hasId(item: BranchOption): boolean {
  return Boolean(item.id);
}

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
