import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../../components/ui/Header";
import api from "../../../constants/api";
import { useAuth } from "../../../store/auth";
import styles from "../../../Styles/homeStyles";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshMe } = useAuth();

  // Estado UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Datos
  const [goalsCount, setGoalsCount] = useState<number | null>(null);
  const [recsCount, setRecsCount] = useState<number | null>(null);
  const [monthSpend, setMonthSpend] = useState<number | null>(null);

  // Helpers de fecha (primer/último día del mes actual en YYYY-MM)
  const range = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    // si tu backend usa year-month, manda "YYYY-MM"
    return { from: `${yyyy}-${mm}`, to: `${yyyy}-${mm}` };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // 1) Asegura user actualizado
      await refreshMe();

      // 2) Metas
      const goals = await api.listGoals();
      setGoalsCount(Array.isArray(goals) ? goals.length : 0);

      // 3) Recomendaciones
      const recs = await api.listRecommendations();
      setRecsCount(Array.isArray(recs) ? recs.length : 0);

      // 4) Transacciones del mes (suma gastos)
      const txs = await api.listTransactions({ from: range.from, to: range.to });
      const spend = (Array.isArray(txs) ? txs : []).reduce((acc, t: any) => {
        // Asumimos gastos negativos o un flag category/type
        const amount = Number(t.amount ?? 0);
        // Si tus gastos vienen positivos con type='expense', ajusta esta línea:
        return amount < 0 ? acc + Math.abs(amount) : acc;
      }, 0);
      setMonthSpend(spend);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo cargar tu panel");
    } finally {
      setLoading(false);
    }
  }, [refreshMe, range.from, range.to]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        if (!mounted) return;
        await load();
      })();
      return () => {
        mounted = false;
      };
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const userName =
    user?.name?.trim?.() ||
    (user?.email ? user.email.split("@")[0] : "Usuario");

  return (
    <LinearGradient colors={["#f5f7fa", "#172e53ff"]} style={styles.container}>
      {/* Header personalizado (usa nombre real) */}
      <Header userName={userName} />

      {/* Contenido principal */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Bienvenida */}
        <View style={styles.header}>
          <Text style={styles.welcome}>¡Hola, {userName}! 👋</Text>
          <Text style={styles.subtitle}>Este es tu panel de control financiero</Text>
        </View>

        {/* Card Metas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tus Metas 🎯</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.cardText}>
              {goalsCount === null
                ? "—"
                : `Actualmente tienes ${goalsCount} meta${(goalsCount ?? 0) === 1 ? "" : "s"} activ${(goalsCount ?? 0) === 1 ? "a" : "as"}. ¡Sigue adelante!`}
            </Text>
          )}
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/goals")}
          >
            <Text style={styles.cardButtonText}>Ver metas</Text>
          </TouchableOpacity>
        </View>

        {/* Card Recomendaciones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recomendaciones 💡</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.cardText}>
              {recsCount === null
                ? "—"
                : `Tienes ${recsCount} recomendación${(recsCount ?? 0) === 1 ? "" : "es"} nuevas.`}
            </Text>
          )}
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/recommendation")}
          >
            <Text style={styles.cardButtonText}>Ver recomendaciones</Text>
          </TouchableOpacity>
        </View>

        {/* Card Resumen */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen 📊</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.cardText}>
              Tus gastos este mes:{" "}
              {monthSpend === null ? "—" : `$${monthSpend.toLocaleString("es-CL")} CLP`}
            </Text>
          )}
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/recap")}
          >
            <Text style={styles.cardButtonText}>Ver resumen</Text>
          </TouchableOpacity>
        </View>

        {/* Card Noticias */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Noticias Financieras 📰</Text>
          <Text style={styles.cardText}>Últimas noticias del mercado...</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/news")}
          >
            <Text style={styles.cardButtonText}>Ver más noticias</Text>
          </TouchableOpacity>
        </View>

        {/* Card Chatbot */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Asistente Financiero 🤖</Text>
          <Text style={styles.cardText}>
            Haz tus consultas rápidas aquí o abre el asistente completo.
          </Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/chatbot")}
          >
            <Text style={styles.cardButtonText}>Abrir Chatbot</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
