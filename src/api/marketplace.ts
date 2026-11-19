import { apiRequest } from '@/api/client';

export type ShopKind = 'product' | 'service';

/** One storefront card. Same shape the website builds from the marketplace APIs. */
export type ShopCard = {
  id: string;
  kind: ShopKind;
  name: string;
  summary: string;
  details: string;
  price: number | null;
  currency: string;
  points: number | null;
  discount: number | null;
  image: string | null;
  inStock: boolean;
  stockQuantity: number | null;
  /** Set for a published product or service. Purchases use this id. Clinics stay null. */
  rewardId: string | null;
};

export type StoreHistoryRow = {
  id: string;
  rewardId: string;
  pointCost: number;
  status: string;
};

export type PointWallet = {
  available: number;
  deemed: boolean;
};

type ItemRow = {
  id?: string;
  name?: string;
  description?: string | null;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  type?: string | null;
  pointCost?: number | null;
  priceAmount?: number | null;
  currency?: string | null;
  discountPercent?: number | null;
  dealLabel?: string | null;
  stockQuantity?: number | null;
  inStock?: boolean;
  videoUrl?: string | null;
};

type ClinicRow = {
  id?: string;
  name?: string;
  description?: string | null;
  location?: string | null;
  coachName?: string | null;
  imageUrl?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  pointCost?: number | null;
  totalSeats?: number | null;
  availableSeats?: number | null;
};

type HomeCard = {
  kind?: string;
  items?: ItemRow[];
  clinics?: ClinicRow[];
};

type Page<T> = { content?: T[]; totalElements?: number };

/**
 * The signed-in storefront the website uses: `/marketplace/home`, and the same
 * item and clinic search when a query is typed. No sample catalogue.
 */
export async function loadMarketplace(query = '', arabic = false): Promise<ShopCard[]> {
  const q = query.trim();
  if (q) {
    const [items, clinics] = await Promise.all([
      apiRequest<Page<ItemRow>>(`/marketplace/items?q=${encodeURIComponent(q)}&page=0&size=24`, { auth: true }),
      apiRequest<Page<ClinicRow>>(`/marketplace/clinics?q=${encodeURIComponent(q)}&page=0&size=24`, { auth: true }),
    ]);
    return merge(items.content ?? [], clinics.content ?? [], arabic);
  }

  const [home, clinics] = await Promise.all([
    apiRequest<HomeCard[]>('/marketplace/home', { auth: true }),
    apiRequest<Page<ClinicRow>>('/marketplace/clinics?page=0&size=24', { auth: true }),
  ]);
  const items: ItemRow[] = [];
  const listedClinics: ClinicRow[] = [];
  for (const category of home ?? []) {
    if (category.kind === 'VIDEO') continue;
    items.push(...(category.items ?? []));
    listedClinics.push(...(category.clinics ?? []));
  }
  return merge(items, [...listedClinics, ...(clinics.content ?? [])], arabic);
}

export async function playerWallet(): Promise<{ playerId: string; wallet: PointWallet } | null> {
  try {
    const player = await apiRequest<{ id?: string }>('/players/me', { auth: true });
    if (!player.id) return null;
    const balance = await apiRequest<{
      availableBalance?: number;
      totalBalance?: number;
      pointsDeemed?: boolean;
    }>(`/points/${player.id}/balance`, { auth: true });
    const deemed = !!balance.pointsDeemed;
    return {
      playerId: player.id,
      wallet: {
        deemed,
        available: deemed ? (balance.availableBalance ?? 0) : (balance.availableBalance ?? balance.totalBalance ?? 0),
      },
    };
  } catch {
    return null;
  }
}

export function purchaseReward(rewardId: string, playerId: string): Promise<unknown> {
  return apiRequest(`/rewards/${rewardId}/redeem?playerId=${encodeURIComponent(playerId)}`, {
    method: 'POST',
    auth: true,
    body: {},
  });
}

export async function storeHistory(playerId: string): Promise<StoreHistoryRow[]> {
  const rows = await apiRequest<StoreHistoryRow[]>(`/rewards/redemptions/player/${playerId}`, { auth: true });
  return Array.isArray(rows) ? rows : [];
}

function merge(items: ItemRow[], clinics: ClinicRow[], arabic: boolean): ShopCard[] {
  const cards: ShopCard[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const card = fromItem(item, arabic);
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    cards.push(card);
  }
  for (const clinic of clinics) {
    const card = fromClinic(clinic);
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    cards.push(card);
  }
  return cards;
}

function fromItem(item: ItemRow, arabic: boolean): ShopCard | null {
  if (!item.id || !item.name || item.videoUrl) return null;
  const text = copy(item.description, item.descriptionAr, arabic);
  return {
    id: item.id,
    kind: (item.type || '').toUpperCase() === 'SERVICE' ? 'service' : 'product',
    name: item.name,
    summary: text,
    details: text,
    price: item.priceAmount ?? null,
    currency: item.currency || 'EGP',
    points: item.pointCost ?? null,
    discount: discountOf(item.discountPercent, item.dealLabel),
    image: item.imageUrl || null,
    inStock: item.inStock !== false,
    stockQuantity: item.stockQuantity ?? null,
    rewardId: item.id,
  };
}

function fromClinic(clinic: ClinicRow): ShopCard | null {
  if (!clinic.id || !clinic.name) return null;
  const summary = [clinic.coachName, clinic.location].filter(Boolean).join(' · ');
  const seats = clinic.totalSeats == null
    ? ''
    : `${clinic.availableSeats ?? 0} of ${clinic.totalSeats} seats left`;
  return {
    id: `clinic-${clinic.id}`,
    kind: 'service',
    name: clinic.name,
    summary,
    details: [clinic.description, seats].filter(Boolean).join(' · '),
    price: clinic.priceAmount ?? null,
    currency: clinic.currency || 'EGP',
    points: clinic.pointCost ?? null,
    discount: null,
    image: clinic.imageUrl || null,
    inStock: true,
    stockQuantity: clinic.availableSeats ?? null,
    rewardId: null,
  };
}

function copy(english?: string | null, arabicText?: string | null, arabic = false): string {
  if (arabic && arabicText?.trim()) return arabicText.trim();
  return (english || arabicText || '').trim();
}

function discountOf(percent?: number | null, label?: string | null): number | null {
  if (percent != null && percent > 0 && percent < 100) return percent;
  const match = (label || '').match(/(\d+(?:\.\d+)?)\s*%/);
  const value = match ? Number(match[1]) : 0;
  return value > 0 && value < 100 ? value : null;
}
