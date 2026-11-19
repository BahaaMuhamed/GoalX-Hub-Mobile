import type { RoleName } from '@/api/types';

export type ScreenGroup = 'main' | 'manage' | 'finance' | 'advertising';

export type AppScreen = {
  path: string;
  label: string;
  group: ScreenGroup;
};

type Role = RoleName | string;
type Permission =
  | 'academy.manage'
  | 'groups.view'
  | 'groups.manage'
  | 'players.view'
  | 'players.create'
  | 'coaches.manage'
  | 'training.view'
  | 'attendance.view'
  | 'training.approve'
  | 'leaderboard.view'
  | 'marketplace.view'
  | 'finance.view'
  | 'finance.manage'
  | 'payment.view'
  | 'expense.view'
  | 'report.finance.view'
  | 'advertising.view';

const ACADEMY_ADMIN: Permission[] = [
  'academy.manage',
  'groups.view',
  'groups.manage',
  'players.view',
  'players.create',
  'coaches.manage',
  'training.view',
  'attendance.view',
  'training.approve',
  'leaderboard.view',
  'marketplace.view',
  'finance.view',
  'finance.manage',
  'payment.view',
  'expense.view',
  'report.finance.view',
  'advertising.view',
];

const BY_ROLE: Partial<Record<string, Permission[]>> = {
  ADMIN: ACADEMY_ADMIN,
  ORGANIZATION_ADMIN: ACADEMY_ADMIN,
  SUPER_ADMIN: ACADEMY_ADMIN,
  ADMINISTRATIVE: ['groups.view', 'groups.manage', 'players.view', 'players.create', 'training.view', 'attendance.view'],
  COACH: ['groups.view', 'training.view', 'attendance.view', 'leaderboard.view', 'training.approve', 'marketplace.view'],
  ACCOUNTANT: ['finance.view', 'finance.manage', 'payment.view', 'expense.view', 'report.finance.view', 'advertising.view'],
  PLAYER: ['attendance.view', 'leaderboard.view', 'marketplace.view'],
  FREE_PLAYER: ['leaderboard.view', 'marketplace.view'],
};

export const ALL_ACADEMIES = 'all';

export function isPlatformRole(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'PLATFORM_EMPLOYEE';
}

function allows(role: Role, permission: Permission): boolean {
  return (BY_ROLE[role] ?? []).includes(permission);
}

const staffRoles = new Set(['ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE']);

/** Same menu the web shell shows, filtered by the same role privileges. */
const CATALOG: { screen: AppScreen; show: (role: Role) => boolean }[] = [
  { screen: { path: 'dashboard', label: 'Dashboard', group: 'main' }, show: (role) => role !== 'ACCOUNTANT' },
  { screen: { path: 'profile', label: 'Profile', group: 'main' }, show: () => true },
  { screen: { path: 'organizations', label: 'Academies', group: 'main' }, show: isPlatformRole },
  { screen: { path: 'users', label: 'Users', group: 'main' }, show: (role) => allows(role, 'coaches.manage') },
  { screen: { path: 'my-teams', label: 'My Branches', group: 'main' }, show: (role) => role === 'COACH' },
  { screen: { path: 'players', label: 'Players', group: 'main' }, show: (role) => allows(role, 'players.view') },
  {
    screen: { path: 'payment-methods', label: 'Payment methods', group: 'manage' },
    show: (role) => allows(role, 'players.create') || allows(role, 'academy.manage') || allows(role, 'finance.manage'),
  },
  { screen: { path: 'training', label: 'Training', group: 'main' }, show: (role) => allows(role, 'training.view') },
  { screen: { path: 'training/methodologies', label: 'Methodologies', group: 'main' }, show: (role) => staffRoles.has(role) },
  { screen: { path: 'training/activity-types', label: 'Activity points', group: 'manage' }, show: (role) => role === 'SUPER_ADMIN' },
  { screen: { path: 'my-training', label: 'My training', group: 'main' }, show: (role) => role === 'PLAYER' },
  {
    screen: { path: 'scan-attendance', label: 'Scan attendance', group: 'main' },
    show: (role) => role === 'PLAYER' || role === 'COACH' || role === 'ADMINISTRATIVE',
  },
  { screen: { path: 'ai-global', label: 'AI Global Agent', group: 'main' }, show: (role) => role === 'PLAYER' },
  { screen: { path: 'leaderboard', label: 'Leaderboard', group: 'main' }, show: (role) => allows(role, 'leaderboard.view') },
  { screen: { path: 'groups', label: 'Branches & Groups', group: 'manage' }, show: (role) => allows(role, 'groups.view') && allows(role, 'groups.manage') },
  { screen: { path: 'groups', label: 'My Groups', group: 'manage' }, show: (role) => role === 'COACH' && allows(role, 'groups.view') },
  { screen: { path: 'attendance', label: 'Attendance', group: 'manage' }, show: (role) => allows(role, 'attendance.view') },
  {
    screen: { path: 'staff-attendance', label: 'Employee attendance', group: 'manage' },
    show: (role) => role === 'COACH' || role === 'ADMINISTRATIVE' || role === 'ADMIN' || role === 'ORGANIZATION_ADMIN' || role === 'SUPER_ADMIN',
  },
  {
    screen: { path: 'marketplace', label: 'Marketplace', group: 'manage' },
    show: (role) => allows(role, 'marketplace.view') || allows(role, 'academy.manage'),
  },
  { screen: { path: 'settings/marketplace', label: 'Marketplace setup', group: 'manage' }, show: isPlatformRole },
  { screen: { path: 'settings/advertisements', label: 'Advertisements', group: 'manage' }, show: isPlatformRole },
  { screen: { path: 'settings', label: 'Settings', group: 'manage' }, show: (role) => role === 'SUPER_ADMIN' },
  { screen: { path: 'platform-configuration', label: 'Configuration Platform', group: 'manage' }, show: (role) => role === 'SUPER_ADMIN' },
  { screen: { path: 'finance/income', label: 'Income', group: 'finance' }, show: (role) => allows(role, 'finance.view') },
  { screen: { path: 'finance/expenses', label: 'Expenses', group: 'finance' }, show: (role) => allows(role, 'expense.view') },
  { screen: { path: 'finance/subscriptions', label: 'New subscriptions', group: 'finance' }, show: (role) => allows(role, 'finance.view') },
  { screen: { path: 'finance/profit', label: 'Branch profit', group: 'finance' }, show: (role) => allows(role, 'finance.view') },
  { screen: { path: 'finance/share-capital', label: 'Share capital', group: 'finance' }, show: (role) => allows(role, 'finance.view') },
  { screen: { path: 'advertising', label: 'Dashboard', group: 'advertising' }, show: (role) => allows(role, 'advertising.view') },
  { screen: { path: 'advertising/campaigns', label: 'Campaigns', group: 'advertising' }, show: (role) => allows(role, 'advertising.view') },
  { screen: { path: 'advertising/expenses', label: 'Advertising expenses', group: 'advertising' }, show: (role) => allows(role, 'advertising.view') },
  { screen: { path: 'advertising/results', label: 'Campaign results', group: 'advertising' }, show: (role) => allows(role, 'advertising.view') },
  { screen: { path: 'advertising/analytics', label: 'Analytics', group: 'advertising' }, show: (role) => allows(role, 'advertising.view') },
  { screen: { path: 'advertising/reports', label: 'Reports', group: 'advertising' }, show: (role) => allows(role, 'advertising.view') },
];

