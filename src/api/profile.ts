import { apiRequest } from '@/api/client';

export type AccountProfile = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  enabled: boolean;
  accountLocked: boolean;
  createdAt: string | null;
  playerActive: boolean | null;
};

export type PlayerPoints = {
  total: number;
  spendable: number;
  deemed: boolean;
};

type ProfileBody = Partial<AccountProfile> & { id?: string };

/** Same account record the website loads from `GET /users/me`. */
export async function loadMyProfile(): Promise<AccountProfile> {
  const body = await apiRequest<ProfileBody>('/users/me', { auth: true });
  return {
    id: String(body.id ?? ''),
    username: body.username ?? '',
    email: body.email ?? '',
    fullName: body.fullName ?? '',
    role: String(body.role ?? ''),
    organizationId: body.organizationId ?? null,
    organizationName: body.organizationName ?? null,
    enabled: body.enabled !== false,
    accountLocked: !!body.accountLocked,
    createdAt: body.createdAt ?? null,
    playerActive: body.playerActive ?? null,
  };
}

/** Players use the same balance the website reads. Other roles have no points ledger. */
export async function loadPlayerPoints(): Promise<PlayerPoints | null> {
  try {
    const player = await apiRequest<{ id?: string; points?: number }>('/players/me', { auth: true });
    if (!player.id) return null;
    const balance = await apiRequest<{
      totalBalance?: number;
      availableBalance?: number;
      pointsDeemed?: boolean;
    }>(`/points/${player.id}/balance`, { auth: true });
    const deemed = !!balance.pointsDeemed;
    const total = balance.totalBalance ?? player.points ?? 0;
    return {
      total,
      spendable: balance.availableBalance ?? (deemed ? 0 : total),
      deemed,
    };
  } catch {
    return null;
  }
}

export function isPlayerRole(role: string, playerActive: boolean | null): boolean {
  return role === 'PLAYER' || role === 'FREE_PLAYER' || playerActive != null;
}
