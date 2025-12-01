import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // 👈 NUEVO
import { Image } from 'expo-image';
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

// 👇 tipo alineado con lo que devuelve el backend (Excel + Webpay)
type SummaryMonth = {
  month: string;
  from: string;
  to: string;

  // Solo Excel (importación)
  inc: number;
  exp: number;
  net: number;

  // Wallet (Webpay / retiros)
  deposits?: number;
  withdrawals?: number;
  account_balance?: number;

  // aliases por compatibilidad (Excel)
  inc_excel?: number;
  exp_excel?: number;
  net_excel?: number;
};

type Article = {
  id: string;
  title: string;
  url: string;
  source?: string;
  published_at?: string | null;
};

type Goal = {
  id: number | string;
  title: string;
  current_amount: number;
  target_amount: number;
  deadline?: string | null;
};

type MonthlyPoint = {
  label: string;
  inc: number;
  exp: number;
};

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function formatCLP(n: number) {
  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    const sign = n < 0 ? '-' : '';
    const v = Math.abs(Math.round(n))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}$${v}`;
  }
}

// esta queda por si la quieres usar después para vistas compactas
function formatCompactCLP(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  try {
    const fmt = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return fmt.format(n);
  } catch {
    if (abs >= 1_000_000) {
      return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}$${(abs / 1_000).toFixed(0)}K`;
    }
    return formatCLP(n);
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
  const [news, setNews] = useState<Article[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

  const [monthlySeries, setMonthlySeries] = useState<MonthlyPoint[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth() // 0-11
  );

  const greetName = useMemo(() => {
    const raw = (user?.name || user?.email || 'Amigo').trim();
    return raw.split(' ')[0];
  }, [user]);

  const avatarUrl = (user as any)?.avatar_url || '';
  const resolvedAvatar =
    avatarUrl || `https://i.pravatar.cc/150?u=${user?.email || greetName}`;

  const maxMonthlyValue = useMemo(
    () =>
      monthlySeries.length
        ? Math.max(
            ...monthlySeries.flatMap((p) => [p.inc || 0, p.exp || 0])
          ) || 1
        : 1,
    [monthlySeries]
  );

  const selectedPoint =
    monthlySeries.length > 0 && selectedMonthIndex < monthlySeries.length
      ? monthlySeries[selectedMonthIndex]
      : null;

  // 👇 KPIs de la wallet (Webpay)
  const walletDeposits = summary?.deposits ?? 0;
  const walletWithdrawals = summary?.withdrawals ?? 0;
  const walletNet = walletDeposits - walletWithdrawals;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthsForYear: string[] = [];
      for (let m = 0; m < 12; m++) {
        const mm = String(m + 1).padStart(2, '0');
        monthsForYear.push(`${selectedYear}-${mm}`);
      }

      const [sumRes, newsRes, goalsRes, seriesRes] =
        await Promise.allSettled([
          api.summaryMonth({ month: yyyymm() }), // KPIs mes actual
          api.newsFeed(),
          api.listGoals(),
          Promise.all(
            monthsForYear.map((m) => api.summaryMonth({ month: m }))
          ),
        ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value as any);
      if (newsRes.status === 'fulfilled') setNews(newsRes.value as any);
      if (goalsRes.status === 'fulfilled')
        setGoals((goalsRes.value as any).slice(0, 3));

      if (seriesRes.status === 'fulfilled') {
        const raw = seriesRes.value as SummaryMonth[];
        const serie: MonthlyPoint[] = raw.map((item, idx) => ({
          label: MONTH_LABELS[idx] ?? `${idx + 1}`,
          // 👇 gráfico = solo Excel
          inc: item?.inc || 0,
          exp: item?.exp || 0,
        }));
        setMonthlySeries(serie);
      } else {
        setMonthlySeries([]);
      }
    } catch (e: any) {
      Alert.alert('Ups', e?.message || 'No se pudo cargar el Home');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // ✅ Se ejecuta cada vez que el Home gana foco (cuando vuelves desde otra pestaña)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // (opcional) primera carga al montar, por si la pantalla ya está enfocada
  useEffect(() => {
    load();
  }, [load]);

  const onOpenLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('No se pudo abrir', url));
  };

  const pct = (g: Goal) => {
    const total = Number(g.target_amount) || 0;
    const curr = Number(g.current_amount) || 0;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, (curr / total) * 100));
  };

  return (
    <View style={styles.safe}>
      {/* Header con avatar del perfil */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={18} color="#1f2738" />
            </View>
            <Text style={styles.headerName}>{greetName}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#e8edf7"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color="#e8edf7"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/Screen/(tabs)/profile')}
            >
              <Image
                source={{ uri: resolvedAvatar }}
                style={styles.headerAvatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {t('home.subtitle', { defaultValue: 'Tu resumen al día' })}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* KPIs: ahora muestran solo Webpay/Retiros/Neto */}
        <View style={styles.row}>
          <View style={styles.kpi}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#163c2a' }]}>
              <Ionicons name="trending-up" size={18} color="#38d39f" />
            </View>
            <Text style={styles.kpiLabel}>Ingresos</Text>
            <Text style={[styles.kpiValue, { color: '#e7ffe0' }]}>
              {formatCLP(walletDeposits)}
            </Text>
          </View>

          <View style={styles.kpi}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#40202b' }]}>
              <Ionicons name="trending-down" size={18} color="#ff5b87" />
            </View>
            <Text style={styles.kpiLabel}>Gastos</Text>
            <Text style={[styles.kpiValue, { color: '#ffd6e1' }]}>
              {formatCLP(walletWithdrawals)}
            </Text>
          </View>

          <View style={styles.kpi}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#2f2940' }]}>
              <Ionicons name="wallet" size={18} color="#c6b5ff" />
            </View>
            <Text style={styles.kpiLabel}>Neto</Text>
            <Text style={[styles.kpiValue, { color: '#e8e3ff' }]}>
              {formatCLP(walletNet)}
            </Text>
          </View>
        </View>

        {/* Selector de año + gráfico Ingresos/Gastos (Excel) */}
        <View style={styles.section}>
          <View style={styles.yearRow}>
            <TouchableOpacity
              style={styles.yearArrow}
              onPress={() => setSelectedYear((prev) => prev - 1)}
            >
              <Ionicons name="chevron-back" size={16} color="#e8edf7" />
            </TouchableOpacity>

            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearChip,
                  selectedYear === year && styles.yearChipActive,
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text
                  style={[
                    styles.yearText,
                    selectedYear === year && styles.yearTextActive,
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.yearArrow}
              onPress={() => setSelectedYear((prev) => prev + 1)}
            >
              <Ionicons name="chevron-forward" size={16} color="#e8edf7" />
            </TouchableOpacity>
          </View>

          <Text style={styles.chartSubtitle}>
            Ingresos y gastos por mes (Año {selectedYear})
          </Text>

          <View style={styles.chartCard}>
            {monthlySeries.length === 0 || maxMonthlyValue <= 0 ? (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyText}>
                  Aún no hay datos para este año.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.chartRow}>
                  {monthlySeries.map((p, idx) => {
                    const isActive = idx === selectedMonthIndex;
                    const incHeight =
                      p.inc > 0 ? (p.inc / maxMonthlyValue) * 110 : 0;
                    const expHeight =
                      p.exp > 0 ? (p.exp / maxMonthlyValue) * 110 : 0;

                    return (
                      <TouchableOpacity
                        key={p.label}
                        style={styles.chartCol}
                        activeOpacity={0.8}
                        onPress={() => setSelectedMonthIndex(idx)}
                      >
                        {/* barras sin números encima */}
                        <View style={styles.chartBarsPair}>
                          <View style={styles.chartBarWrap}>
                            <View
                              style={[
                                styles.chartBarIncome,
                                {
                                  height: incHeight || 4,
                                  opacity: isActive ? 1 : 0.35,
                                },
                              ]}
                            />
                          </View>
                          <View style={styles.chartBarWrap}>
                            <View
                              style={[
                                styles.chartBarExpense,
                                {
                                  height: expHeight || 4,
                                  opacity: isActive ? 1 : 0.35,
                                },
                              ]}
                            />
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.chartLabel,
                            isActive && styles.chartLabelActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedPoint && (
                  <View style={styles.chartDetail}>
                    <Text style={styles.chartDetailTitle}>
                      Detalle {selectedPoint.label} {selectedYear}
                    </Text>
                    <View style={styles.chartDetailRow}>
                      <Text style={styles.chartDetailIncome}>
                        Ingresos: {formatCLP(selectedPoint.inc)}
                      </Text>
                      <Text style={styles.chartDetailExpense}>
                        Gastos: {formatCLP(selectedPoint.exp)}
                      </Text>
                      <Text style={styles.chartDetailNet}>
                        Neto:{' '}
                        {formatCLP(selectedPoint.inc - selectedPoint.exp)}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Accesos rápidos */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>
              {t('home.quickActions', {
                defaultValue: 'Accesos rápidos',
              })}
            </Text>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/Screen/(tabs)/chatbot')}
            >
              <Ionicons name="chatbubbles" size={18} color="#1f2738" />
              <Text style={styles.quickTxt}>
                {t('home.chatbot', { defaultValue: 'Chatbot' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/Screen/(tabs)/transactions')}
            >
              <Ionicons name="add-circle" size={18} color="#1f2738" />
              <Text style={styles.quickTxt}>
                {t('home.addMovement', { defaultValue: 'Agregar mov.' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/Screen/goals')}
            >
              <Ionicons name="trophy" size={18} color="#1f2738" />
              <Text style={styles.quickTxt}>
                {t('tabs.goals', { defaultValue: 'Metas' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tus metas activas */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Tus metas activas</Text>
            <TouchableOpacity onPress={() => router.push('/Screen/goals')}>
              <Text style={styles.sectionAction}>Ver metas</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>Aún no tienes metas creadas.</Text>
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
                  <View
                    style={{
                      height: 8,
                      borderRadius: 6,
                      backgroundColor: '#0f1420',
                      marginTop: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${progress}%`,
                        height: 8,
                        backgroundColor: '#f3b34c',
                      }}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Noticias */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Noticias</Text>
          </View>
          {news.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>Sin noticias por ahora.</Text>
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
                  {n.published_at
                    ? new Date(n.published_at).toLocaleString()
                    : 'recién'}
                </Text>
                <Text style={styles.newsLink}>Abrir ↗</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
