import { apiRequest } from '@/api/client';
import type { AuthResponse, LoginBody, RegisterBody } from '@/api/types';

export function login(body: LoginBody): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body });
}

export function register(body: RegisterBody): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body });
}

export function currentUser(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/me', { auth: true });
}

export function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}
