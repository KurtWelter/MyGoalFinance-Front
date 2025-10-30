// app/Screen/(tabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../../constants/api';
import { useAuth } from '../../../store/auth';
import styles from '../../../Styles/homeStyles';

type SummaryMonth = {
  month: string;
  from: string;
  to: string;
  inc: number;
  exp: number;
  net: number;
};
type Rates = { base: 'CLP'; usd: number; eur: number; uf: number; updatedAt: string };
type Article = { id: string; title: string; url: string; source?: string; published_at?: string | null };
type Goal = {
  id: number | string;
  title: string;
  current_amount: number;
  target_amount: number;
  deadline?: string | null;
};

function formatCLP(n: number) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
  } catch {
    const sign = n < 0 ? '-' : '';
    const v = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}$${v}`;
  }
}

function yyyymm(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [summary, setSummary] = useState<SummaryMonth | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);
  const [news, setNews] = useState<Article[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  const greetName = useMemo(() => {
    const raw = (user?.name || user?.email || 'Amigo').trim();
    return raw.split(' ')[0];
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, ratesRes, newsRes, goalsRes] = await Promise.allSettled([
        api.summaryMonth({ month: yyyymm() }),
        api.newsRates(),
        api.newsFeed(),
        api.listGoals(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value as any);
      if (ratesRes.status === 'fulfilled') setRates(ratesRes.value as any);
      if (newsRes.status === 'fulfilled') setNews(newsRes.value as any);
      if (goalsRes.status === 'fulfilled') setGoals((goalsRes.value as any).slice(0, 3));
    } catch (e: any) {
      Alert.alert('Ups', e?.message || 'No se pudo cargar el Home');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onOpenLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('No se pudo abrir', url);
    });
  };

  const pct = (g: Goal) => {
    const total = Number(g.target_amount) || 0;
    const curr = Number(g.current_amount) || 0;
    if (total <= 0) return 0;
    const p = (curr / total) * 100;
    return Math.max(0, Math.min(100, p));
  };

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>MyGoalFinance</Text>
        <Text style={styles.h1}>
          {t('home.hello', { defaultValue: 'Hola' })}{' '}
          <Text style={{ color: '#f3b34c' }}>{greetName}</Text>
        </Text>
        <Text style={styles.subtitle}>
          {t('home.subtitle', { defaultValue: 'Tu resumen al día' })}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor="#fff" />
        }
      >
        {/* KPIs */}
        <View style={styles.row}>
          <View style={styles.kpi}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#163c2a' }]}>
              <Ionicons name="trending-up" size={18} color="#38d39f" />
            </View>
            <Text style={styles.kpiLabel}>{t('dashboard.income', { defaultValue: 'Ingresos' })}</Text>
            <Text style={[styles.kpiValue, { color: '#e7ffe0' }]}>
              {formatCLP(summary?.inc || 0)}
            </Text>
          </View>

          <View style={styles.kpi}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#40202b' }]}>
              <Ionicons name="trending-down" size={18} color="#ff5b87" />
            </View>
            <Text style={styles.kpiLabel}>{t('dashboard.expenses', { defaultValue: 'Gastos' })}</Text>
            <Text style={[styles.kpiValue, { color: '#ffd6e1' }]}>
              {formatCLP(summary?.exp || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.kpi, { flex: 1 }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#2f2940' }]}>
              <Ionicons name="cash" size={18} color="#c6b5ff" />
            </View>
            <Text style={styles.kpiLabel}>{t('dashboard.net', { defaultValue: 'Neto' })}</Text>
            <Text style={[styles.kpiValue, { color: '#e8e3ff' }]}>
              {formatCLP(summary?.net || 0)}
            </Text>
          </View>

          {/* Rates */}
          <View style={styles.rate}>
            <Text style={styles.rateTitle}>USD / EUR / UF</Text>
            <Text style={styles.rateValue}>
              {rates
                ? `$${Math.round(rates.usd)} / €${Math.round(rates.eur)} / UF ${rates.uf.toFixed(2)}`
                : '—'}
            </Text>
            {!!rates?.updatedAt && (
              <Text style={styles.rateHint}>
                {t('home.updated', { defaultValue: 'Actualizado:' })}{' '}
                {new Date(rates.updatedAt).toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>{t('home.quickActions', { defaultValue: 'Accesos rápidos' })}</Text>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/Screen/(tabs)/chatbot')}
            >
              <Ionicons name="chatbubbles" size={18} color="#1f2738" />
              <Text style={styles.quickTxt}>{t('home.chatbot', { defaultValue: 'Chatbot' })}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/Screen/(tabs)/transactions')}
            >
              <Ionicons name="add-circle" size={18} color="#1f2738" />
              <Text style={styles.quickTxt}>{t('home.addMovement', { defaultValue: 'Agregar mov.' })}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/Screen/goals')}
            >
              <Ionicons name="trophy" size={18} color="#1f2738" />
              <Text style={styles.quickTxt}>{t('tabs.goals', { defaultValue: 'Metas' })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals Preview */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>{t('home.goalsPreview', { defaultValue: 'Tus metas' })}</Text>
            <TouchableOpacity onPress={() => router.push('/Screen/goals')}>
              <Text style={styles.sectionAction}>{t('home.seeGoals', { defaultValue: 'Ver todas' })}</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>{t('home.noGoals', { defaultValue: 'Aún no tienes metas creadas.' })}</Text>
            </View>
          ) : (
            goals.map((g) => {
              const progress = pct(g);
              return (
                <View key={String(g.id)} style={styles.tile}>
                  <Text style={styles.tileTitle}>{g.title}</Text>
                  <Text style={styles.tileSubtitle}>
                    {formatCLP(g.current_amount)} / {formatCLP(g.target_amount)}
                  </Text>
                  <View style={{ height: 8, borderRadius: 6, backgroundColor: '#0f1420', marginTop: 10, overflow: 'hidden' }}>
                    <View style={{ width: `${progress}%`, height: 8, backgroundColor: '#f3b34c' }} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* News */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>{t('tabs.news', { defaultValue: 'Noticias' })}</Text>
          </View>

          {news.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>{t('home.noNews', { defaultValue: 'Sin noticias por ahora.' })}</Text>
            </View>
          ) : (
            news.map((n) => (
              <TouchableOpacity
                key={n.id}
                onPress={() => onOpenLink(n.url)}
                style={styles.newsItem}
                activeOpacity={0.8}
              >
                <Text style={styles.newsTitle}>{n.title}</Text>
                <Text style={styles.newsMeta}>
                  {(n.source || '').trim()} •{' '}
                  {n.published_at ? new Date(n.published_at).toLocaleString() : t('home.justNow', { defaultValue: 'recién' })}
                </Text>
                <Text style={styles.newsLink}>{t('home.open', { defaultValue: 'Abrir' })} ↗</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {loading ? <View style={styles.loader}><Text style={styles.emptyTxt}>Cargando…</Text></View> : null}
      </ScrollView>
    </View>
  );
}
