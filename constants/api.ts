// constants/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_PREFIX, API_URL, SUPABASE_ANON_KEY } from './config';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ReqOpts = {
  method?: Method;
  body?: any;
  auth?: boolean;
  /** Tiempo máximo por request (ms). Default: 12000 */
  timeoutMs?: number;
  /** Reintentos en errores de red/timeout o 5xx. Default: 1 (un reintento) */
  retries?: number;
  /** Delay base entre reintentos (ms). Default: 600 */
  retryDelayMs?: number;
};

/**
 * Resolver de base URL multiplataforma.
 * - Si viene `configUrl`/env con una URL completa (http/https) → úsala tal cual.
 * - Si no hay nada, en web arma http://<host>:3000 para dev.
 * - En nativo hace fallback a una IP LAN por defecto.
 */
function resolveApiUrl(configUrl?: string) {
  const extra = (Constants as any)?.expoConfig?.extra || {};
  const env = process.env.EXPO_PUBLIC_API_URL || extra.EXPO_PUBLIC_API_URL;

  // ✅ si nos dieron una URL completa (https://...), úsala tal cual
  const explicit = configUrl || env;
  if (explicit && /^https?:\/\//.test(explicit)) return explicit;

  if (Platform.OS === 'web') {
    const host =
      (typeof window !== 'undefined' && window.location?.hostname) || 'localhost';
    // trata de respetar puerto si hubiera uno en extra.apiUrl
    let port = '3000';
    try {
      const u = new URL(extra.apiUrl || '');
      if (u.port) port = u.port;
    } catch {}
    return `http://${host}:${port}`;
  }

  // nativo: si no hay URL explícita, cae al viejo apiUrl local o a un fallback
  if (extra.apiUrl) return extra.apiUrl;
  return 'http://192.168.1.83:3000';
}

// Base URL efectiva (normalizada)
const BASE_URL = (resolveApiUrl(API_URL) || '').replace(/\/$/, '');
// Prefix normalizado (sin slash final)
const PREFIX = (API_PREFIX || '/api').replace(/\/$/, '');

async function req<T>(
  path: string,
  {
    method = 'GET',
    body,
    auth = false,
    timeoutMs = 12_000,
    retries = 1,
    retryDelayMs = 600,
  }: ReqOpts = {}
): Promise<T> {
  // ✅ Soporte para FormData (multipart) sin romper JSON
  const isForm = (typeof FormData !== 'undefined') && (body instanceof FormData);

  const headers: Record<string, string> = {};

  // ✅ ¡Siempre enviar la anon key! (requisito del gateway de Edge Functions)
  if (SUPABASE_ANON_KEY) {
    headers['apikey'] = SUPABASE_ANON_KEY;
    // (opcional) algunos setups aceptan también:
    // headers['x-client-info'] = 'mygoalfinance';
  }

  if (!isForm) headers['Content-Type'] = 'application/json';

  // ✅ Authorization solo cuando el endpoint requiere sesión del usuario
  if (auth) {
    const token = await AsyncStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Construcción robusta de URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${PREFIX}${cleanPath}`;

  // Intento con reintentos controlados (solo red/timeout/5xx)
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log('➡️ [api]', method, url, auth ? '(auth)' : '', body ?? '');

      const res = await fetch(url, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = raw; // HTML / texto plano
      }

      console.log('⬅️ [api]', res.status, path, data);

      if (!res.ok) {
        // Si es 5xx y hay reintentos, reintenta
        if (res.status >= 500 && retries - attempt > 0) {
          attempt++;
          await sleep(retryDelayMs * attempt); // backoff lineal
          continue;
        }
        const msg =
          (data && (data.detail || data.message)) || `Error ${res.status}`;
        throw new Error(msg);
      }

      return data as T;
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      const isNetwork =
        !isAbort &&
        (err?.message?.includes('Network') ||
          err?.message === 'TypeError: Network request failed');

      // Reintenta solo para timeout / error de red
      if ((isAbort || isNetwork) && retries - attempt > 0) {
        console.log(
          '[api] retrying due to',
          isAbort ? 'timeout' : 'network error',
          '→ attempt',
          attempt + 1
        );
        attempt++;
        await sleep(retryDelayMs * attempt);
        continue;
      }

      console.error('[api] fetch error', err?.message || err);
      if (isAbort) throw new Error('Tiempo de espera agotado');
      throw new Error('No se pudo conectar con el servidor');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Convierte "YYYY-MM" a [primer_día, último_día] */
function monthToRange(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return { from: ym, to: ym }; // fallback defensivo
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

/** Tipo opcional para el summary mensual */
type SummaryMonth = {
  month: string;
  from: string;
  to: string;
  inc: number;
  exp: number;
  net: number;
  byCategory: { category_id: number; total: number }[];
};

/** Tipos de chat */
type ChatMsg = {
  id: number;
  user_id?: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string; // ISO
};

type ChatSendResponse = {
  user: ChatMsg;
  bot: ChatMsg;
};

/** === NUEVOS TIPOS NEWS/RATES === */
type Rates = {
  base: 'CLP';
  usd: number;
  eur: number;
  uf: number;
  updatedAt: string;
};

type Article = {
  id: string;
  title: string;
  url: string;
  source?: string;
  published_at?: string | null;
};

export const api = {
  // AUTH
  register: (p: { name: string; email: string; password: string }) =>
    req<{ id: string; email: string; requires_confirmation?: boolean }>(
      '/auth/register',
      { method: 'POST', body: p }
    ),

  login: (p: { email: string; password: string }) =>
    req<{ access_token: string; user?: any }>(
      '/auth/login',
      { method: 'POST', body: p }
    ),

  logout: () =>
    req<{ ok: boolean }>(
      '/auth/logout',
      { method: 'POST', auth: true }
    ),

  me: () => req<any>('/auth/me', { auth: true }),

  // PROFILE
  getProfile: () => req<any>('/profile', { auth: true }),
  updateProfile: (p: any) =>
    req<any>('/profile', { method: 'PUT', body: p, auth: true }),

  /** ⬇️ Subir avatar (web: Blob/File; nativo: { uri, name, type }) */
  uploadAvatar: async (uri: string) => {
    const fd = new FormData();

    if (Platform.OS === 'web') {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const file = new File([blob], 'avatar.jpg', {
        type: blob.type || 'image/jpeg',
      });
      fd.append('file', file);
    } else {
      const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      fd.append('file', {
        uri,
        name: `avatar.${ext}`,
        type: mime,
      } as any);
    }

    return req<{ url: string }>('/profile/avatar', {
      method: 'POST',
      body: fd,
      auth: true,
      timeoutMs: 20_000,
    });
  },

  // GOALS
  listGoals: () => req<any[]>('/goals', { auth: true }),

  createGoal: (p: any) =>
    req<{ id: string }>('/goals', {
      method: 'POST',
      auth: true,
      body: {
        ...p,
        description:
          p?.description == null || String(p.description).trim() === ''
            ? undefined
            : String(p.description).trim(),
        deadline:
          p?.deadline == null || String(p.deadline).trim() === ''
            ? undefined
            : String(p.deadline).trim(),
      },
    }),

  updateGoal: (id: string, p: any) =>
    req<any>(`/goals/${id}`, { method: 'PATCH', body: p, auth: true }),

  deleteGoal: (id: string) =>
    req<void>(`/goals/${id}`, { method: 'DELETE', auth: true }),

  // TRANSACTIONS
  listTransactions: (q?: { from?: string; to?: string; month?: string }) => {
    let from = q?.from;
    let to = q?.to;

    if (!from && !to && q?.month) {
      const r = monthToRange(q.month);
      from = r.from;
      to = r.to;
    }
    if (from && from.length === 7) {
      const r = monthToRange(from);
      from = r.from;
      if (!to) to = r.to;
    }
    if (to && to.length === 7) {
      const r = monthToRange(to);
      to = r.to;
    }

    const qs =
      from || to
        ? `?from=${encodeURIComponent(from ?? '')}&to=${encodeURIComponent(to ?? '')}`
        : '';

    return req<any[]>(`/transactions${qs}`, { auth: true });
  },

  createTransaction: (p: any) =>
    req<{ id: string }>('/transactions', { method: 'POST', body: p, auth: true }),

  updateTransaction: (id: number | string, p: any) =>
    req<any>(`/transactions/${id}`, { method: 'PATCH', body: p, auth: true }),

  deleteTransaction: (id: number | string) =>
    req<void>(`/transactions/${id}`, { method: 'DELETE', auth: true }),

  summaryMonth: (p?: { month?: string }) =>
    req<SummaryMonth>(
      `/transactions/summary/month${p?.month ? `?month=${encodeURIComponent(p.month)}` : ''}`,
      { auth: true }
    ),

  // CONTRIBUTIONS
  listContributions: (goalId: string) =>
    req<any[]>(`/goals/contributions/${goalId}`, { auth: true }),

  addContribution: (goalId: string, p: any) =>
    req<{ id: string }>(`/goals/${goalId}/contribute`, {
      method: 'POST',
      body: p,
      auth: true,
    }),

  // RECOMMENDATIONS
  listRecommendations: () => req<any[]>('/recommendations', { auth: true }),

  // CHAT
  chatHistory: () => req<ChatMsg[]>('/chat', { auth: true }),

  chatSend: (message: string) =>
    req<ChatSendResponse>('/chat/message', {
      method: 'POST',
      body: { message },
      auth: true,
    }),

  chatMessage: async (message: string) => {
    const res = await req<ChatSendResponse>('/chat', {
      method: 'POST',
      body: { message },
      auth: true,
    });
    return { reply: res.bot.message };
  },

  // PUSH TOKENS
  pushRegister: (p: { token: string; platform: 'ios' | 'android' | 'web' }) =>
    req<{ ok: boolean }>('/push/register', { method: 'POST', body: p, auth: true }),

  // NEWS
  newsRates: () => req<Rates>('/news/rates', { auth: true }),
  newsFeed: () => req<Article[]>('/news/feed', { auth: true }),
};

export default api;
