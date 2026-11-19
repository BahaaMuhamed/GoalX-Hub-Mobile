import { apiBaseUrl } from '@/config';
import { ApiError } from '@/api/errors';
import type { ApiErrorBody, AuthResponse } from '@/api/types';
import { clearSession, getAccessToken, getRefreshToken, saveTokens } from '@/auth/storage';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function errorFrom(response: Response, payload: unknown): ApiError {
  const body = (payload ?? {}) as ApiErrorBody;
  const message = body.message || `Request failed (${response.status})`;
  return new ApiError(response.status, body.code || 'REQUEST_FAILED', message);
}

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return false;
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    await clearSession();
    onSessionExpired?.();
    return false;
  }

  const session = payload as AuthResponse;
  if (!session.accessToken) {
    await clearSession();
    onSessionExpired?.();
    return false;
  }

  await saveTokens(session.accessToken, session.refreshToken || refreshToken);
  return true;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK',
      `Cannot reach the backend at ${apiBaseUrl()}. Start the server, then try again.`,
    );
  }

  if (response.status === 401 && options.auth && !options.retry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: true });
    }
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    throw errorFrom(response, payload);
  }
  return payload as T;
}
