import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { currentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '@/api/auth';
import { setSessionExpiredHandler } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { Profile, RegisterBody } from '@/api/types';
import { toProfile } from '@/api/types';
import { clearSession, getAccessToken, getProfile, getRefreshToken, saveProfile, saveSession } from '@/auth/storage';

type AuthStatus = 'booting' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  profile: Profile | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (body: RegisterBody) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loginBody(identifier: string, password: string) {
  const value = identifier.trim();
  if (value.includes('@')) {
    return { email: value, password };
  }
  return { username: value, password };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [profile, setProfile] = useState<Profile | null>(null);

  const expire = useCallback(() => {
    setProfile(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(expire);
    return () => setSessionExpiredHandler(null);
  }, [expire]);

  useEffect(() => {
    let active = true;

    async function restore() {
      const accessToken = await getAccessToken();
      const cached = await getProfile();
      if (!accessToken) {
        if (active) {
          setProfile(null);
          setStatus('signedOut');
        }
        return;
      }

      try {
        const next = toProfile(await currentUser());
        await saveProfile(next);
        if (active) {
          setProfile(next);
          setStatus('signedIn');
        }
      } catch (error) {
        const rejected = error instanceof ApiError && (error.status === 401 || error.status === 403);
        if (rejected) {
          await clearSession();
        }
        if (active) {
          setProfile(rejected ? null : cached);
          setStatus(rejected || !cached ? 'signedOut' : 'signedIn');
        }
      }
    }

    restore();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const session = await loginRequest(loginBody(identifier, password));
    if (!session.accessToken) {
      throw new ApiError(401, 'NO_TOKEN', 'The server did not return an access token.');
    }
    const next = toProfile(session);
    await saveSession(session.accessToken, session.refreshToken, next);
    setProfile(next);
    setStatus('signedIn');
  }, []);

  const signUp = useCallback(async (body: RegisterBody) => {
    const session = await registerRequest(body);
    if (!session.accessToken) {
      throw new ApiError(401, 'NO_TOKEN', 'The server did not return an access token.');
    }
    const next = toProfile(session);
    await saveSession(session.accessToken, session.refreshToken, next);
    setProfile(next);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Local sign-out still completes when the server cannot be reached.
      }
    }
    await clearSession();
    setProfile(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, profile, signIn, signUp, signOut }),
    [status, profile, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
