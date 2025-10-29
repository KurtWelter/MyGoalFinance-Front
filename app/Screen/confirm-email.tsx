// app/Screen/confirm-email.tsx
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../store/auth";

export default function ConfirmEmail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pendingCreds, clearPendingCreds, login } = useAuth();

  const [busy, setBusy] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Si no hay credenciales temporales, mandamos al login
  useEffect(() => {
    if (!pendingCreds) router.replace("/Screen/login");
  }, [pendingCreds, router]);

  const doLogin = useCallback(async () => {
    if (!pendingCreds) {
      router.replace("/Screen/login");
      return;
    }
    try {
      setBusy(true);
      await login(pendingCreds.email, pendingCreds.password);
      clearPendingCreds();
      router.replace("/Screen/questionnaire/step1");
    } catch {
      // Silencioso: aún no confirmado
    } finally {
      setBusy(false);
    }
  }, [pendingCreds, login, clearPendingCreds, router]);

  // Botón "Ya confirmé"
  const tryLogin = useCallback(async () => {
    if (!pendingCreds) {
      router.replace("/Screen/login");
      return;
    }
    try {
      setBusy(true);
      await login(pendingCreds.email, pendingCreds.password);
      clearPendingCreds();
      router.replace("/Screen/questionnaire/step1");
    } catch {
      Alert.alert(
        "Aún no confirmado",
        "Revisa tu correo y toca “Ya confirmé” cuando hayas validado tu cuenta."
      );
    } finally {
      setBusy(false);
    }
  }, [pendingCreds, login, clearPendingCreds, router]);

  // 1) Auto-intento cuando volvemos del deep link mygoalfinance://auth/callback
  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => {
      if (!url) return;
      // Si quieres, valida el path: /auth/callback
      // const { path } = Linking.parse(url);
      // if (path === "auth/callback") ...
      doLogin();
    };
    const sub = Linking.addEventListener("url", onUrl);

    // Por si la app se abrió directamente desde el link
    Linking.getInitialURL().then((url) => {
      if (url) onUrl({ url });
    });

    return () => sub.remove();
  }, [doLogin]);

  // 2) Auto-intento suave cuando la app vuelve al primer plano
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") doLogin();
    });
    return () => sub.remove();
  }, [doLogin]);

  // 3) Reintento cada 8s mientras estamos en esta pantalla
  useEffect(() => {
    if (!pendingCreds) return;
    intervalRef.current = setInterval(() => {
      doLogin();
    }, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pendingCreds, doLogin]);

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={{
        flex: 1,
        paddingTop: insets.top + 24,
        paddingBottom: Math.max(16, insets.bottom + 16),
        paddingHorizontal: 24,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
          Confirma tu email
        </Text>

        <Text
          style={{
            color: "#dbe5ff",
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          Te enviamos un enlace de verificación a{" "}
          <Text style={{ fontWeight: "700" }}>
            {pendingCreds?.email ?? "tu correo"}
          </Text>
          . Abre el enlace (se abrirá la app) y, si no entra solo, toca “Ya confirmé”.
        </Text>

        <TouchableOpacity
          onPress={tryLogin}
          disabled={busy}
          style={{
            marginTop: 16,
            backgroundColor: "#1f2a44",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "white", fontWeight: "700" }}>
              Ya confirmé
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            clearPendingCreds();
            router.replace("/Screen/login");
          }}
          style={{ marginTop: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#b9c6e4" }}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
