import { apiRequest } from '@/api/client';

export type BranchCard = {
  id: string;
  name: string;
  ageGroup: string;
  address: string;
  academyId: string;
  headCoachId: string;
  administrativeId: string;
};

export type AcademyGroupCard = {
  id: string;
  name: string;
  description: string;
  branchId: string;
  headCoachId: string;
  administrativeId: string;
};

export type GroupMember = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

const MANAGERS = new Set(['ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE']);

export function canManageBranches(role: string): boolean {
  return MANAGERS.has(role);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function mapBranch(value: unknown): BranchCard | null {
  const row = record(value);
  const id = text(row?.id);
  if (!id) return null;
  return {
    id,
    name: text(row?.name) || 'Branch',
    ageGroup: text(row?.ageGroup),
    address: text(row?.address),
    academyId: text(row?.academyId),
    headCoachId: text(row?.headCoachId),
    administrativeId: text(row?.administrativeId),
  };
}

function mapGroup(value: unknown): AcademyGroupCard | null {
  const row = record(value);
  const id = text(row?.id);
  if (!id) return null;
  return {
    id,
    name: text(row?.name) || 'Group',
    description: text(row?.description),
    branchId: text(row?.branchId),
    headCoachId: text(row?.headCoachId),
    administrativeId: text(row?.administrativeId),
  };
}

async function rows(path: string): Promise<unknown[]> {
  const body = await apiRequest<unknown>(path, { auth: true });
  return Array.isArray(body) ? body : [];
}

export async function listBranchCards(academyId: string, organizationId: string): Promise<BranchCard[]> {
  const attempts = [
    academyId ? `/organizations/academies/${academyId}/branches` : '',
    academyId ? `/branches?academyId=${encodeURIComponent(academyId)}` : '',
    organizationId ? `/teams?organizationId=${encodeURIComponent(organizationId)}` : '',
  ].filter(Boolean);
  for (const path of attempts) {
    const list = (await rows(path).catch(() => [])).map(mapBranch).filter((item): item is BranchCard => !!item);
    if (list.length) return list;
  }
  return [];
}

export async function saveBranch(input: {
  id?: string;
  name: string;
  ageGroup: string;
  address: string;
  academyId: string;
  organizationId: string;
  headCoachId: string;
  administrativeId: string;
}): Promise<void> {
  await apiRequest(input.id ? `/branches/${input.id}` : '/branches', {
    method: input.id ? 'PUT' : 'POST',
    auth: true,
    body: {
      name: input.name.trim(),
      ageGroup: input.ageGroup.trim() || null,
      address: input.address.trim() || null,
      academyId: input.academyId,
      organizationId: input.organizationId,
      headCoachId: input.headCoachId || null,
      administrativeId: input.administrativeId || null,
    },
  });
}

export async function listGroupsInBranch(branchId: string): Promise<AcademyGroupCard[]> {
  const body = await rows(`/branches/${branchId}/groups`).catch(() => rows(`/groups?branchId=${encodeURIComponent(branchId)}`));
  return body.map(mapGroup).filter((item): item is AcademyGroupCard => !!item);
}

export async function saveGroup(input: {
  id?: string;
  branchId: string;
  name: string;
  description: string;
  headCoachId: string;
  administrativeId: string;
}): Promise<void> {
  const body = {
    name: input.name.trim(),
    description: input.description.trim() || null,
    branchId: input.branchId,
    headCoachId: input.headCoachId || null,
    administrativeId: input.administrativeId || null,
  };
  await apiRequest(input.id ? `/groups/${input.id}` : `/branches/${input.branchId}/groups`, {
    method: input.id ? 'PUT' : 'POST',
    auth: true,
    body,
  });
}

export async function removeGroup(id: string): Promise<void> {
  await apiRequest(`/groups/${id}`, { method: 'DELETE', auth: true });
}

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  return (await rows(`/groups/${groupId}/members`).catch(() => [])).map((item) => {
    const row = record(item);
    return {
      id: text(row?.id) || text(row?.userId),
      fullName: text(row?.fullName) || 'Member',
      email: text(row?.email),
      role: text(row?.role),
    };
  }).filter((item) => item.id);
}
