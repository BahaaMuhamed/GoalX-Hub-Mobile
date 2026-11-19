import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  effectiveScreens,
  listAcademies,
  listOrganizations,
  mediaUrl,
  type AcademyRecord,
  type OrganizationRecord,
} from '@/api/platform';
import { useAuth } from '@/auth/AuthContext';
import { ALL_ACADEMIES, isPlatformRole } from '@/workspace/navigation';

type WorkspaceValue = {
  ready: boolean;
  platform: boolean;
  organizations: OrganizationRecord[];
  academies: AcademyRecord[];
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  organizationId: string;
  hidden: ReadonlySet<string>;
  brandName: string;
  logoUri: string | null;
  accent: string;
  secondary: string;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { profile, status } = useAuth();
  const role = profile?.role ?? '';
  const platform = isPlatformRole(role);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [academies, setAcademies] = useState<AcademyRecord[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState(ALL_ACADEMIES);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status !== 'signedIn' || !profile) {
      setReady(false);
      return;
    }
    let active = true;
    setSelectedOrgId(platform ? ALL_ACADEMIES : profile.organizationId || '');
    Promise.all([
      listOrganizations().catch(() => [] as OrganizationRecord[]),
      effectiveScreens().catch(() => [] as string[]),
    ]).then(([orgs, hiddenScreens]) => {
      if (!active) return;
      setOrganizations(orgs);
      setHidden(new Set(hiddenScreens));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [platform, profile, status]);

  useEffect(() => {
    if (!selectedOrgId || selectedOrgId === ALL_ACADEMIES) {
      setAcademies([]);
      return;
    }
    let active = true;
    listAcademies(selectedOrgId)
      .then((rows) => {
        if (active) setAcademies(rows);
      })
      .catch(() => {
        if (active) setAcademies([]);
      });
    return () => {
      active = false;
    };
  }, [selectedOrgId]);

  const resolvedOrgId =
    !platform && profile?.organizationId && (selectedOrgId === ALL_ACADEMIES || !selectedOrgId)
      ? profile.organizationId
      : selectedOrgId;
  const selected = organizations.find((item) => item.id === resolvedOrgId);
  const value = useMemo<WorkspaceValue>(
    () => ({
      ready,
      platform,
      organizations,
      academies,
      selectedOrgId: resolvedOrgId,
      setSelectedOrgId,
      organizationId: resolvedOrgId === ALL_ACADEMIES ? '' : resolvedOrgId,
      hidden,
      brandName: selected?.name || (platform && resolvedOrgId === ALL_ACADEMIES ? 'GolaX Hub' : profile?.organizationName || 'GolaX Hub'),
      logoUri: mediaUrl(selected?.logoUrl || (!platform ? profile?.logoUrl : null)),
      accent:
        platform && resolvedOrgId === ALL_ACADEMIES
          ? '#19a967'
          : selected?.primaryColor || profile?.primaryColor || '#19a967',
      secondary:
        platform && resolvedOrgId === ALL_ACADEMIES
          ? '#d4af37'
          : selected?.secondaryColor || profile?.secondaryColor || '#d4af37',
    }),
    [academies, hidden, organizations, platform, profile, ready, resolvedOrgId, selected],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return value;
}
