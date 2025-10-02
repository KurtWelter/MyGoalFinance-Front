// store/auth.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import api from '../constants/api';

type User = {
  id?: string;
  email: string;
  name?: string;
  age_range?: string;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  montly_income?: number;
  finance_goal?: string;
  [k: string]: any;
};

// Credenciales temporales (solo en memoria) para confirm-email
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
};

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado temporal (NO persistente) para confirmación de email
  const [pendingCreds, setPendingCreds] = useState<PendingCreds>(null);

  // Bootstrap de sesión desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [[, t], [, u]] = await AsyncStorage.multiGet(['token', 'user']);
        setToken(t ?? null);
        setUser(u ? JSON.parse(u) : null);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const tok = res.access_token;
    setToken(tok);
    await AsyncStorage.setItem('token', tok);

    // Normaliza el "user" con el perfil completo del backend
    const me = await api.getProfile().catch(() => null);
    const toStore: User | null = (me as User) ?? (res.user as User) ?? null;

    setUser(toStore);
    if (toStore) {
      await AsyncStorage.setItem('user', JSON.stringify(toStore));
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ id: string; email: string; requires_confirmation?: boolean }> => {
    const res = await api.register({ name, email, password });
    return res;
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const me = await api.getProfile();
      setUser(me);
      await AsyncStorage.setItem('user', JSON.stringify(me));
    } catch {
      // Silencioso: si falla, mantenemos el user actual
    }
  };

  const logout = async () => {
    try {
      // Opcional: notificar al backend (si falla igual limpiamos local)
      await api.logout?.().catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      setPendingCreds(null); // limpiar flujo pendiente de confirm-email
      await AsyncStorage.multiRemove(['token', 'user']);
    }
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
