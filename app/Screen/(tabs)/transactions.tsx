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
  Linking,
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

type Goal = {
  id: string;
  title: string;
  target_amount?: number;
  current_amount?: number;
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

  // Depósito Webpay
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [creatingDeposit, setCreatingDeposit] = useState(false);

  // Retiro
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Distribución de depósito a metas
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [distributing, setDistributing] = useState(false);

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

  // ========= KPIs derivados =========
  const stats = useMemo(() => {
    let deposits = 0;
    let withdrawals = 0;

    for (const t of txs) {
      if (!t) continue;
      const desc = (t.description || '').toLowerCase();

      // Depósitos Webpay → descripción fija desde el backend
      if (
        desc.includes('depósito webpay') ||
        desc.includes('deposito webpay')
      ) {
        if (t.amount > 0) deposits += t.amount;
      }
      // Retiros → cualquier transacción cuya descripción contenga "retiro"
      else if (desc.includes('retiro')) {
        if (t.amount < 0) withdrawals += Math.abs(t.amount);
      }
    }

    const totalInc = kpi?.inc ?? 0; // incluye depósitos + ingresos Excel
    const totalExp = kpi?.exp ?? 0; // incluye retiros + gastos Excel

    const excelInc = Math.max(totalInc - deposits, 0);
    const excelExp = Math.max(totalExp - withdrawals, 0);
    const excelNet = excelInc - excelExp;
    const balance = deposits - withdrawals;

    return {
      deposits,
      withdrawals,
      balance,
      excelInc,
      excelExp,
      excelNet,
    };
  }, [txs, kpi]);

  // ========= DEPÓSITO =========
  const startDeposit = () => {
    setDepositAmount('');
    setShowDepositModal(true);
  };

  const pollForDeposit = async (ms = 60_000) => {
    const started = Date.now();
    while (Date.now() - started < ms) {
      try {
        await load();
      } catch {
        // ignoramos errores intermedios
      }
      await new Promise((r) => setTimeout(r, 5_000));
    }
  };

  const confirmDeposit = async () => {
    const val = Number(depositAmount.replace(/[^\d.-]/g, ''));
    if (!val || val <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return;
    }

    setCreatingDeposit(true);
    try {
      // Backend: POST /payments/deposit { amount }
      const r: any = await api.createDeposit({ amount: val });
      const url = r?.payment_url;
      if (url) {
        Alert.alert('Depósito', 'Abriendo Webpay para completar el pago.');
        Linking.openURL(url).catch(() => {});
        // Poll para refrescar transacciones después del commit Webpay
        pollForDeposit();
      } else {
        Alert.alert('Depósito', 'No se obtuvo URL de pago.');
      }
      setShowDepositModal(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'No se pudo iniciar el depósito.');
    } finally {
      setCreatingDeposit(false);
    }
  };

  // ========= RETIRO =========
  const openWithdraw = () => {
    setWithdrawAmount('');
    setWithdrawNote('');
    setShowWithdrawModal(true);
  };

  const confirmWithdraw = async () => {
    const val = Number(withdrawAmount.replace(/[^\d.-]/g, ''));
    if (!val || val <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return;
    }

    setWithdrawing(true);
    try {
      // Descripción normalizada para que se marque como Retiro
      const descBase = withdrawNote.trim();
      const description = descBase
        ? `Retiro: ${descBase}`
        : 'Retiro';

      // Si tienes un endpoint /payments/withdraw úsalo,
      // si no, usamos createTransaction como ahora.
      if ((api as any).withdraw) {
        await (api as any).withdraw({
          amount: val,
          note: descBase,
        });
      } else {
        await api.createTransaction({
          type: 'expense',
          amount: val,
          description,
        });
      }

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawNote('');
      await load();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'No se pudo registrar el retiro.');
    } finally {
      setWithdrawing(false);
    }
  };

  // ========= REDISTRIBUCIÓN A METAS =========
  const openDistribute = async () => {
    try {
      const g = await api.listGoals();
      const act = (g as any[]).filter(
        (x) =>
          Number(x?.target_amount || 0) - Number(x?.current_amount || 0) > 0
      );
      setGoals(
        act.map((x) => ({
          id: String(x.id),
          title: String(x.title || x.name || 'Meta'),
          target_amount: Number(x.target_amount || 0),
          current_amount: Number(x.current_amount || 0),
        }))
      );
      const init: Record<string, string> = {};
      act.forEach((x) => {
        init[String(x.id)] = '';
      });
      setAlloc(init);
      setShowDistributeModal(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'No se pudieron cargar metas.');
    }
  };

  const totalAlloc = useMemo(
    () =>
      Object.values(alloc).reduce(
        (s, v) => s + (Number(v.replace(/[^\d.-]/g, '')) || 0),
        0
      ),
    [alloc]
  );

  const doDistribute = async () => {
    if (goals.length === 0) {
      setShowDistributeModal(false);
      return;
    }
    if (totalAlloc <= 0) {
      Alert.alert('Distribución', 'Ingresa montos a distribuir');
      return;
    }

    setDistributing(true);
    try {
      for (const g of goals) {
        const amt = Number(
          (alloc[g.id] || '').replace(/[^\d.-]/g, '')
        );
        if (amt && amt > 0) {
          await api.addContribution(g.id, { amount: amt });
        }
      }
      setShowDistributeModal(false);
      setAlloc({});
      Alert.alert(
        'Distribución',
        'Se registraron los aportes en tus metas.'
      );
      await load();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'No se pudo distribuir.');
    } finally {
      setDistributing(false);
    }
  };

  // ========= IMPORTAR EXCEL / CSV =========
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

            {/* Fila 1: Depósitos / Retiros / Saldo cuenta */}
            <View style={styles.kpisRow}>
              <View style={[styles.kpiCard, { borderColor: GREEN + '55' }]}>
                <Text style={styles.kpiLabel}>Depósitos</Text>
                <Text style={[styles.kpiValue, { color: GREEN }]}>
                  {formatCLP(stats.deposits)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: RED + '55' }]}>
                <Text style={styles.kpiLabel}>Retiros</Text>
                <Text style={[styles.kpiValue, { color: RED }]}>
                  {formatCLP(stats.withdrawals)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: '#38bdf855' }]}>
                <Text style={styles.kpiLabel}>Saldo cuenta</Text>
                <Text style={[styles.kpiValue, { color: '#38bdf8' }]}>
                  {formatCLP(stats.balance)}
                </Text>
              </View>
            </View>

            {/* Fila 2: Ingresos/Gastos/Neto desde Excel */}
            <View style={styles.kpisRow}>
              <View style={[styles.kpiCard, { borderColor: GREEN + '55' }]}>
                <Text style={styles.kpiLabel}>Ingresos (Excel)</Text>
                <Text style={[styles.kpiValue, { color: GREEN }]}>
                  {formatCLP(stats.excelInc)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: RED + '55' }]}>
                <Text style={styles.kpiLabel}>Gastos (Excel)</Text>
                <Text style={[styles.kpiValue, { color: RED }]}>
                  {formatCLP(stats.excelExp)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: '#38bdf855' }]}>
                <Text style={styles.kpiLabel}>Neto (Excel)</Text>
                <Text style={[styles.kpiValue, { color: '#38bdf8' }]}>
                  {formatCLP(stats.excelNet)}
                </Text>
              </View>
            </View>

            {/* Acciones: Depósito / Retiro */}
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.btnSecondary}
                onPress={startDeposit}
                disabled={creatingDeposit}
              >
                <Ionicons
                  name="card-outline"
                  size={14}
                  color="#e2e8f0"
                />
                <Text style={styles.btnSecondaryTxt}>
                  {creatingDeposit ? 'Procesando...' : 'Depósito Webpay'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.btnSecondary}
                onPress={openWithdraw}
                disabled={withdrawing}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={14}
                  color="#e2e8f0"
                />
                <Text style={styles.btnSecondaryTxt}>
                  {withdrawing ? 'Procesando...' : 'Retiro'}
                </Text>
              </Pressable>
            </View>

            {/* Acciones: Importar / Distribuir depósito */}
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

              <Pressable
                style={styles.btnSecondary}
                onPress={openDistribute}
                disabled={distributing}
              >
                <Ionicons
                  name="pie-chart-outline"
                  size={14}
                  color="#e2e8f0"
                />
                <Text style={styles.btnSecondaryTxt}>
                  {distributing ? 'Distribuyendo...' : 'Distribuir depósito'}
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

          {/* MODAL: Depósito Webpay */}
          <Modal
            visible={showDepositModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDepositModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Depósito Webpay</Text>

                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.fieldLabel}>Monto a depositar</Text>
                  <TextInput
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                    keyboardType="numeric"
                    placeholder="Ej: 100000"
                    placeholderTextColor="#6b7280"
                    style={styles.input}
                  />

                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    {[10000, 20000, 50000, 100000].map((v) => {
                      const active =
                        Number(
                          depositAmount.replace(/[^\d.-]/g, '')
                        ) === v;
                      return (
                        <Pressable
                          key={v}
                          onPress={() => setDepositAmount(String(v))}
                          style={[
                            styles.tabChip,
                            active && styles.tabChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tabTxt,
                              active && styles.tabTxtActive,
                            ]}
                          >
                            {formatCLP(v)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.btnGhost}
                    onPress={() => setShowDepositModal(false)}
                    disabled={creatingDeposit}
                  >
                    <Text style={styles.btnGhostTxt}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnPrimary}
                    onPress={confirmDeposit}
                    disabled={creatingDeposit}
                  >
                    <Text style={styles.btnPrimaryTxt}>
                      {creatingDeposit
                        ? 'Redirigiendo...'
                        : 'Continuar con Webpay'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* MODAL: Retiro */}
          <Modal
            visible={showWithdrawModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowWithdrawModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Retiro</Text>

                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.fieldLabel}>Monto a retirar</Text>
                  <TextInput
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    keyboardType="numeric"
                    placeholder="Ej: 50000"
                    placeholderTextColor="#6b7280"
                    style={styles.input}
                  />

                  <Text style={styles.fieldLabel}>
                    Comentario (opcional)
                  </Text>
                  <TextInput
                    value={withdrawNote}
                    onChangeText={setWithdrawNote}
                    placeholder="Ej: Cuenta personal"
                    placeholderTextColor="#6b7280"
                    style={[styles.input, styles.inputMultiline]}
                    multiline
                  />
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.btnGhost}
                    onPress={() => setShowWithdrawModal(false)}
                    disabled={withdrawing}
                  >
                    <Text style={styles.btnGhostTxt}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnPrimary}
                    onPress={confirmWithdraw}
                    disabled={withdrawing}
                  >
                    <Text style={styles.btnPrimaryTxt}>
                      {withdrawing ? 'Procesando...' : 'Confirmar retiro'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* MODAL: Distribuir depósito en metas */}
          <Modal
            visible={showDistributeModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDistributeModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Distribuir depósito</Text>

                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {goals.length === 0 ? (
                    <Text style={styles.emptyText}>
                      No hay metas activas disponibles.
                    </Text>
                  ) : (
                    goals.map((g) => (
                      <View key={g.id} style={{ marginBottom: 12 }}>
                        <Text style={styles.fieldLabel}>{g.title}</Text>
                        <TextInput
                          value={alloc[g.id] || ''}
                          onChangeText={(txt) =>
                            setAlloc((m) => ({ ...m, [g.id]: txt }))
                          }
                          keyboardType="numeric"
                          placeholder="Monto a asignar"
                          placeholderTextColor="#6b7280"
                          style={styles.input}
                        />
                      </View>
                    ))
                  )}
                </ScrollView>

                <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                  <Text style={styles.fieldLabel}>
                    Total a distribuir: {formatCLP(totalAlloc)}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.btnGhost}
                    onPress={() => setShowDistributeModal(false)}
                    disabled={distributing}
                  >
                    <Text style={styles.btnGhostTxt}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnPrimary}
                    onPress={doDistribute}
                    disabled={distributing}
                  >
                    <Text style={styles.btnPrimaryTxt}>
                      {distributing
                        ? 'Distribuyendo...'
                        : 'Confirmar distribución'}
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
