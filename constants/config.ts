// constants/config.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDevApiBase() {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri;

  if (hostUri) {
    const host = String(hostUri).split(':')[0];
    return `http://${host}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants as any)?.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
  resolveDevApiBase();

export const API_PREFIX =
  process.env.EXPO_PUBLIC_API_PREFIX ||
  (Constants as any)?.expoConfig?.extra?.EXPO_PUBLIC_API_PREFIX ||
  '/api';

// ✅ anon key pública para invocar edge functions
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants as any)?.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';
