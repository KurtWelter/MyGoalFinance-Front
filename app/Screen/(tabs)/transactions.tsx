// app/Screen/(tabs)/transactions.tsx
import styles from '@/Styles/transactionsStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../constants/api';

type Tx = {
  id: number | string;
  date?: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string | null;
};

type SummaryMonth = { inc: number; exp: number; net: number; month: string };

const GREEN = '#22c55e';
const RED = '#ef4444';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [month, setMonth] = useState<string>(() => ymdMonth(new Date())); // "YYYY-MM"
  const [kpi, setKpi] = useState<SummaryMonth | null>(null);
  const [list, setList] = useState<Tx[]>([]);

  // form
  const [tab, setTab] = useState<'income' | 'expense'>('income');
  const [amountRaw, setAmountRaw] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const monthLabel = useMemo(() => formatMonth(month), [month]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const [s, t] = await Promise.all([
        api.summaryMonth({ month }),
        api.listTransactions({ month }),
      ]);

      // Neto = ingresos - |gastos|
      const inc = Number((s as any)?.inc ?? 0);
      const expRaw = Number((s as any)?.exp ?? 0); // puede venir negativo
      const net = inc - Math.abs(expRaw);
      setKpi({ inc, exp: expRaw, net, month });

      const items = (t || []).map((x: any) => ({
        id: x.id,
        date: x.date || x.created_at?.slice(0, 10),
        type: (x.type as 'income' | 'expense') ?? (x.amount >= 0 ? 'income' : 'expense'),
        amount: Number(x.amount),
        description: x.description ?? x.note ?? x.title ?? null,
      })) as Tx[];
      setList(items);
    } catch (e: any) {
      console.error('[tx] load error', e?.message || e);
      Alert.alert('Error', 'No se pudieron cargar tus movimientos.');
    } finally {
      setBusy(false);
    }
  }, [month]);

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

  const submit = async () => {
    const amount = Number(String(amountRaw).replace(/[^\d-]/g, ''));
    if (!amount || amount <= 0) {
      return Alert.alert('Revisa el monto', 'Ingresa un monto válido.');
    }

    try {
      setSaving(true);
      await api.createTransaction({
        type: tab,
        amount: tab === 'income' ? amount : -amount,
        description: note?.trim() || null,
        date: new Date().toISOString().slice(0, 10),
      });

      setAmountRaw('');
      setNote('');
      Keyboard.dismiss();
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  const nextMonth = () => setMonth(addMonths(month, +1));
  const prevMonth = () => setMonth(addMonths(month, -1));

  // al enfocar inputs, nos aseguramos que el panel quede visible
  const scrollToForm = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        {/* Título grande */}
        <Text style={styles.title}>Transacciones</Text>

        {/* Selector de mes */}
        <View style={styles.headerRow}>
          <Pressable style={styles.navBtn} onPress={prevMonth} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color="#e2e8f0" />
          </Pressable>

          <Text style={styles.h1}>{monthLabel}</Text>

          <Pressable style={styles.navBtn} onPress={nextMonth} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color="#e2e8f0" />
          </Pressable>
        </View>

        {/* KPIs */}
        <View style={styles.kpisRow}>
          <KPI label="Ingresos" value={kpi?.inc ?? 0} color={GREEN} />
          <KPI label="Gastos" value={Math.abs(kpi?.exp ?? 0)} color={RED} />
          <KPI label="Neto" value={kpi?.net ?? 0} color="#4dabf7" />
        </View>
      </LinearGradient>

      {/* Content + Safe keyboard */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 72} // compensa el header
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          {busy ? (
            <View style={styles.loader}>
              <ActivityIndicator />
            </View>
          ) : list.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>No hay movimientos este mes.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {list.map((tx, idx) => (
                <View key={String(tx.id)} style={[styles.row, idx > 0 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {tx.description || (tx.type === 'income' ? 'Ingreso' : 'Gasto')}
                    </Text>
                    {!!tx.date && <Text style={styles.rowMeta}>{tx.date}</Text>}
                  </View>
                  <Text style={[styles.rowAmount, { color: tx.type === 'income' ? GREEN : RED }]}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCLP(Math.abs(tx.amount))}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Panel para agregar movimiento (dentro del ScrollView) */}
          <View
            style={[
              styles.addPanel,
              {
                paddingBottom: (styles as any).addPanel?.paddingBottom ?? 12,
                marginBottom: insets.bottom + 8,
              },
            ]}
          >
            {/* Tabs ingreso/gasto */}
            <View style={styles.tabs}>
              <Pressable
                onPress={() => setTab('income')}
                style={[styles.tabBtn, tab === 'income' ? styles.tabActive : styles.tabIdle]}
              >
                <Text style={tab === 'income' ? styles.tabActiveTxt : styles.tabTxt}>Ingreso</Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('expense')}
                style={[styles.tabBtn, tab === 'expense' ? styles.tabActive : styles.tabIdle]}
              >
                <Text style={tab === 'expense' ? styles.tabActiveTxt : styles.tabTxt}>Gasto</Text>
              </Pressable>
            </View>

            {/* Monto */}
            <TextInput
              style={styles.input}
              placeholder="Monto"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={amountRaw}
              onChangeText={setAmountRaw}
              onFocus={scrollToForm}
              returnKeyType="next"
            />
            {/* Nota */}
            <TextInput
              style={styles.input}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#94a3b8"
              value={note}
              onChangeText={setNote}
              onFocus={scrollToForm}
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            <Pressable
              style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
              onPress={submit}
              disabled={saving}
            >
              <Ionicons name="save" size={18} color="#1f2738" />
              <Text style={styles.btnPrimaryTxt}>
                {saving ? 'Guardando…' : 'Guardar movimiento'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ====================== UI bits ====================== */

function KPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{formatCLP(value)}</Text>
    </View>
  );
}

/* ====================== helpers ====================== */

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
  return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
}