export const GROUP_LABEL: Record<ScreenGroup, string> = {
  main: 'Main',
  manage: 'Management',
  finance: 'Finance',
  advertising: 'Advertising',
};

export function screensFor(role: Role, hidden: ReadonlySet<string>): AppScreen[] {
  return CATALOG.filter((item) => item.show(role) && !hidden.has(item.screen.path)).map((item) => item.screen);
}

export function allowsScreen(role: Role, hidden: ReadonlySet<string>, path: string): boolean {
  return screensFor(role, hidden).some((item) => item.path === path);
}

/** Backend route used by the web app for this screen. Empty when the route is POST-only. */
export function endpointFor(screen: string, organizationId: string, role: Role): string {
  const org = organizationId ? `organizationId=${encodeURIComponent(organizationId)}` : '';
  const withQuery = (path: string, extra?: string) => {
    const query = [org, extra].filter(Boolean).join('&');
    return query ? `${path}?${query}` : path;
  };

  switch (screen) {
    case 'dashboard':
      return organizationId ? withQuery('/players') : '/organizations';
    case 'profile':
      return '/users/me';
    case 'organizations':
      return withQuery('/organizations');
    case 'users':
      return withQuery('/users');
    case 'my-teams':
      return '/groups?assignedToMe=true';
    case 'players':
      return withQuery('/players');
    case 'training':
      return withQuery('/training');
    case 'training/methodologies':
      return withQuery('/training-methodologies');
    case 'training/schedules':
      return withQuery('/training-schedules');
    case 'training/activity-types':
      return '/training-activity-types';
    case 'my-training':
      return '/training-sessions';
    case 'ai-global':
      return '';
    case 'leaderboard':
      return organizationId ? `/leaderboard/org/${organizationId}/weekly` : '/leaderboard/global';
    case 'groups':
      return role === 'COACH' ? '/groups?assignedToMe=true' : withQuery('/groups');
    case 'competitions':
      return withQuery('/competitions');
    case 'competitions/league':
    case 'competitions/results':
      return organizationId ? `/competition/seasons/org/${organizationId}` : '/seasons/available';
    case 'attendance':
      return role === 'PLAYER' ? '/players/me' : '/training-sessions';
    case 'scan-attendance':
      return role === 'COACH' || role === 'ADMINISTRATIVE' ? '/staff-attendance/scan' : '/training-sessions/scan';
    case 'staff-attendance':
      return role === 'COACH' || role === 'ADMINISTRATIVE' ? '/staff-attendance/me' : withQuery('/staff-attendance/report');
    case 'training/approvals':
      return '/trainings/pending-approval';
    case 'marketplace':
      return '/marketplace/items';
    case 'settings/marketplace':
      return '/admin/marketplace/items';
    case 'settings/advertisements':
      return '/admin/advertisements';
    case 'settings':
      return organizationId ? `/admin/config/point-rules/org/${organizationId}` : '/organizations';
    case 'platform-configuration':
      return '/platform-configuration/academies';
    case 'payment-methods':
      return withQuery('/payment-methods');
    case 'finance/income':
      return withQuery('/finance/income');
    case 'finance/expenses':
      return withQuery('/finance/expenses');
    case 'finance/subscriptions':
      return withQuery('/finance/subscriptions');
    case 'finance/profit':
      return withQuery('/finance/profit', `year=${new Date().getFullYear()}`);
    case 'finance/share-capital':
      return withQuery('/finance/share-capital', `year=${new Date().getFullYear()}`);
    case 'advertising':
    case 'advertising/campaigns':
      return withQuery('/advertising/campaigns');
    case 'advertising/expenses':
      return withQuery('/advertising/expenses');
    case 'advertising/results':
      return withQuery('/advertising/results');
    case 'advertising/analytics':
      return withQuery('/advertising/analytics');
    case 'advertising/reports':
      return withQuery('/advertising/finance-reflection');
    default:
      return '/organizations';
  }
}
