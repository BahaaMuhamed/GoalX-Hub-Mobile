import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8080;

/**
 * Backend base URL.
 * Override with EXPO_PUBLIC_API_BASE_URL when the phone cannot see the dev machine.
 * Otherwise the app uses the same computer Metro is running on, which is where
 * the Spring Boot API listens on port 8080.
 */
export function apiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}/api/v1`;
  }

  const fallback = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${fallback}:${API_PORT}/api/v1`;
}
