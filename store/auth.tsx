// store/auth.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../constants/api';

type User = {
  id?: string;
  email: string;
  name?: string;
  avatar_url?: string; // ✅ importante agregarlo
  age_range?: string;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  monthly_income?: number | string;
  finance_goal?: string;
  montly_income?: number | string; // alias legacy
  [k: string]: any;
};

// Credenciales temporales para confirm-email
type PendingCreds = { email: string; password: string } | null;

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ id: string; email: string; requires_confirmation?: boolean }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;

  pendingCreds: PendingCreds;
  setPendingCreds: (c: PendingCreds) => void;
  clearPendingCreds: () => void;

  adoptToken: (tok: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as any);

/* ---------------- helpers de token (compat) ---------------- */
const AUTH_TOKEN_KEYS = ['auth_token', 'token'] as const;

async function getStoredToken(): Promise<string | null> {
  const entries = await AsyncStorage.multiGet([...AUTH_TOKEN_KEYS]);
  const map = Object.fromEntries(entries);
  return (map['auth_token'] as string) || (map['token'] as string) || null;
}
async function setStoredToken(tok: string) {
  await AsyncStorage.multiSet([
    ['auth_token', tok],
    ['token', tok], // compat con código viejo
  ]);
}
async function clearStoredToken() {
  await AsyncStorage.multiRemove([...AUTH_TOKEN_KEYS]);
}

/* ---------------- normalización de usuario ---------------- */
function normalizeUser(u: any | null): User | null {
  if (!u) return null;
  const out: User = { ...u };
  if (out.monthly_income == null && out.montly_income != null) {
    out.monthly_income = out.montly_income;
  }
  return out;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingCreds, setPendingCreds] = useState<PendingCreds>(null);

  // Bootstrap desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [tok, u] = await Promise.all([
          getStoredToken(),
          AsyncStorage.getItem('user'),
        ]);
        setToken(tok);
        setUser(u ? normalizeUser(JSON.parse(u)) : null);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshMe = useCallback(async () => {
    // requiere token válido
    if (!token) return;
    try {
      const me = await api.getProfile();
      const normalized = normalizeUser(me);
      setUser(normalized);
      if (normalized) {
        await AsyncStorage.setItem('user', JSON.stringify(normalized));
      }
    } catch {
      // silencioso
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const emailNorm = email.trim().toLowerCase();
    const res = await api.login({ email: emailNorm, password });
    const tok = res.access_token;

    setToken(tok);
    await setStoredToken(tok);

    // Perfil (si falla usamos res.user)
    const me = await api.getProfile().catch(() => res.user ?? null);
    const normalized = normalizeUser(me);
    setUser(normalized);
    if (normalized) {
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
    }
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string
  ): Promise<{ id: string; email: string; requires_confirmation?: boolean }> => {
    const emailNorm = email.trim().toLowerCase();
    const res = await api.register({ name, email: emailNorm, password });
    // guardamos para auto-login tras confirmar
    setPendingCreds({ email: emailNorm, password });
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout?.().catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      setPendingCreds(null);
      await clearStoredToken();
      await AsyncStorage.removeItem('user');
    }
  }, []);

  // Adoptar token proveniente de deep-link
  const adoptToken = useCallback(async (tok: string) => {
    setToken(tok);
    await setStoredToken(tok);
    try {
      const me = await api.getProfile();
      const normalized = normalizeUser(me);
      setUser(normalized);
      if (normalized) {
        await AsyncStorage.setItem('user', JSON.stringify(normalized));
      }
    } catch {
      // silencioso
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshMe,
    pendingCreds,
    setPendingCreds,
    clearPendingCreds: () => setPendingCreds(null),
    adoptToken,
  }), [user, token, loading, login, register, logout, refreshMe, pendingCreds, adoptToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
