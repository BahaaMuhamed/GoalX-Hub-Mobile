import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Profile } from '@/api/types';

const ACCESS = 'goalx.access';
const REFRESH = 'goalx.refresh';
const PROFILE = 'goalx.profile';

const memory = new Map<string, string>();

function browserStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}

async function read(key: string): Promise<string | null> {
  if (Platform.OS !== 'web') {
    return SecureStore.getItemAsync(key);
  }
  return browserStorage()?.getItem(key) ?? memory.get(key) ?? null;
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  memory.set(key, value);
  browserStorage()?.setItem(key, value);
}

async function remove(key: string): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // A missing key already means that value is gone.
    }
    return;
  }
  memory.delete(key);
  browserStorage()?.removeItem(key);
}

export async function saveSession(accessToken: string, refreshToken: string, profile: Profile): Promise<void> {
  await write(ACCESS, accessToken);
  await write(REFRESH, refreshToken);
  await write(PROFILE, JSON.stringify(profile));
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await write(ACCESS, accessToken);
  if (refreshToken) {
    await write(REFRESH, refreshToken);
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await write(PROFILE, JSON.stringify(profile));
}

export async function getAccessToken(): Promise<string | null> {
  return read(ACCESS);
}

export async function getRefreshToken(): Promise<string | null> {
  return read(REFRESH);
}

export async function getProfile(): Promise<Profile | null> {
  const raw = await read(PROFILE);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([remove(ACCESS), remove(REFRESH), remove(PROFILE)]);
}
