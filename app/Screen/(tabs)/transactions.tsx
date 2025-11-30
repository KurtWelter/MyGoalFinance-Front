// app/Screen/(tabs)/transactions.tsx
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../../../constants/api';
import styles from '../../../Styles/transactionsStyles';

type TxType = 'income' | 'expense';

type Transaction = {
  id: number;
  type: TxType;
  amount: number;
  description: string | null;
  occurred_at: string; // "YYYY-MM-DD"
  category_id?: number | null;
};

type SummaryMonth = {
  month: string;
  from: string;
  to: string;
  inc: number;
  exp: number;
  net: number;
};

const GREEN = '#22c55e';
const RED = '#ef4444';

function todayMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function addMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('es-CL', {
    month: 'short',
    year: 'numeric',
  });
}

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

export default function Transactions() {
  const [month, setMonth] = useState<string>(todayMonth());
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [kpi, setKpi] = useState<SummaryMonth | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal agregar movimiento
  const [modalVisible, setModalVisible] = useState(false);
  const [tab, setTab] = useState<TxType>('income');
  const [amountRaw, setAmountRaw] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Importar Excel/CSV
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, kpiRes] = await Promise.all([
        api.listTransactions({ month }),
        api.summaryMonth({ month }),
      ]);

      setTxs((txRes as any) || []);
      setKpi((kpiRes as any) || null);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Ups', e?.message || 'No se pudo cargar los movimientos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openAddModal = () => {
    setTab('income');
    setAmountRaw('');
    setNote('');
    setModalVisible(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const parsedAmount = useMemo(() => {
    const n = Number(String(amountRaw).replace(',', '.'));
    return isFinite(n) ? n : 0;
  }, [amountRaw]);

  const submit = async () => {
    if (saving) return;
    const amt = parsedAmount;
    if (!(amt > 0)) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return;
    }

    try {
      setSaving(true);
      await api.createTransaction({
        type: tab === 'income' ? 'income' : 'expense',
        amount: amt,
        description: note || null,
        // occurred_at → el backend usa la fecha de hoy por defecto
      });
      setModalVisible(false);
      setAmountRaw('');
      setNote('');
      load();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'No se pudo guardar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  // 🔽 AQUÍ VA EL CAMBIO IMPORTANTE 🔽
  const handleImportExcel = async () => {
    if (importing) return;

    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Importación no disponible en web',
          'Por ahora la importación de Excel/CSV solo está disponible en la app móvil.'
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset || !asset.uri) {
        Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
        return;
      }

      setImporting(true);

      const uri = asset.uri;
      const name = asset.name || 'movimientos.xlsx';
      const mime =
        asset.mimeType ||
        (name.toLowerCase().endsWith('.csv')
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      const form = new FormData();
      form.append('file', {
        uri,
        name,
        type: mime,
      } as any);

      const res: any = await api.importTransactions(form);
      console.log('[IMPORT] respuesta API:', res);

      // Recargar lista + KPIs
      await load();

      // Compatibilidad: acepta tanto { imported } como { inserted }
      const imported =
        typeof res === 'number'
          ? res
          : res?.imported ?? res?.inserted ?? 0;

      const errors = Array.isArray(res?.errors) ? res.errors.length : 0;

      let msg = `Se importaron ${imported} movimiento${
        imported === 1 ? '' : 's'
      }.`;
      if (errors > 0) {
        msg += ` ${errors} filas tuvieron errores y se omitieron.`;
      }

      Alert.alert('Importación completada', msg);
    } catch (e: any) {
      console.error('import error', e);
      Alert.alert('Error', e?.message || 'No se pudo importar el archivo.');
    } finally {
      setImporting(false);
    }
  };
  // 🔼 FIN DEL CAMBIO 🔼

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const sign = isIncome ? '+' : '-';
    const color = isIncome ? GREEN : RED;

    const dateStr = (() => {
      if (!item.occurred_at) return '';
      try {
        const d = new Date(item.occurred_at);
        // Forzamos formato chileno dd-mm-aaaa
        return d.toLocaleDateString('es-CL');
      } catch {
        return item.occurred_at;
      }
    })();

    return (
      <View style={styles.txRow}>
        <View style={styles.txLeft}>
          <Text style={styles.txTitle}>
            {item.description || (isIncome ? 'Ingreso' : 'Gasto')}
          </Text>
          <Text style={styles.txMeta}>{dateStr}</Text>
        </View>
        <Text style={[styles.txAmount, { color }]}>
          {sign} {formatCLP(Math.abs(item.amount))}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safe}
      >
        <View style={styles.container}>
          {/* HEADER + KPIs */}
          <LinearGradient
            colors={['#0f172a', '#020617']}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <Pressable
                style={styles.navBtn}
                onPress={() => setMonth((prev) => addMonth(prev, -1))}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color="#e5e7eb"
                />
              </Pressable>

              <Text style={styles.h1}>{formatMonthLabel(month)}</Text>

              <Pressable
                style={styles.navBtn}
                onPress={() => setMonth((prev) => addMonth(prev, 1))}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#e5e7eb"
                />
              </Pressable>
            </View>

            <View style={styles.kpisRow}>
              <View style={[styles.kpiCard, { borderColor: GREEN + '55' }]}>
                <Text style={styles.kpiLabel}>Ingresos</Text>
                <Text style={[styles.kpiValue, { color: GREEN }]}>
                  {formatCLP(kpi?.inc ?? 0)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: RED + '55' }]}>
                <Text style={styles.kpiLabel}>Gastos</Text>
                <Text style={[styles.kpiValue, { color: RED }]}>
                  {formatCLP(Math.abs(kpi?.exp ?? 0))}
                </Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: '#38bdf855' }]}>
                <Text style={styles.kpiLabel}>Neto</Text>
                <Text style={[styles.kpiValue, { color: '#38bdf8' }]}>
                  {formatCLP(kpi?.net ?? 0)}
                </Text>
              </View>
            </View>

            {/* Botón Importar Excel/CSV */}
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.btnSecondary}
                onPress={handleImportExcel}
                disabled={importing}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={14}
                  color="#e2e8f0"
                />
                <Text style={styles.btnSecondaryTxt}>
                  {importing ? 'Importando...' : 'Importar Excel/CSV'}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* LISTA */}
          <View style={styles.listWrap}>
            {loading && txs.length === 0 ? (
              <View style={styles.loader}>
                <ActivityIndicator color="#e5e7eb" />
              </View>
            ) : (
              <FlatList
                data={txs}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={
                  txs.length === 0 ? styles.emptyContent : undefined
                }
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>
                      Aún no tienes movimientos en este mes.
                    </Text>
                  </View>
                }
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#fff"
                  />
                }
              />
            )}
          </View>

          {/* FAB Agregar movimiento */}
          <Pressable
            style={styles.fab}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={24} color="#020617" />
          </Pressable>

          {/* MODAL: Agregar movimiento */}
          <Modal
            visible={modalVisible}
            transparent
            animationType="slide"
            onRequestClose={closeAddModal}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                <Text style={styles.modalTitle}>Nuevo movimiento</Text>

                {/* Tabs Ingreso / Gasto */}
                <View style={styles.tabRow}>
                  <Pressable
                    style={[
                      styles.tabChip,
                      tab === 'income' && styles.tabChipActive,
                    ]}
                    onPress={() => setTab('income')}
                  >
                    <Text
                      style={[
                        styles.tabTxt,
                        tab === 'income' && styles.tabTxtActive,
                      ]}
                    >
                      Ingreso
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.tabChip,
                      tab === 'expense' && styles.tabChipActive,
                    ]}
                    onPress={() => setTab('expense')}
                  >
                    <Text
                      style={[
                        styles.tabTxt,
                        tab === 'expense' && styles.tabTxtActive,
                      ]}
                    >
                      Gasto
                    </Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.fieldLabel}>Monto</Text>
                  <TextInput
                    value={amountRaw}
                    onChangeText={setAmountRaw}
                    keyboardType="numeric"
                    placeholder="Ej: 150000"
                    placeholderTextColor="#6b7280"
                    style={styles.input}
                  />

                  <Text style={styles.fieldLabel}>Descripción (opcional)</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder={
                      tab === 'income'
                        ? 'Sueldo, freelance...'
                        : 'Supermercado, cuentas...'
                    }
                    placeholderTextColor="#6b7280"
                    style={[styles.input, styles.inputMultiline]}
                    multiline
                  />
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.btnGhost}
                    onPress={closeAddModal}
                    disabled={saving}
                  >
                    <Text style={styles.btnGhostTxt}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnPrimary}
                    onPress={submit}
                    disabled={saving}
                  >
                    <Text style={styles.btnPrimaryTxt}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
