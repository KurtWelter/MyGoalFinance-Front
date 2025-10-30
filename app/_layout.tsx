// app/_layout.tsx
import '../i18n'; // i18n debe estar listo antes de renderizar cualquier pantalla

import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, View } from 'react-native';

import { AuthProvider, useAuth } from '../store/auth';
import { registerForPush } from '../utils/registerPush';

/* ─────────────────────────────────────────────
   Handler global de notificaciones
   (incluye props iOS: shouldShowBanner / shouldShowList)
   ───────────────────────────────────────────── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // iOS (tipado NotificationBehavior):
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* ─────────────────────────────────────────────
   Helpers deep link (Supabase emailRedirectTo)
   mygoalfinance://auth/callback#access_token=...&refresh_token=...
   mygoalfinance://auth/callback?access_token=...
   ───────────────────────────────────────────── */
function getParamFromHash(url: string, key: string) {
  try {
    const hash = url.split('#')[1] || '';
    const sp = new URLSearchParams(hash);
    return sp.get(key);
  } catch {
    return null;
  }
}
function getParam(url: string, key: string) {
  try {
    const u = new URL(url);
    return u.searchParams.get(key) || getParamFromHash(url, key);
  } catch {
    return getParamFromHash(url, key);
  }
}

function useDeepLinkAuth() {
  const router = useRouter();
  const { adoptToken } = useAuth();

  useEffect(() => {
    const handler = async ({ url }: { url: string }) => {
      const tok = getParam(url, 'access_token');
      if (tok) {
        try {
          await adoptToken(tok);
          router.replace('/Screen/questionnaire/step1');
        } catch {
          router.replace('/Screen/login');
        }
      }
    };

    // URL inicial (si la app fue abierta con deep link)
    Linking.getInitialURL()
      .then((u) => {
        if (u) handler({ url: u });
      })
      .catch(() => {});

    // Listener en caliente
    const sub = Linking.addEventListener('url', handler);
    return () => sub.remove();
  }, [adoptToken, router]);
}

/* ─────────────────────────────────────────────
   OTA Updates: chequea y aplica update al abrir
   y cada vez que la app vuelve al foreground.
   ───────────────────────────────────────────── */
function useAutoUpdates() {
  useEffect(() => {
    const check = async () => {
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // silencioso
      }
    };
    check();

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, []);
}

function AuthGate() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Activa listeners globales
  useDeepLinkAuth();
  useAutoUpdates();

  // Registrar push SOLO cuando ya hay token de usuario
  useEffect(() => {
    if (!token) return;
    registerForPush(token).catch((e) => {
      console.log('[push] register failed:', e?.message || e);
    });
  }, [token]);

  // Forzamos a string para reactividad confiable
  const s0 = String(segments[0] ?? '');
  const s1 = String(segments[1] ?? '');

  useEffect(() => {
    if (loading) return;

    const inTabs = s0 === 'Screen' && s1 === '(tabs)';
    const isAuthScreen =
      s0 === 'Screen' && (s1 === 'login' || s1 === 'register' || s1 === 'confirm-email');

    // Sin token: bloquear tabs
    if (!token && inTabs) {
      router.replace('/Screen/login');
      return;
    }

    // Con token:
    if (token) {
      if (s0 === 'Screen' && s1 === 'confirm-email') {
        router.replace('/Screen/questionnaire/step1');
        return;
      }
      if (isAuthScreen) {
        router.replace('/Screen/(tabs)/home');
        return;
      }
    }
  }, [s0, s1, token, loading, router]);

  // (Opcional) loader mientras arranca
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    // Android: crea el canal de notificaciones una vez
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
