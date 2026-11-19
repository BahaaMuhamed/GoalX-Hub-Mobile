import { apiRequest } from '@/api/client';

export type PublicAcademy = {
  id: string;
  name: string;
  city: string;
  country: string;
  status: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export type PublicTeam = {
  id: string;
  name: string;
};

export type PublicSeason = {
  id: string;
  name: string;
  playersPerTeam: number;
  teams: PublicTeam[];
};

export type RegistrationWindow = {
  open: boolean;
  seasons: PublicSeason[];
};

export type RegistrationPayload = {
  playerType: 'ACADEMY_PLAYER' | 'FREE_PLAYER';
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  country: string;
  city: string;
  preferredPosition: string;
  academyId: string | null;
  organizationScope: 'ACADEMY' | 'MAIN_PLATFORM';
  accountStatus: 'PENDING_ACADEMY_APPROVAL' | 'PENDING_PLATFORM_APPROVAL';
};

export type FreeSquadPlayer = {
  fullName: string;
  position: string;
  dateOfBirth: string;
  phone: string;
  captain: boolean;
  email?: string;
};

export async function listPublicAcademies(): Promise<PublicAcademy[]> {
  const first = await readAcademies('/public/academies');
  if (first.length) {
    return first.filter((item) => item.status === 'ACTIVE');
  }
  const second = await readAcademies('/organizations?status=ACTIVE&active=true');
  return second.filter((item) => item.status === 'ACTIVE');
}

export async function registrationWindow(): Promise<RegistrationWindow> {
  try {
    const raw = await apiRequest<unknown>('/public/seasons/registration');
    const record = unwrap(raw);
    const seasons = (Array.isArray(record.seasons) ? record.seasons : [])
      .filter(isRecord)
      .map(mapSeason)
      .filter((item): item is PublicSeason => item !== null);
    return { open: record.open === true, seasons };
  } catch {
    return { open: false, seasons: [] };
  }
}

export async function submitRegistration(body: RegistrationPayload): Promise<{ id: string; academyName: string | null }> {
  const raw = await apiRequest<unknown>('/public/registrations', { method: 'POST', body });
  const record = unwrap(raw);
  return {
    id: text(record.id),
    academyName: text(record.academyName) || null,
  };
}

export function submitFreeSquad(seasonId: string, body: { teamId: string; players: FreeSquadPlayer[] }): Promise<unknown> {
  return apiRequest(`/public/seasons/${encodeURIComponent(seasonId)}/free-squads`, { method: 'POST', body });
}

async function readAcademies(path: string): Promise<PublicAcademy[]> {
  try {
    const raw = await apiRequest<unknown>(path);
    return asRows(raw).map(mapAcademy).filter((item): item is PublicAcademy => item !== null);
  } catch {
    return [];
  }
}

function mapAcademy(row: Record<string, unknown>): PublicAcademy | null {
  const id = text(row.id ?? row.organizationId ?? row.academyId);
  const name = text(row.name ?? row.academyName ?? row.organizationName);
  if (!id || !name) {
    return null;
  }
  const status = text(row.status).toUpperCase();
  return {
    id,
    name,
    city: text(row.city) || text(row.address),
    country: text(row.country),
    status: status === 'ACTIVE' || status === 'PENDING' || status === 'INACTIVE' || status === 'SUSPENDED'
      ? status
      : row.active === false
        ? 'INACTIVE'
        : 'ACTIVE',
    logoUrl: text(row.logoUrl) || null,
    primaryColor: text(row.primaryColor) || null,
    secondaryColor: text(row.secondaryColor) || null,
  };
}

function mapSeason(row: Record<string, unknown>): PublicSeason | null {
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) {
    return null;
  }
  const teams = (Array.isArray(row.teams) ? row.teams : [])
    .filter(isRecord)
    .map((team) => ({ id: text(team.id), name: text(team.name) }))
    .filter((team) => team.id && team.name);
  const players = Number(row.playersPerTeam ?? row.players_per_team ?? 5);
  return {
    id,
    name,
    playersPerTeam: Number.isFinite(players) && players > 0 ? players : 5,
    teams,
  };
}

function asRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord);
  }
  const record = unwrap(raw);
  for (const key of ['data', 'content', 'items', 'academies', 'organizations', 'result']) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return [];
}

function unwrap(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) {
    return {};
  }
  return isRecord(raw.data) ? raw.data : raw;
}

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
