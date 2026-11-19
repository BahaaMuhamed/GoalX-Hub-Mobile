import { apiRequest } from '@/api/client';
import { mediaUrl } from '@/api/platform';

export type AdCard = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  cta: string;
  redirectUrl: string | null;
};

export type NoticeCard = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const SHARED_ADS: AdCard[] = [
  {
    id: 'seed-training',
    title: 'Alexandria Mariners — Training Offer',
    description: 'Get 20% off a private finishing session with a Mariners coach.',
    imageUrl: '/assets/ads/training-offer.svg',
    cta: 'Claim offer',
    redirectUrl: '/marketplace',
  },
  {
    id: 'seed-camp',
    title: 'Giza Pharaohs Summer Camp',
    description: 'Two weeks of drills, match play and video analysis at Giza Pharaohs FC.',
    imageUrl: '/assets/ads/summer-camp.svg',
    cta: 'See the camp',
    redirectUrl: '/marketplace',
  },
  {
    id: 'seed-kit',
    title: 'Partner Offer — Boots & Kit',
    description: 'Players at both academies save on official boots and training kit.',
    imageUrl: '/assets/ads/partner-kit.svg',
    cta: 'Browse the store',
    redirectUrl: '/marketplace',
  },
];

export async function listAdvertisements(): Promise<AdCard[]> {
  try {
    const rows = await readList('/advertisements?placement=FOOTER').catch(() => readList('/advertisements'));
    const ads = rows
      .map(mapAd)
      .filter((item): item is AdCard => item !== null)
      .filter((item, index, list) => list.findIndex((other) => other.id === item.id) === index);
    return ads.length ? ads : SHARED_ADS;
  } catch {
    return SHARED_ADS;
  }
}

export async function listNotices(): Promise<NoticeCard[]> {
  const rows = await readList('/notifications/me').catch(() => readList('/notifications'));
  return rows.map(mapNotice).filter((item): item is NoticeCard => item !== null);
}

async function readList(path: string): Promise<Record<string, unknown>[]> {
  const raw = await apiRequest<unknown>(path, { auth: true });
  return asRows(raw);
}

function mapAd(row: Record<string, unknown>): AdCard | null {
  const status = text(row.status).toUpperCase();
  if (status && status !== 'ACTIVE') return null;
  const title = text(row.title);
  if (!title) return null;
  const end = text(row.endDate);
  if (end && !Number.isNaN(Date.parse(end)) && Date.parse(end.length === 10 ? `${end}T23:59:59` : end) < Date.now()) {
    return null;
  }
  return {
    id: text(row.id) || title,
    title,
    description: text(row.description) || text(row.descriptionAr),
    imageUrl: picture(text(row.imageUrl)),
    cta: text(row.ctaLabel) || 'Shop now',
    redirectUrl: text(row.redirectUrl) || null,
  };
}

function mapNotice(row: Record<string, unknown>): NoticeCard | null {
  const title = text(row.title);
  if (!title) return null;
  return {
    id: text(row.id) || title,
    title,
    body: text(row.body) || text(row.message),
    createdAt: text(row.createdAt),
  };
}

function asRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) return [];
  for (const key of ['data', 'content', 'items', 'advertisements', 'notifications', 'result']) {
    const value = raw[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function picture(value: string): string | null {
  if (!value) return null;
  if (/\/assets\/ads\//i.test(value) || value.startsWith('assets/ads/')) return value;
  return mediaUrl(value);
}

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
