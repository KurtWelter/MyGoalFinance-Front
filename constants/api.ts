import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_PREFIX, API_URL } from './config';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function req<T>(
  path: string,
  { method = 'GET', body, auth = false }: { method?: Method; body?: any; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await AsyncStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}${API_PREFIX}${path}`;
  console.log('➡️ [api]', method, url, auth ? '(auth)' : '', body ?? '');

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    console.error(' [api] network error:', netErr);
    throw new Error('No se pudo conectar con el servidor');
  }

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  console.log('⬅️ [api]', res.status, path, data);

  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  // AUTH
  register: (p:{name:string;email:string;password:string}) =>
  req<{ id:string; email:string; requires_confirmation?: boolean }>(
    '/auth/register',
    { method:'POST', body:p }
  ),
login: (p:{email:string;password:string}) =>
  req<{ access_token:string; user?:any }>(
    '/auth/login',
    { method:'POST', body:p }
  ),
logout: () => req<{ ok: boolean }>('/auth/logout', { method: 'POST', auth: true }),

me: () => req<any>('/auth/me', { auth:true }), // si no tienes /auth/me, usa getProfile()

  // PROFILE
  getProfile: () => req<any>('/profile', { auth:true }),
  updateProfile: (p:any) => req<any>('/profile', { method:'PUT', body:p, auth:true }),

  // GOALS
  listGoals: () => req<any[]>('/goals', { auth:true }),
  createGoal: (p:any) => req<{id:string}>('/goals', { method:'POST', body:p, auth:true }),
  updateGoal: (id:string, p:any) => req<any>(`/goals/${id}`, { method:'PATCH', body:p, auth:true }),
  deleteGoal: (id:string) => req<void>(`/goals/${id}`, { method:'DELETE', auth:true }),

  // TRANSACTIONS
  listTransactions: (q?:{from?:string;to?:string}) =>
    req<any[]>(
      `/transactions${q?.from||q?.to ? `?from=${q?.from??''}&to=${q?.to??''}`:''}`,
      { auth:true }
    ),
  createTransaction: (p:any) => req<{id:string}>('/transactions', { method:'POST', body:p, auth:true }),

  // CONTRIBUTIONS  👈 corregido el path base
  listContributions: (goalId:string) => req<any[]>(`/goals/contributions/${goalId}`, { auth:true }),
  addContribution: (goalId:string, p:any) =>
    req<{id:string}>(`/goals/contributions/${goalId}`, { method:'POST', body:p, auth:true }),

  // RECOMMENDATIONS
  listRecommendations: () => req<any[]>('/recommendations', { auth:true }),

  // CHAT
  chatMessage: (message:string) => req<{reply:string}>('/chat/message', { method:'POST', body:{message}, auth:true }),
};
export default api;
