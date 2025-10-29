// app/auth/callback.tsx
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../../store/auth';

function parseParams(url: string) {
  const out: Record<string, string> = {};
  if (!url) return out;

  const pull = (s?: string | null) => {
    if (!s) return;
    const str = s.replace(/^[?#]/, '');
    for (const pair of str.split('&')) {
      if (!pair) continue;
      const [k, ...rest] = pair.split('=');
      out[decodeURIComponent(k)] = decodeURIComponent(rest.join('=') || '');
    }
  };

  // RN soporta URL, pero por si acaso hacemos parsing manual
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');
  if (qIndex >= 0) pull(url.slice(qIndex));
  if (hIndex >= 0) pull(url.slice(hIndex));
  return out;
}

export default function AuthCallback() {
  const router = useRouter();
  const { pendingCreds, login, adoptToken } = useAuth();
  const [msg, setMsg] = useState('Procesando confirmación…');

  useEffect(() => {
    let sub: any;
    (async () => {
      // 1) URL inicial (cuando abre por deep-link)
      const initial = await Linking.getInitialURL();
      const params = parseParams(initial || '');

      const goNext = () => {
        // Ajusta esta ruta si tu cuestionario vive en otra:
        router.replace('/Screen/questionnaire/step1');
      };

      // 2) Errores
      if (params.error || params.error_code) {
        setMsg('El enlace es inválido o expiró. Intenta iniciar sesión.');
        return;
      }

      // 3) Si viene access_token desde Supabase → adoptarlo directo
      if (params.access_token) {
        await adoptToken(params.access_token);
        setMsg('Cuenta confirmada. Entrando…');
        goNext();
        return;
      }

      // 4) Fallback: si guardaste credenciales tras el registro, loguéate
      if (pendingCreds?.email && pendingCreds?.password) {
        try {
          setMsg('Confirmado. Iniciando sesión…');
          await login(pendingCreds.email, pendingCreds.password);
          goNext();
          return;
        } catch {
          setMsg('Confirmado, pero no se pudo iniciar sesión automáticamente.');
          return;
        }
      }

      setMsg('Confirmado. Abre la app e inicia sesión.');
    })();

    // (Opcional) por si la pantalla ya estaba abierta y vuelve a llegar un link
    sub = Linking.addEventListener('url', (e) => {
      const params = parseParams(e.url);
      if (params.access_token) {
        adoptToken(params.access_token).then(() => {
          router.replace('/Screen/questionnaire/step1');
        });
      }
    });

    return () => {
      sub?.remove?.();
    };
  }, [adoptToken, login, pendingCreds, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 16, textAlign: 'center' }}>{msg}</Text>
    </View>
  );
}
