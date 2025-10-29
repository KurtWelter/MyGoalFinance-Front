// app/Screen/(tabs)/goals.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ProgressBar from '../../../components/ui/ProgressBar';
import Section from '../../../components/ui/Section';
import api from '../../../constants/api';
import { colors } from '../../../constants/theme';
import styles from '../../../Styles/goalsStyles';
import modalStyles from '../../../Styles/modalStyles'; // ✅ alias correcto

type Goal = {
  id: string | number;
  title: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
};

export default function GoalsScreen() {
  // form crear
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const amount = useMemo(() => toNumber(amountRaw), [amountRaw]);

  // data
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  // modales
  const [editing, setEditing] = useState<{
    id: string | number;
    title: string;
    targetRaw: string;
  } | null>(null);

  const [removing, setRemoving] = useState<{ id: string | number; title: string } | null>(null);
  const [custom, setCustom] = useState<{ id: string | number; amountRaw: string } | null>(null);

  const [savingEdit, setSavingEdit] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const openEdit = (g: Goal) => {
    setEditing({
      id: g.id,
      title: g.title,
      targetRaw: String(Math.round(Number(g.target_amount || 0))),
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const title = editing.title.trim();
    const target_amount = toNumber(editing.targetRaw);
    if (!title) return Alert.alert('Título requerido', 'Ingresa el nombre de la meta.');
    if (!target_amount) return Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');

    try {
      setSavingEdit(true);
      await api.updateGoal(String(editing.id), { title, target_amount }); // ajusta firma si difiere
      setEditing(null);
      await load();
      Alert.alert('Guardado', 'Los cambios fueron aplicados.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar la meta.');
    } finally {
      setSavingEdit(false);
    }
  };

  const openDelete = (g: Goal) => setRemoving({ id: g.id, title: g.title });

  const confirmDelete = async () => {
    if (!removing) return;
    try {
      setDeleting(true);
      await api.deleteGoal(String(removing.id));
      setRemoving(null);
      await load();
      Alert.alert('Eliminada', 'La meta fue eliminada.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo eliminar la meta.');
    } finally {
      setDeleting(false);
    }
  };

  const openCustom = (g: Goal) => setCustom({ id: g.id, amountRaw: '' });

  const saveCustom = async () => {
    if (!custom) return;
    const amount = toNumber(custom.amountRaw);
    if (!amount) return Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
    try {
      setSavingCustom(true);
      await api.addContribution(String(custom.id), { amount, note: 'Aporte personalizado' });
      setCustom(null);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar el aporte.');
    } finally {
      setSavingCustom(false);
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
          <Button onPress={onCreate} loading={creating} style={{ marginTop: 8 }}>
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
              <GoalItem
                key={g.id}
                goal={g}
                onQuickAdd={onQuickAdd}
                onEdit={() => openEdit(g)}
                onDelete={() => openDelete(g)}
                onCustom={() => openCustom(g)}
              />
            ))
          )}
        </Section>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* --- Modal Editar --- */}
      <Modal visible={!!editing} animationType="fade" transparent onRequestClose={() => setEditing(null)}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Editar Meta</Text>

            <Text style={modalStyles.label}>Nombre de la meta</Text>
            <TextInput
              style={modalStyles.input}
              value={editing?.title || ''}
              onChangeText={(t) => setEditing((e) => (e ? { ...e, title: t } : e))}
              placeholder="Ej: Comprar una casa"
              placeholderTextColor={colors.muted}
            />

            <Text style={modalStyles.label}>Monto objetivo</Text>
            <TextInput
              style={modalStyles.input}
              value={editing?.targetRaw || ''}
              onChangeText={(t) => setEditing((e) => (e ? { ...e, targetRaw: t } : e))}
              keyboardType="numeric"
              placeholder="10000000"
              placeholderTextColor={colors.muted}
            />

            <View style={modalStyles.row}>
              <Button variant="ghost" onPress={() => setEditing(null)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={saveEdit} loading={savingEdit} style={{ flex: 1 }}>
                Guardar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Modal Eliminar --- */}
      <Modal visible={!!removing} animationType="fade" transparent onRequestClose={() => setRemoving(null)}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Eliminar Meta</Text>
            <Text style={{ color: '#fff', marginTop: 6 }}>
              ¿Estás seguro de que deseas eliminar la meta "{removing?.title}"? Esta acción no se puede deshacer.
            </Text>

            <View style={[modalStyles.row, { marginTop: 16 }]}>
              <Button variant="ghost" onPress={() => setRemoving(null)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={confirmDelete}
                loading={deleting}
                style={{ flex: 1, backgroundColor: '#e53935' }} // rojo sólido
              >
                Eliminar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Modal Aporte personalizado --- */}
      <Modal visible={!!custom} animationType="fade" transparent onRequestClose={() => setCustom(null)}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Aporte Personalizado</Text>
            <Text style={modalStyles.label}>Cantidad a aportar</Text>
            <TextInput
              style={modalStyles.input}
              keyboardType="numeric"
              placeholder="Ej: 15000"
              placeholderTextColor={colors.muted}
              value={custom?.amountRaw || ''}
              onChangeText={(t) => setCustom((c) => (c ? { ...c, amountRaw: t } : c))}
            />
            <View style={modalStyles.row}>
              <Button variant="ghost" onPress={() => setCustom(null)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={saveCustom} loading={savingCustom} style={{ flex: 1 }}>
                Agregar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------------- Item de meta ----------------------- */
function GoalItem({
  goal,
  onQuickAdd,
  onEdit,
  onDelete,
  onCustom,
}: {
  goal: Goal;
  onQuickAdd: (id: string | number, add: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCustom: () => void;
}) {
  const target = Number(goal.target_amount || 0);
  const current = Number(goal.current_amount || 0);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <Card>
      {/* Header con título + acciones */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.goalTitle, { flex: 1 }]}>{goal.title}</Text>

        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={[styles.actionBtn, styles.editBtn]} accessibilityLabel="Editar meta">
            <Ionicons name="pencil" size={18} style={styles.actionIconEdit} />
          </Pressable>

          <Pressable onPress={onDelete} style={[styles.actionBtn, styles.deleteBtn]} accessibilityLabel="Eliminar meta">
            <Ionicons name="trash" size={18} style={styles.actionIconDelete} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.goalMeta}>
        Progreso: {formatCLP(current)} / {formatCLP(target)} CLP
      </Text>

      <View style={{ marginVertical: 6 }}>
        <ProgressBar value={pct} />
      </View>
      <Text style={styles.goalPct}>{pct}% completado</Text>

      {/* Aportes rápidos + personalizado */}
      <View style={styles.chipsRow}>
        {[10_000, 20_000, 50_000].map((n) => (
          <Pressable key={n} onPress={() => onQuickAdd(goal.id, n)} style={styles.chip}>
            <Text style={styles.chipText}>+{formatCLP(n)}</Text>
          </Pressable>
        ))}

        <View style={{ flex: 1 }} />
        <Pressable onPress={onCustom} style={styles.plusBtn} accessibilityLabel="Agregar aporte personalizado">
          <Ionicons name="add" size={20} style={styles.plusIcon} />
        </Pressable>
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
