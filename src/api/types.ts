export type RoleName =
  | 'PLAYER'
  | 'COACH'
  | 'ADMINISTRATIVE'
  | 'ACCOUNTANT'
  | 'ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'SUPER_ADMIN'
  | 'PLATFORM_EMPLOYEE'
  | 'FREE_PLAYER'
  | 'PUBLIC_USER';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username?: string | null;
  email: string;
  role: RoleName | string;
  organizationId: string | null;
  organizationName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  organizationStatus?: string | null;
  dashboard?: string | null;
};

export type Profile = {
  userId: string;
  username: string | null;
  email: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  organizationStatus: string | null;
  dashboard: string | null;
};

export type LoginBody = {
  username?: string;
  email?: string;
  password: string;
};

export type RegisterBody = {
  email: string;
  password: string;
  fullName: string;
  role: 'PLAYER' | 'FREE_PLAYER' | 'COACH' | 'PUBLIC_USER';
  organizationId: string;
};

export type ApiErrorBody = {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
};

export function toProfile(raw: AuthResponse): Profile {
  return {
    userId: String(raw.userId ?? ''),
    username: raw.username ?? null,
    email: raw.email ?? '',
    role: String(raw.role ?? ''),
    organizationId: raw.organizationId ?? null,
    organizationName: raw.organizationName ?? null,
    logoUrl: raw.logoUrl ?? null,
    primaryColor: raw.primaryColor ?? null,
    secondaryColor: raw.secondaryColor ?? null,
    organizationStatus: raw.organizationStatus ?? null,
    dashboard: raw.dashboard ?? null,
  };
}

export function formatRole(role: string): string {
  return role
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
