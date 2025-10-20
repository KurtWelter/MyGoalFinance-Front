// app/Screen/(tabs)/goals.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/ui/Button'; //button
import Card from '../../../components/ui/Card'; //card
import ProgressBar from '../../../components/ui/ProgressBar'; //progesbar
import Section from '../../../components/ui/Section'; //section
import api from '../../../constants/api';
import { colors } from '../../../constants/theme'; //thme
import styles from '../../../Styles/goalsStyles';

type Goal = {
  id: string | number;
  title: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
};

export default function GoalsScreen() {
  // form
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const amount = useMemo(() => toNumber(amountRaw), [amountRaw]);

  // data
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const rows = await api.listGoals();
      setGoals(rows as Goal[]);
    } catch (e: any) {
      console.log('[goals] fetch error', e?.message || e);
      Alert.alert('Ups', e?.message || 'No se pudieron cargar tus metas.');
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

  const onCreate = async () => {
    if (!title.trim()) return Alert.alert('Falta el título', 'Escribe un nombre para tu meta.');
    if (!amount || amount <= 0) {
      return Alert.alert('Monto inválido', 'Ingresa el monto objetivo en CLP.');
    }
    try {
      setCreating(true);
      await api.createGoal({
        title: title.trim(),
        target_amount: amount,
        description: null,
        deadline: null,
      });
      setTitle('');
      setAmountRaw('');
      await load();
      Alert.alert('Listo', 'Tu meta fue creada.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear la meta');
    } finally {
      setCreating(false);
    }
  };

  const onQuickAdd = async (goalId: string | number, add: number) => {
    try {
      await api.addContribution(String(goalId), { amount: add, note: 'Aporte rápido' });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar el aporte.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        <View>
          <Text style={styles.brand}>Mis Metas Financieras</Text>
          <Text style={styles.subtitle}>Define, visualiza y sigue el progreso de tus objetivos.</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Crear nueva meta */}
        <Card title="Agregar nueva meta">
          <TextInput
            style={styles.input}
            placeholder="Ej: Viaje a Europa"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Monto objetivo (CLP)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={amountRaw}
            onChangeText={setAmountRaw}
          />
          <Button
            onPress={onCreate}
            loading={creating}
            style={{ marginTop: 8 }}
          >
            <Ionicons name="add-circle" size={18} color={colors.accentDark} />
            Agregar Meta
          </Button>
        </Card>

        {/* Lista de metas */}
        <Section title="Tus metas">
          {busy ? (
            <Card><ActivityIndicator /></Card>
          ) : goals.length === 0 ? (
            <Card>
              <Text style={{ color: colors.muted }}>
                Aún no tienes metas activas. ¡Crea una para empezar!
              </Text>
            </Card>
          ) : (
            goals.map((g) => (
              <GoalItem key={g.id} goal={g} onQuickAdd={onQuickAdd} />
            ))
          )}
        </Section>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------- Item de meta ----------------------- */
function GoalItem({
  goal,
  onQuickAdd,
}: {
  goal: Goal;
  onQuickAdd: (id: string | number, add: number) => void;
}) {
  const target = Number(goal.target_amount || 0);
  const current = Number(goal.current_amount || 0);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <Card>
      <Text style={styles.goalTitle}>{goal.title}</Text>
      <Text style={styles.goalMeta}>
        Progreso: {formatCLP(current)} / {formatCLP(target)} CLP
      </Text>

      <View style={{ marginVertical: 6 }}>
        <ProgressBar value={pct} />
      </View>
      <Text style={styles.goalPct}>{pct}% completado</Text>

      <View style={styles.chipsRow}>
        {[10_000, 20_000, 50_000].map((n) => (
          <Pressable key={n} onPress={() => onQuickAdd(goal.id, n)} style={styles.chip}>
            <Text style={styles.chipText}>+{formatCLP(n)}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

/* ------------------------- helpers ------------------------- */
function toNumber(s: string) {
  const n = Number(String(s).replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function formatCLP(n: number) {
  try {
    return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n)}`;
  }
}
