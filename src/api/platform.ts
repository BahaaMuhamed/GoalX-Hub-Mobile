import { apiRequest } from '@/api/client';
import { apiBaseUrl } from '@/config';

export type OrganizationRecord = {
  id: string;
  name?: string | null;
  username?: string | null;
  status?: string | null;
  contactEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export type AcademyRecord = {
  id: string;
  organizationId?: string | null;
  name?: string | null;
  city?: string | null;
  country?: string | null;
};

export function listOrganizations(): Promise<OrganizationRecord[]> {
  return apiRequest<OrganizationRecord[]>('/organizations', { auth: true });
}

export function listAcademies(organizationId: string): Promise<AcademyRecord[]> {
  return apiRequest<AcademyRecord[]>(`/organizations/${organizationId}/academies`, { auth: true });
}

export function effectiveScreens(): Promise<string[]> {
  return apiRequest<{ hiddenScreens?: string[] }>('/platform-configuration/effective', { auth: true }).then(
    (body) => body.hiddenScreens ?? [],
  );
}

export function isPlatformLogo(url: string): boolean {
  return /goalx-lion|korahub-logo|brand\/goalx|brand\/korahub/i.test(url);
}

export function mediaUrl(url: string | null | undefined): string | null {
  const value = url?.trim();
  if (!value || isPlatformLogo(value)) {
    return null;
  }
  // The website stores an uploaded crest as a data URL. Leave those untouched.
  // Prefixing the API host turns them into a path the phone cannot load.
  if (/^data:image\/(png|jpe?g|webp|gif)/i.test(value)) {
    return value;
  }
  if (/^data:/i.test(value)) {
    return null;
  }
  if (/^https?:\/\//i.test(value)) {
    return reachable(value);
  }
  // /assets/ads and /assets/brand are files in the shared folder, not API uploads.
  if (value.startsWith('/assets/') || value.startsWith('assets/')) {
    return value.startsWith('/') ? value : `/${value}`;
  }
  const origin = apiOrigin();
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

function apiOrigin(): string {
  return apiBaseUrl().replace(/\/api\/v1\/?$/, '');
}

/** A logo saved as localhost points at the computer, not at the phone. */
function reachable(url: string): string {
  return url.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2)(?::\d+)?/i, apiOrigin());
}
