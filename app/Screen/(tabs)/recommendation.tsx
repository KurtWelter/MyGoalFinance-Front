import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../constants/api';
import styles, { ACCENT, FG } from '../../../Styles/recommendationStyles';

type Rec = { id?: string | number; title: string; description: string; tag?: string };

const FALLBACK: Rec[] = [
  {
    title: 'Crea un fondo de emergencia',
    description: 'Ahorra 3–6 meses de gastos en una cuenta líquida.',
    tag: 'emergency',
  },
  {
    title: 'Activa ahorro automático',
    description: 'Transfiere el 10–20% de tu ingreso cada mes.',
    tag: 'autosave',
  },
  {
    title: 'Optimiza tu cartera',
    description: 'Rebalancea periódicamente y revisa costos.',
    tag: 'portfolio',
  },
  {
    title: 'Plan de ahorro',
    description: 'Define una meta SMART y usa cuentas con mejor rendimiento.',
    tag: 'plan',
  },
];

export default function RecommendationScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [items, setItems] = useState<Rec[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        const res = await api.listRecommendations().catch(() => []);
        const mapped: Rec[] = Array.isArray(res)
          ? res.map((r: any, i: number) => ({
              id: r.id ?? i,
              title: r.title ?? r.name ?? 'Sugerencia',
              description: r.description ?? r.detail ?? '',
              tag: r.tag ?? guessTag(r.title ?? r.name ?? ''),
            }))
          : [];
        setItems(mapped.length ? mapped : FALLBACK);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const headerSubtitle = useMemo(
    () => 'Basadas en tu perfil y objetivos.',
    []
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        <Text style={styles.brand}>MyGoalFinance</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="bulb" size={26} color={FG} />
          <Text style={styles.h1}>Recomendaciones</Text>
        </View>
        <Text style={styles.subtitle}>{headerSubtitle}</Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {busy ? (
          <View style={styles.loader}>
            <ActivityIndicator />
          </View>
        ) : (
          items.map((r, i) => <RecCard key={String(r.id ?? i)} rec={r} />)
        )}

        <Pressable style={styles.cta} onPress={() => router.replace('/Screen/(tabs)/home')}>
          <Ionicons name="arrow-back" size={18} color="#1f2738" />
          <Text style={styles.ctaText}>Volver al Home</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------- UI -------------------- */

function RecCard({ rec }: { rec: Rec }) {
  const icon = pickIcon(rec.tag, rec.title);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={ACCENT} />
        </View>
        <Text style={styles.cardTitle}>{rec.title}</Text>
      </View>
      <Text style={styles.cardDesc}>{rec.description}</Text>
    </View>
  );
}

/* ----------------- helpers ----------------- */

function pickIcon(tag?: string, title?: string): keyof typeof Ionicons.glyphMap {
  const t = (tag || title || '').toLowerCase();
  if (t.includes('emerg')) return 'shield-checkmark';
  if (t.includes('auto')) return 'repeat';
  if (t.includes('cartera') || t.includes('portaf') || t.includes('portfolio')) return 'pie-chart';
  if (t.includes('plan')) return 'flag';
  if (t.includes('ahorro') || t.includes('save')) return 'wallet';
  return 'sparkles';
}
function guessTag(title: string) {
  return pickIcon(undefined, title);
}
