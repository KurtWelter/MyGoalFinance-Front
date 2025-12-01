// app/Screen/(tabs)/goals.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import modalStyles from '../../../Styles/modalStyles';

type Goal = {
  id: string | number;
  title: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
};

/** Meta completada si current >= target y target > 0 */
function isGoalCompleted(g: Goal): boolean {
  const target = Number(g.target_amount || 0);
  const current = Number(g.current_amount || 0);
  return target > 0 && current >= target;
}

export default function GoalsScreen() {
  // form crear (usado en el modal de nueva meta)
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const amount = useMemo(() => toNumber(amountRaw), [amountRaw]);

  // data
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  // visibilidad del modal de nueva meta (FAB)
  const [createVisible, setCreateVisible] = useState(false);

  // modales de edición / borrado / aporte
  const [editing, setEditing] = useState<{
    id: string | number;
    title: string;
    targetRaw: string;
  } | null>(null);

  const [removing, setRemoving] = useState<{
    id: string | number;
    title: string;
  } | null>(null);

  const [custom, setCustom] = useState<{
    id: string | number;
    amountRaw: string;
  } | null>(null);

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

  // separo metas activas vs completadas
  const activeGoals = useMemo(
    () => goals.filter((g) => !isGoalCompleted(g)),
    [goals]
  );
  const completedGoals = useMemo(
    () => goals.filter((g) => isGoalCompleted(g)),
    [goals]
  );

  const onCreate = async () => {
    if (!title.trim())
      return Alert.alert(
        'Falta el título',
        'Escribe un nombre para tu meta.'
      );
    if (!amount || amount <= 0) {
      return Alert.alert(
        'Monto inválido',
        'Ingresa el monto objetivo en CLP.'
      );
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
      setCreateVisible(false);
      Alert.alert('Listo', 'Tu meta fue creada.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear la meta');
    } finally {
      setCreating(false);
    }
  };

  const onQuickAdd = async (goalId: string | number, add: number) => {
    const goal = goals.find((g) => g.id === goalId);
    const wasCompleted = goal ? isGoalCompleted(goal) : false;

    const predictedCompleted =
      goal &&
      isGoalCompleted({
        ...goal,
        current_amount:
          Number(goal.current_amount || 0) + Math.max(0, Number(add || 0)),
      });

    try {
      await api.addContribution(String(goalId), {
        amount: add,
        note: 'Aporte rápido',
      });
      await load();

      if (goal && !wasCompleted && predictedCompleted) {
        Alert.alert(
          '🎉 ¡Meta completada!',
          `Felicitaciones, alcanzaste tu meta "${goal.title}".`
        );
      }
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
    const newTitle = editing.title.trim();
    const target_amount = toNumber(editing.targetRaw);
    if (!newTitle)
      return Alert.alert(
        'Título requerido',
        'Ingresa el nombre de la meta.'
      );
    if (!target_amount)
      return Alert.alert(
        'Monto inválido',
        'Ingresa un monto mayor a 0.'
      );

    try {
      setSavingEdit(true);
      await api.updateGoal(String(editing.id), {
        title: newTitle,
        target_amount,
      });
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
    const value = toNumber(custom.amountRaw);
    if (!value)
      return Alert.alert(
        'Monto inválido',
        'Ingresa un monto mayor a 0.'
      );

    const goal = goals.find((g) => g.id === custom.id);
    const wasCompleted = goal ? isGoalCompleted(goal) : false;
    const predictedCompleted =
      goal &&
      isGoalCompleted({
        ...goal,
        current_amount:
          Number(goal.current_amount || 0) + Math.max(0, Number(value || 0)),
      });

    try {
      setSavingCustom(true);
      await api.addContribution(String(custom.id), {
        amount: value,
        note: 'Aporte personalizado',
      });
      setCustom(null);
      await load();

      if (goal && !wasCompleted && predictedCompleted) {
        Alert.alert(
          '🎉 ¡Meta completada!',
          `Felicitaciones, alcanzaste tu meta "${goal.title}".`
        );
      }
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
          <Text style={styles.subtitle}>
            Define, visualiza y sigue el progreso de tus objetivos.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Texto guía en vez del formulario fijo */}
        <Card>
          <Text style={{ color: colors.muted }}>
            Crea nuevas metas financieras usando el botón{' '}
            <Text style={{ fontWeight: '700', color: '#f3b34c' }}>+</Text> en
            la esquina inferior derecha.
          </Text>
        </Card>

        {/* Metas activas */}
        <Section title="Tus metas">
          {busy ? (
            <Card>
              <ActivityIndicator />
            </Card>
          ) : activeGoals.length === 0 ? (
            <Card>
              <Text style={{ color: colors.muted }}>
                Aún no tienes metas activas. Toca el botón{' '}
                <Text style={{ fontWeight: '700', color: '#f3b34c' }}>+</Text>{' '}
                para crear tu primera meta.
              </Text>
            </Card>
          ) : (
            activeGoals.map((g) => (
              <GoalItem
                key={g.id}
                goal={g}
                onQuickAdd={onQuickAdd}
                onEdit={() => openEdit(g)}
                onDelete={() => openDelete(g)}
                onCustom={() => openCustom(g)}
                completed={false}
              />
            ))
          )}
        </Section>

        {/* Metas completadas */}
        {completedGoals.length > 0 && (
          <Section title="Metas completadas">
            {completedGoals.map((g) => (
              <GoalItem
                key={g.id}
                goal={g}
                onQuickAdd={onQuickAdd}
                onEdit={() => openEdit(g)}
                onDelete={() => openDelete(g)}
                onCustom={() => openCustom(g)}
                completed
              />
            ))}
          </Section>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB → abre modal NUEVA META */}
      <Pressable
        onPress={() => setCreateVisible(true)}
        accessibilityLabel="Crear nueva meta"
        style={{
          position: 'absolute',
          right: 24,
          bottom: 32,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#f3b34c',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={26} color="#1f2738" />
      </Pressable>

      {/* --- Modal NUEVA META (usa title + amountRaw) --- */}
      <Modal
        visible={createVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCreateVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Nueva Meta</Text>

            <Text style={modalStyles.label}>Nombre de la meta</Text>
            <TextInput
              style={modalStyles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Viaje a Europa"
              placeholderTextColor={colors.muted}
            />

            <Text style={modalStyles.label}>Monto objetivo (CLP)</Text>
            <TextInput
              style={modalStyles.input}
              value={amountRaw}
              onChangeText={setAmountRaw}
              keyboardType="numeric"
              placeholder="2000000"
              placeholderTextColor={colors.muted}
            />

            <View style={modalStyles.row}>
              <Button
                variant="ghost"
                onPress={() => {
                  setCreateVisible(false);
                }}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={onCreate}
                loading={creating}
                style={{ flex: 1 }}
              >
                <Ionicons
                  name="add-circle"
                  size={18}
                  color={colors.accentDark}
                />
                Crear meta
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Modal Editar --- */}
      <Modal
        visible={!!editing}
        animationType="fade"
        transparent
        onRequestClose={() => setEditing(null)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Editar Meta</Text>

            <Text style={modalStyles.label}>Nombre de la meta</Text>
            <TextInput
              style={modalStyles.input}
              value={editing?.title || ''}
              onChangeText={(t) =>
                setEditing((e) => (e ? { ...e, title: t } : e))
              }
              placeholder="Ej: Comprar una casa"
              placeholderTextColor={colors.muted}
            />

            <Text style={modalStyles.label}>Monto objetivo</Text>
            <TextInput
              style={modalStyles.input}
              value={editing?.targetRaw || ''}
              onChangeText={(t) =>
                setEditing((e) => (e ? { ...e, targetRaw: t } : e))
              }
              keyboardType="numeric"
              placeholder="10000000"
              placeholderTextColor={colors.muted}
            />

            <View style={modalStyles.row}>
              <Button
                variant="ghost"
                onPress={() => setEditing(null)}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={saveEdit}
                loading={savingEdit}
                style={{ flex: 1 }}
              >
                Guardar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Modal Eliminar --- */}
      <Modal
        visible={!!removing}
        animationType="fade"
        transparent
        onRequestClose={() => setRemoving(null)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Eliminar Meta</Text>
            <Text style={{ color: '#fff', marginTop: 6 }}>
              ¿Estás seguro de que deseas eliminar la meta "
              {removing?.title}"? Esta acción no se puede deshacer.
            </Text>

            <View style={[modalStyles.row, { marginTop: 16 }]}>
              <Button
                variant="ghost"
                onPress={() => setRemoving(null)}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={confirmDelete}
                loading={deleting}
                style={{ flex: 1, backgroundColor: '#e53935' }}
              >
                Eliminar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Modal Aporte personalizado --- */}
      <Modal
        visible={!!custom}
        animationType="fade"
        transparent
        onRequestClose={() => setCustom(null)}
      >
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
              onChangeText={(t) =>
                setCustom((c) => (c ? { ...c, amountRaw: t } : c))
              }
            />
            <View style={modalStyles.row}>
              <Button
                variant="ghost"
                onPress={() => setCustom(null)}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={saveCustom}
                loading={savingCustom}
                style={{ flex: 1 }}
              >
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
  completed = false,
}: {
  goal: Goal;
  onQuickAdd: (id: string | number, add: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCustom: () => void;
  completed?: boolean;
}) {
  const target = Number(goal.target_amount || 0);
  const current = Number(goal.current_amount || 0);
  const pct =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <Card>
      {/* Header con título + acciones */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.goalTitle, { flex: 1 }]}>{goal.title}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={onEdit}
            style={[styles.actionBtn, styles.editBtn]}
            accessibilityLabel="Editar meta"
          >
            <Ionicons name="pencil" size={18} style={styles.actionIconEdit} />
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={[styles.actionBtn, styles.deleteBtn]}
            accessibilityLabel="Eliminar meta"
          >
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
      <Text style={styles.goalPct}>
        {pct}% completado{completed ? ' 🎉' : ''}
      </Text>

      {/* Si está completada, solo mensaje; si no, chips de aporte */}
      {!completed ? (
        <View style={styles.chipsRow}>
          {[10_000, 20_000, 50_000].map((n) => (
            <Pressable
              key={n}
              onPress={() => onQuickAdd(goal.id, n)}
              style={styles.chip}
            >
              <Text style={styles.chipText}>+{formatCLP(n)}</Text>
            </Pressable>
          ))}

          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onCustom}
            style={styles.plusBtn}
            accessibilityLabel="Agregar aporte personalizado"
          >
            <Ionicons name="add" size={20} style={styles.plusIcon} />
          </Pressable>
        </View>
      ) : (
        <Text
          style={{
            marginTop: 6,
            color: '#c0f5b1',
            fontWeight: '600',
          }}
        >
          🎉 Meta completada
        </Text>
      )}
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
    return n.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
  } catch {
    return `$${Math.round(n)}`;
  }
}
