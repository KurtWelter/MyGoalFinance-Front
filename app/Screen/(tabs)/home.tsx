// app/Screen/(tabs)/home.tsx
import styles from '@/Styles/homeStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../constants/api';

// ✨ NUEVO: UI kit y tema
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ProgressBar from '../../../components/ui/ProgressBar';
import SectionUI from '../../../components/ui/Section';
import { colors } from '../../../constants/theme';

type SummaryMonth = {
  month: string;
  inc: number;
  exp: number;
  net: number;
};

type Rates = { base: 'CLP'; usd: number; eur: number; uf: number; updatedAt: string };
type Article = { id: string; title: string; url: string; source?: string; published_at?: string | null };

// ▼ NUEVO: tipo UI para metas + mapeo
type GoalUI = { id: string; title: string; target: number; current: number };
function mapGoalUI(g: any): GoalUI {
  return {
    id: String(g.id),
    title: g.title || g.name || 'Meta',
    target: Number(g.target_amount ?? 0),
    current: Number(g.current_amount ?? 0),
  };
}

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [sum, setSum] = useState<SummaryMonth | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);
  const [news, setNews] = useState<Article[]>([]);
  // ▼ metas ahora tipadas con GoalUI
  const [goals, setGoals] = useState<GoalUI[]>([]);

  const firstName = useMemo(() => {
    const n = profile?.name || '';
    return n.split(' ')[0] || '¡Hola!';
  }, [profile]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const [p, s, r, nf, g] = await Promise.allSettled([
        api.getProfile(),
        api.summaryMonth(),           // KPIs mes actual
        api.newsRates(),              // USD/EUR/UF
        api.newsFeed(),               // últimas noticias
        api.listGoals(),              // metas del usuario
      ]);

      if (p.status === 'fulfilled') setProfile(p.value);
      if (s.status === 'fulfilled') {
        const { inc = 0, exp = 0, month } = s.value as any;
        // ✅ Neto “real” para la UI: ingresos - |gastos|
        const netUi = Number(inc) - Math.abs(Number(exp));
        setSum({ inc: Number(inc), exp: Number(exp), net: netUi, month });
      }
      if (r.status === 'fulfilled') setRates(r.value as Rates);
      if (nf.status === 'fulfilled') setNews((nf.value as Article[]).slice(0, 3));
      if (g.status === 'fulfilled') {
        const arr = (g.value as any[] | undefined) ?? [];
        setGoals(arr.slice(0, 3).map(mapGoalUI)); // ← mapeo a UI + limit 3
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {/* Header */}
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        <View>
          <Text style={styles.brand}>MyGoalFinance</Text>
          <Text style={styles.h1}>¡Hola, {firstName}! 👋</Text>
          <Text style={styles.subtitle}>Tu panel de control financiero</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPIs */}
        <View style={styles.row}>
          <KpiCard label="Ingresos" value={sum?.inc ?? 0} color="#26c281" icon="arrow-down-circle" />
          <KpiCard label="Gastos" value={sum?.exp ?? 0} color="#ff5a5f" icon="arrow-up-circle" />
          <KpiCard label="Neto" value={sum?.net ?? 0} color="#4dabf7" icon="wallet" />
        </View>

        {/* Rates */}
        <View style={styles.row}>
          <RateCard title="Dólar (USD)" value={rates?.usd} hint="1 CLP → USD" />
          <RateCard title="Euro (EUR)" value={rates?.eur} hint="1 CLP → EUR" />
          <RateCard title="UF" value={rates?.uf} hint={rates ? `Act: ${new Date(rates.updatedAt).toLocaleDateString()}` : ''} />
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickButton label="Añadir mov." icon="add-circle" onPress={() => router.push('/Screen/(tabs)/transactions')} />
          <QuickButton label="Chatbot" icon="chatbubble-ellipses" onPress={() => router.push('/Screen/(tabs)/chatbot')} />
          <QuickButton label="Metas" icon="flag" onPress={() => router.push('/Screen/(tabs)/goals')} />
        </View>

        {/* Goals preview – NUEVO BLOQUE usando el UI kit */}
        <SectionUI
          title="Tus metas"
          action={
            <Button variant="link" onPress={() => router.push('/Screen/(tabs)/goals')}>
              Ver metas
            </Button>
          }
        >
          {busy ? (
            <Card><Text style={{ color: '#94a3b8' }}>Cargando…</Text></Card>
          ) : goals.length === 0 ? (
            <Card>
              <Text style={{ color: '#94a3b8' }}>
                Aún no tienes metas activas. ¡Crea una para empezar!
              </Text>
            </Card>
          ) : (
            goals.map((g) => (
              <GoalTile
                key={g.id}
                goal={g}
                onPress={() => router.push('/Screen/(tabs)/goals')}
              />
            ))
          )}
        </SectionUI>

        {/* News preview (sigue usando tu Section local) */}
        <Section
          title="Noticias financieras"
          actionLabel="Ver noticias"
          onAction={() => router.push('/Screen/(tabs)/news')}
        >
          {busy ? (
            <Loader />
          ) : news.length === 0 ? (
            <Empty text="No hay noticias por ahora." />
          ) : (
            news.map((n) => (
              <Pressable key={n.id} onPress={() => Linking.openURL(n.url)} style={styles.newsItem}>
                <Text style={styles.newsTitle}>{n.title}</Text>
                <Text style={styles.newsMeta}>{n.source || 'Fuente'} · {n.published_at ? new Date(n.published_at).toLocaleString() : ''}</Text>
                <Text style={styles.newsLink}>Abrir</Text>
              </Pressable>
            ))
          )}
        </Section>

        {/* Bottom padding para tabs */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------- UI helpers ----------------------------- */

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{formatCLP(value)}</Text>
    </View>
  );
}

function RateCard({ title, value, hint }: { title: string; value?: number | null; hint?: string }) {
  return (
    <View style={styles.rate}>
      <Text style={styles.rateTitle}>{title}</Text>
      <Text style={styles.rateValue}>{value != null ? formatRate(value) : '—'}</Text>
      {!!hint && <Text style={styles.rateHint}>{hint}</Text>}
    </View>
  );
}

function QuickButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <Ionicons name={icon} size={22} color="#1f2738" />
      <Text style={styles.quickTxt}>{label}</Text>
    </Pressable>
  );
}

function Section({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTop}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

function Loader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator />
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTxt}>{text}</Text>
    </View>
  );
}

/* ------------------------------ helpers ------------------------------ */

function formatCLP(n: number) {
  try {
    return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n)}`;
  }
}
function formatRate(n: number) {
  // n: valor unitario (ej: 0.001051 USD por CLP)
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 3 });
  if (n >= 1) return n.toFixed(3);
  return n.toPrecision(3);
}

/* --------------------------- Goal tile (nuevo) --------------------------- */
function GoalTile({ goal, onPress }: { goal: GoalUI; onPress: () => void }) {
  const title = goal.title;
  const target = goal.target;
  const current = goal.current;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <Card>
      <Pressable onPress={onPress} style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' as const }}>{title}</Text>
        <Text style={{ color: '#cbd5e1' }}>
          Progreso: {formatCLP(current)} / {formatCLP(target)}
        </Text>
        <ProgressBar value={pct} />
        <Text style={{ color: '#94a3b8' }}>{pct}% completado</Text>
      </Pressable>
    </Card>
  );
}
