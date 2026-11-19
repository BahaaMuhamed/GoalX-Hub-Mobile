export type ScreenPayload = {
  summary: { label: string; value: string }[];
  rows: Record<string, unknown>[];
};

const TITLE_KEYS = ['name', 'fullName', 'title', 'username', 'email', 'label', 'screenKey', 'code'];
const HIDDEN_KEYS = new Set(['password', 'accessToken', 'refreshToken', 'token']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRows(value: unknown[]): Record<string, unknown>[] {
  return value.map((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return { value: item };
    }
    return isRecord(item) ? item : { value: String(item) };
  });
}

export function presentResponse(payload: unknown): ScreenPayload {
  if (Array.isArray(payload)) {
    return {
      summary: [{ label: 'Records', value: String(payload.length) }],
      rows: asRows(payload),
    };
  }
  if (!isRecord(payload)) {
    return { summary: [], rows: payload == null ? [] : [{ value: String(payload) }] };
  }

  const arrayKey = Object.keys(payload).find((key) => Array.isArray(payload[key]));
  if (!arrayKey) {
    return { summary: [], rows: [payload] };
  }

  const rows = asRows(payload[arrayKey] as unknown[]);
  const summary = Object.entries(payload)
    .filter(([key, value]) => key !== arrayKey && !Array.isArray(value) && !isRecord(value) && value != null && value !== '')
    .map(([key, value]) => ({ label: fieldLabel(key), value: String(value) }));
  summary.unshift({ label: 'Records', value: String(rows.length) });
  return { summary, rows };
}

export function rowTitle(row: Record<string, unknown>, index: number): string {
  for (const key of TITLE_KEYS) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  if (row.id != null) {
    return String(row.id);
  }
  return `Record ${index + 1}`;
}

export function rowLogo(row: Record<string, unknown>): string | null {
  const value = row.logoUrl ?? row.imageUrl ?? row.coverImageUrl;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function rowFields(row: Record<string, unknown>): { label: string; value: string }[] {
  return Object.entries(row)
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && !TITLE_KEYS.includes(key) && value != null && value !== '' && !isRecord(value) && !Array.isArray(value))
    .slice(0, 6)
    .map(([key, value]) => ({ label: fieldLabel(key), value: String(value) }));
}

export function fieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}
