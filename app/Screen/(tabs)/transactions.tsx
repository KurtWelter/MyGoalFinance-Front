// app/Screen/(tabs)/transactions.tsx
import styles from "@/Styles/transactionsStyles";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import api from "../../../constants/api";

type Tx = {
  id: number | string;
  amount: number;
  type: "income" | "expense";
  category_id?: number | null;
  description?: string | null;
  occurred_at: string; // YYYY-MM-DD
};

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function ymAdd(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}
function ymLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

export default function Transactions() {
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal crear
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newAmount, setNewAmount] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");

  const totals = useMemo(() => {
    const inc = rows.reduce((s, r) => s + (r.type === "income" ? r.amount : 0), 0);
    const exp = rows.reduce((s, r) => s + (r.type === "expense" ? r.amount : 0), 0);
    return { inc, exp, net: inc - exp };
  }, [rows]);

  const fetchMonth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listTransactions({ month }); // 👈 tu api ya normaliza YYYY-MM
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudieron cargar las transacciones");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      fetchMonth();
    }, [fetchMonth])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchMonth();
    } finally {
      setRefreshing(false);
    }
  }, [fetchMonth]);

  const createTx = async () => {
    const amount = Number(newAmount.replace(/\./g, "").replace(",", "."));
    if (!amount || amount <= 0) {
      Alert.alert("Valida", "Ingresa un monto válido");
      return;
    }
    try {
      await api.createTransaction({
        amount,
        type: newType,
        description: newDesc || null,
        // occurred_at: deja que el backend ponga hoy por defecto, o envía YYYY-MM-DD
      });
      setShowNew(false);
      setNewAmount("");
      setNewDesc("");
      setNewType("expense");
      await fetchMonth();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo crear el movimiento");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Mes + Totales */}
      <View style={styles.header}>
        <Pressable style={styles.monthBtn} onPress={() => setMonth((m) => ymAdd(m, -1))}>
          <Text style={styles.monthBtnTxt}>◀︎</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{ymLabel(month)}</Text>
        <Pressable style={styles.monthBtn} onPress={() => setMonth((m) => ymAdd(m, +1))}>
          <Text style={styles.monthBtnTxt}>▶︎</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.sumLabel}>Ingresos</Text>
          <Text style={[styles.sumValue, { color: "#2e7d32" }]}>{CLP.format(totals.inc)}</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.sumLabel}>Gastos</Text>
          <Text style={[styles.sumValue, { color: "#c62828" }]}>{CLP.format(totals.exp)}</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.sumLabel}>Neto</Text>
          <Text
            style={[
              styles.sumValue,
              { color: totals.net >= 0 ? "#2e7d32" : "#c62828" },
            ]}
          >
            {CLP.format(totals.net)}
          </Text>
        </View>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: "#666", marginTop: 24 }}>
              Sin movimientos en este mes
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowDesc}>{item.description || "(Sin descripción)"}</Text>
                <Text style={styles.rowDate}>{item.occurred_at}</Text>
              </View>
              <Text
                style={[
                  styles.rowAmount,
                  { color: item.type === "income" ? "#2e7d32" : "#c62828" },
                ]}
              >
                {item.type === "income" ? "+" : "-"} {CLP.format(item.amount)}
              </Text>
            </View>
          )}
        />
      )}

      {/* FAB Nuevo */}
      <Pressable style={styles.fab} onPress={() => setShowNew(true)}>
        <Text style={styles.fabTxt}>＋</Text>
      </Pressable>

      {/* Modal Crear */}
      <Modal visible={showNew} transparent animationType="slide" onRequestClose={() => setShowNew(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo movimiento</Text>

            <View style={styles.typeSwitch}>
              <Pressable
                style={[styles.typeBtn, newType === "expense" && styles.typeBtnActive]}
                onPress={() => setNewType("expense")}
              >
                <Text style={[styles.typeBtnTxt, newType === "expense" && styles.typeBtnTxtActive]}>Gasto</Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, newType === "income" && styles.typeBtnActive]}
                onPress={() => setNewType("income")}
              >
                <Text style={[styles.typeBtnTxt, newType === "income" && styles.typeBtnTxtActive]}>Ingreso</Text>
              </Pressable>
            </View>

            <TextInput
              placeholder="Monto (CLP)"
              keyboardType="numeric"
              value={newAmount}
              onChangeText={setNewAmount}
              style={styles.input}
            />
            <TextInput
              placeholder="Descripción"
              value={newDesc}
              onChangeText={setNewDesc}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, { backgroundColor: "#ccc" }]} onPress={() => setShowNew(false)}>
                <Text style={styles.btnTxt}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, { backgroundColor: "#f39c12" }]} onPress={createTx}>
                <Text style={[styles.btnTxt, { color: "#fff" }]}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
