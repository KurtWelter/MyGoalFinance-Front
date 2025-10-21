// app/Screen/(tabs)/dashboard.tsx
import styles from '@/Styles/dashboardStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../constants/api';

type Tx = { id: number | string; amount: number; date?: string; type?: 'income' | 'expense' };
type SummaryMonth = { inc: number; exp: number; net: number; month: string };

const GREEN = '#22c55e';
const RED = '#ef4444';
const BLUE = '#4dabf7';
const LEGEND = '#e2e8f0';

const chartWidth = Dimensions.get('window').width - 28;

export default function Dashboard() {
  const [month, setMonth] = useState<string>(() => ymdMonth(new Date()));
  const [busy, setBusy] = useState(true);

  const [kpi, setKpi] = useState<SummaryMonth | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);

  const monthLabel = useMemo(() => formatMonth(month), [month]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const [s, t] = await Promise.all([api.summaryMonth({ month }), api.listTransactions({ month })]);

      // ⬇️ Normalizamos: net = ingresos - |gastos|
      const inc = Number((s as any)?.inc ?? 0);
      const expRaw = Number((s as any)?.exp ?? 0); // algunos backends lo devuelven negativo
      const net = inc - Math.abs(expRaw);
      setKpi({ inc, exp: expRaw, net, month });

      const items = (t || []).map((x: any) => ({
        id: x.id,
        date: x.date || x.created_at?.slice(0, 10),
        type: (x.type as 'income' | 'expense') ?? (Number(x.amount) >= 0 ? 'income' : 'expense'),
        amount: Number(x.amount),
      }));
      setTxs(items);
    } finally {
      setBusy(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const series = useMemo(() => buildSeries(month, txs), [month, txs]);

  const nextMonth = () => setMonth(addMonths(month, +1));
  const prevMonth = () => setMonth(addMonths(month, -1));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable style={styles.navBtn} onPress={prevMonth} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color="#e2e8f0" />
          </Pressable>
          <Text style={styles.h1}>{monthLabel}</Text>
          <Pressable style={styles.navBtn} onPress={nextMonth} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color="#e2e8f0" />
          </Pressable>
        </View>

        <View style={styles.kpisRow}>
          <KPI label="Ingresos" value={kpi?.inc ?? 0} color={GREEN} />
          {/* Gastos como valor absoluto para evitar doble signo */}
          <KPI label="Gastos" value={Math.abs(kpi?.exp ?? 0)} color={RED} />
          <KPI label="Neto" value={kpi?.net ?? 0} color={BLUE} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}
      >
        {/* Diario: ingresos vs gastos */}
        <Card title="Ingresos vs Gastos (diario)">
          {busy ? (
            <Loader />
          ) : (
            <LineChart
              width={chartWidth}
              height={220}
              fromZero
              data={{
                labels: series.daily.labels,
                datasets: [
                  { data: series.daily.income, color: () => GREEN, strokeWidth: 2 },
                  { data: series.daily.expense, color: () => RED, strokeWidth: 2 },
                ],
                legend: ['Ingresos', 'Gastos'],
              }}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartCfg}
              bezier
              style={styles.chart}
            />
          )}
        </Card>

        {/* Semanal: neto por semana */}
        <Card title="Totales por semana">
          {busy ? (
            <Loader />
          ) : (
            <BarChart
              width={chartWidth}
              height={220}
              fromZero
              data={{
                labels: ['S1', 'S2', 'S3', 'S4', 'S5'],
                datasets: [{ data: series.weekly.net }],
              }}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartCfg}
              style={styles.chart}
              showBarTops={false}
            />
          )}
        </Card>

        {/* Distribución */}
        <Card title="Distribución: Ingresado vs Gastado vs Ahorrado">
          {busy ? (
            <Loader />
          ) : (
            <PieChart
              width={chartWidth}
              height={240}
              accessor="value"
              backgroundColor="transparent"
              hasLegend
              chartConfig={chartCfg}
              data={[
                { name: 'Ingresado', value: Math.max(0, series.distribution.income),  color: BLUE,  legendFontColor: LEGEND, legendFontSize: 14 },
                { name: 'Gastado',   value: Math.max(0, series.distribution.expense), color: RED,   legendFontColor: LEGEND, legendFontSize: 14 },
                { name: 'Ahorrado',  value: Math.max(0, series.distribution.saved),   color: GREEN, legendFontColor: LEGEND, legendFontSize: 14 },
              ]}
              paddingLeft="8"
              yAxisLabel=""
              yAxisSuffix=""
              style={styles.chart}
            />
          )}
        </Card>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------- UI helpers ----------------------- */

function KPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{formatCLP(value)}</Text>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
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

/* ------------------------ data helpers ------------------------ */

function buildSeries(ym: string, txs: Tx[]) {
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();

  const income = Array(days).fill(0);
  const expense = Array(days).fill(0);
  const weeklyNet = [0, 0, 0, 0, 0];

  let inc = 0;
  let exp = 0;

  for (const t of txs) {
    const d = (t.date || '').split('-')[2];
    const day = Math.max(1, Math.min(days, Number(d || 1)));
    const idx = day - 1;
    const amount = Number(t.amount);

    if ((t.type ?? (amount >= 0 ? 'income' : 'expense')) === 'income') {
      income[idx] += Math.abs(amount);
      inc += Math.abs(amount);
      weeklyNet[Math.ceil(day / 7) - 1] += Math.abs(amount);
    } else {
      expense[idx] += Math.abs(amount);
      exp += Math.abs(amount);
      weeklyNet[Math.ceil(day / 7) - 1] -= Math.abs(amount);
    }
  }

  const labels = Array.from({ length: days }, (_, i) => ((i + 1) % 5 === 0 ? String(i + 1) : ''));

  return {
    daily: { labels, income, expense },
    weekly: { net: weeklyNet },
    distribution: { income: inc, expense: exp, saved: Math.max(0, inc - exp) },
  };
}

function formatCLP(n: number) {
  try {
    return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n)}`;
  }
}
function ymdMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return ymdMonth(d);
}
function formatMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

/* ------------------------ chart config ------------------------ */

const chartCfg = {
  backgroundGradientFrom: '#0b1324',
  backgroundGradientTo: '#0b1324',
  decimalPlaces: 0,
  color: (o = 1) => `rgba(226, 232, 240, ${o})`,
  labelColor: (o = 1) => `rgba(148, 163, 184, ${o})`,
  propsForLabels: { fontSize: 10 },
  propsForDots: { r: '2' },
  propsForBackgroundLines: { stroke: '#1f2937' },
};
