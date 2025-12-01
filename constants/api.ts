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
  /** Reintentos en errores de red/timeout o 5xx. Default: 1 */
  retries?: number;
  /** Delay base entre reintentos (ms). Default: 600 */
  retryDelayMs?: number;
};

/**
 * Resolver de base URL multiplataforma.
 * - Si viene `configUrl`/env con una URL completa (http/https) → úsala tal cual.
 * - En web (solo dev) arma http://<host>:<port> (por defecto 3000).
 * - En nativo, si no hay URL explícita → error (para evitar fallbacks a IPs locales en APK).
 */
function resolveApiUrl(configUrl?: string) {
  const extra: any = (Constants as any)?.expoConfig?.extra || {};
  const env = process.env.EXPO_PUBLIC_API_URL || extra.EXPO_PUBLIC_API_URL;

  const explicit = configUrl || env;
  if (explicit && /^https?:\/\//.test(explicit)) return explicit;

  if (Platform.OS === 'web') {
    const host =
      (typeof window !== 'undefined' && window.location?.hostname) ||
      'localhost';
    let port = '3000';
    try {
      if (explicit) {
        const u = new URL(explicit);
        if (u.port) port = u.port;
      } else if (
        typeof window !== 'undefined' &&
        window.location?.port
      ) {
        port = window.location.port || '3000';
      }
    } catch {}
    return `http://${host}:${port}`;
  }

  throw new Error(
    'Falta EXPO_PUBLIC_API_URL. Configúrala en app.json (extra) o en eas.json (env) para builds.'
  );
}

// Base URL efectiva (normalizada)
const BASE_URL = (resolveApiUrl(API_URL) || '').replace(/\/$/, '');
// Prefix normalizado (sin slash final)
const PREFIX = (API_PREFIX || '/api').replace(/\/$/, '');

/** Detecta de forma robusta si el body es un FormData (incluye polyfills de RN). */
function isFormData(body: any): body is FormData {
  if (!body) return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;

  const maybe = body as any;
  // En React Native normalmente solo tiene append()
  return typeof maybe === 'object' && typeof maybe.append === 'function';
}

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
  const isForm = isFormData(body);
  const headers: Record<string, string> = {};

  // En Edge Functions, muchas veces se espera `apikey`
  if (SUPABASE_ANON_KEY) {
    headers['apikey'] = SUPABASE_ANON_KEY;
    // headers['x-client-info'] = 'mygoalfinance'; // opcional
  }

  if (!isForm) headers['Content-Type'] = 'application/json';

  // Authorization solo cuando el endpoint requiere sesión
  if (auth) {
    const token =
      (await AsyncStorage.getItem('auth_token')) ||
      (await AsyncStorage.getItem('token')); // fallback compat
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${PREFIX}${cleanPath}`;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(
        '➡️ [api]',
        method,
        url,
        auth ? '(auth)' : '',
        isForm ? '[FormData]' : body ?? ''
      );

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
        data = raw; // texto/HTML
      }

      console.log('⬅️ [api]', res.status, path, data);

      if (!res.ok) {
        // Reintentar solo errores 5xx, si quedan intentos
        if (res.status >= 500 && retries - attempt > 0) {
          attempt++;
          await sleep(retryDelayMs * attempt);
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
      // ✅ Preserva el mensaje real salvo timeout/red
      if (isAbort) throw new Error('Tiempo de espera agotado');
      if (isNetwork) throw new Error('No se pudo conectar con el servidor');
      throw new Error(err?.message || 'Error desconocido');
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
  if (!y || !m) return { from: ym, to: ym };
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(
    2,
    '0'
  )}`;
  return { from, to };
}

/** Tipos… */
type SummaryMonth = {
  month: string;
  from: string;
  to: string;

  // Movimientos Excel / generales
  inc: number;
  exp: number;
  net: number;
  byCategory?: { category_id: number; total: number }[];

  // Cuenta MyGoalFinance (depósitos Webpay / retiros)
  deposits?: number;
  withdrawals?: number;
  balance?: number;
};

type ChatMsg = {
  id: number;
  user_id?: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
};

type ChatSendResponse = {
  user: ChatMsg;
  bot: ChatMsg;
};

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
    req<{ access_token: string; user?: any }>('/auth/login', {
      method: 'POST',
      body: p,
    }),

  logout: () =>
    req<{ ok: boolean }>('/auth/logout', { method: 'POST', auth: true }),
  me: () => req<any>('/auth/me', { auth: true }),

  // PROFILE
  getProfile: () => req<any>('/profile', { auth: true }),
  updateProfile: (p: any) =>
    req<any>('/profile', { method: 'PUT', body: p, auth: true }),

  // Upload avatar
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
      timeoutMs: 60_000,
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
          p?.description == null ||
          String(p.description).trim() === ''
            ? undefined
            : String(p.description).trim(),
        deadline:
          p?.deadline == null || String(p.deadline).trim() === ''
            ? undefined
            : String(p.deadline).trim(),
      },
    }),
  updateGoal: (id: string | number, p: any) =>
    req<any>(`/goals/${id}`, { method: 'PATCH', body: p, auth: true }),
  deleteGoal: (id: string | number) =>
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
        ? `?from=${encodeURIComponent(from ?? '')}&to=${encodeURIComponent(
            to ?? ''
          )}`
        : '';
    return req<any[]>(`/transactions${qs}`, { auth: true });
  },

  createTransaction: (p: any) =>
    req<{ id: string }>('/transactions', {
      method: 'POST',
      body: p,
      auth: true,
    }),

  updateTransaction: (id: number | string, p: any) =>
    req<any>(`/transactions/${id}`, {
      method: 'PATCH',
      body: p,
      auth: true,
    }),

  deleteTransaction: (id: number | string) =>
    req<void>(`/transactions/${id}`, {
      method: 'DELETE',
      auth: true,
    }),

  summaryMonth: (p?: { month?: string }) =>
    req<SummaryMonth>(
      `/transactions/summary/month${
        p?.month ? `?month=${encodeURIComponent(p.month)}` : ''
      }`,
      { auth: true }
    ),

  // ✅ Importación de Excel/CSV: recibe un FormData ya armado
  importTransactions: (form: FormData) =>
    req<{ imported: number }>('/transactions/import', {
      method: 'POST',
      body: form,
      auth: true,
      timeoutMs: 60_000,
    }),

  // 💰 DEPÓSITOS (Webpay)
  createDeposit: (p: { amount: number }) =>
    req<{
      provider?: string;
      deposit_id?: string;
      token?: string;
      payment_url?: string;
    }>('/payments/deposit', {
      method: 'POST',
      body: p,
      auth: true,
    }),

  // CONTRIBUTIONS
  listContributions: (goalId: string | number) =>
    req<any[]>(`/goals/contributions/${goalId}`, { auth: true }),

  addContribution: (goalId: string | number, p: any) =>
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
    req<{ ok: boolean }>('/push/register', {
      method: 'POST',
      body: p,
      auth: true,
    }),

  // NEWS
  newsRates: () => req<Rates>('/news/rates', { auth: true }),
  newsFeed: () => req<Article[]>('/news/feed', { auth: true }),
};

export default api;
