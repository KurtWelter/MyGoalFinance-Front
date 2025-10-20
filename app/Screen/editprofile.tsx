// app/Screen/editprofile.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../constants/api';
import { useAuth } from '../../store/auth';
import styles from '../../Styles/editprofileStyles';

/** Paleta usada localmente (coincide con tus estilos) */
const FG = '#e2e8f0';
const MUTED = '#94a3b8';
const ACCENT_DARK = '#1f2738';

const AGE_OPTS = ['18-25', '26-35', '36-45', '46-55', '56+'] as const;
const EXP_OPTS = ['Básico', 'Intermedio', 'Avanzado'] as const;
const GOAL_PRESETS = ['Ahorro', 'Invertir', 'Deudas', 'Jubilación', 'Educación'] as const;
type ExpOpt = (typeof EXP_OPTS)[number];

export default function EditProfile() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user: me, refreshMe } = useAuth();

  // ---- Back seguro: vuelve si hay historial; si no, reemplaza por Perfil ----
  const goBackSafe = () => {
    const nav: any = navigation;
    if (typeof nav?.canGoBack === 'function' && nav.canGoBack()) {
      router.back();
    } else {
      router.replace('/Screen/(tabs)/profile');
    }
  };

  // ----- state -----
  const [age, setAge] = useState<string>(me?.age_range ?? '26-35');
  const [exp, setExp] = useState<ExpOpt>(() => {
    if (me?.experience === 'advanced') return 'Avanzado';
    if (me?.experience === 'intermediate') return 'Intermedio';
    if (me?.experience === 'beginner') return 'Básico';
    return 'Intermedio';
  });
  const [incomeRaw, setIncomeRaw] = useState<string>(
    me?.monthly_income != null ? String(me.monthly_income) : ''
  );
  const [goal, setGoal] = useState<string>(me?.finance_goal ?? '');
  const [busy, setBusy] = useState(false);

  const incomePretty = useMemo(() => {
    if (!incomeRaw) return '';
    const n = Number(String(incomeRaw).replace(/[^\d]/g, ''));
    if (Number.isNaN(n)) return incomeRaw;
    try {
      return n.toLocaleString('es-CL');
    } catch {
      return String(n);
    }
  }, [incomeRaw]);

  const expToCode = (x: ExpOpt) =>
    x === 'Avanzado' ? 'advanced' : x === 'Intermedio' ? 'intermediate' : 'beginner';

  const onSubmit = async () => {
    const income = Number(String(incomeRaw).replace(/[^\d]/g, ''));
    if (!income || income <= 0) {
      Alert.alert('Revisa tus datos', 'Ingresa un monto válido de ingresos mensuales.');
      return;
    }
    if (!age) {
      Alert.alert('Revisa tus datos', 'Selecciona tu rango de edad.');
      return;
    }

    try {
      setBusy(true);
      await api.updateProfile({
        age_range: age,
        experience: expToCode(exp),
        monthly_income: income,
        finance_goal: goal?.trim() || null,
      });
      await refreshMe();
      // Vuelve de forma segura tras guardar
      goBackSafe();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        <Text style={styles.brand}>MyGoalFinance</Text>
        <Text style={styles.h1}>Editar Perfil</Text>
        <Text style={styles.subtitle}>Ponte al día con tu información personal</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            {/* Edad */}
            <FieldLabel icon="calendar" label="Edad" />
            <View style={styles.chipsRow}>
              {AGE_OPTS.map((opt) => (
                <Chip key={opt} text={opt} selected={age === opt} onPress={() => setAge(opt)} />
              ))}
            </View>

            {/* Nivel en finanzas */}
            <Divider />
            <FieldLabel icon="trending-up" label="Nivel en Finanzas" />
            <View style={styles.chipsRow}>
              {EXP_OPTS.map((opt) => (
                <Chip key={opt} text={opt} selected={exp === opt} onPress={() => setExp(opt)} />
              ))}
            </View>

            {/* Ingresos */}
            <Divider />
            <FieldLabel icon="cash" label="Ingresos (CLP)" />
            <TextInput
              style={styles.input}
              placeholder="Ej: 800000"
              placeholderTextColor={MUTED}
              keyboardType="numeric"
              value={incomeRaw}
              onChangeText={setIncomeRaw}
            />
            {!!incomePretty && <Text style={styles.helper}>≈ {incomePretty} CLP</Text>}

            {/* Meta financiera */}
            <Divider />
            <FieldLabel icon="flag" label="Meta Financiera" />
            <View style={styles.chipsWrap}>
              {GOAL_PRESETS.map((g) => (
                <Chip
                  key={g}
                  text={g}
                  selected={goal.trim().toLowerCase() === g.toLowerCase()}
                  onPress={() => setGoal(g)}
                  size="sm"
                />
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Personaliza tu meta (opcional)"
              placeholderTextColor={MUTED}
              value={goal}
              onChangeText={setGoal}
            />

            {/* Botones */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.7 }]}
                onPress={onSubmit}
                disabled={busy}
              >
                <Ionicons name="save" size={18} color={ACCENT_DARK} />
                <Text style={styles.btnPrimaryText}>
                  {busy ? 'Guardando…' : 'Guardar Cambios'}
                </Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnGhost]} onPress={goBackSafe}>
                <Ionicons name="close" size={18} color={MUTED} />
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </Pressable>
            </View>

            {/* Nota */}
            <Text style={styles.disclaimer}>
              Esta información se usa para personalizar tu experiencia (recomendaciones y
              métricas). Puedes modificarla cuando quieras.
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------- UI bits -------------------- */

function FieldLabel({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.fieldHeader}>
      <Ionicons name={icon} size={16} color={FG} />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Chip({
  text,
  selected,
  onPress,
  size = 'md',
}: {
  text: string;
  selected?: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        size === 'sm' && { paddingVertical: 6, paddingHorizontal: 10 },
        selected ? styles.chipSel : styles.chipIdle,
      ]}
    >
      <Text style={selected ? styles.chipSelText : styles.chipText}>{text}</Text>
    </Pressable>
  );
}
