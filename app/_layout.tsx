import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../store/auth';

function AuthGate() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // 👇 Forzamos a string para evitar el error TS2367
  const s0 = String(segments[0] ?? '');
  const s1 = String(segments[1] ?? '');
  const s2 = String(segments[2] ?? ''); // por si lo necesitas

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
      // Caso especial: venimos de confirmar email → ir al cuestionario
      if (s0 === 'Screen' && s1 === 'confirm-email') {
        router.replace('/Screen/questionnaire/step1');
        return;
      }
      // Si está en login/register → ir a Home
      if (s0 === 'Screen' && (s1 === 'login' || s1 === 'register')) {
        router.replace('/Screen/(tabs)/home');
        return;
      }
      // Si ya está en tabs o questionnaire, no hacer nada
    }
  // usa s0/s1 (ya son strings) para que se reactive bien
  }, [s0, s1, token, loading, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
