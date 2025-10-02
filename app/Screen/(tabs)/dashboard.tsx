// app/Screen/(tabs)/dashboard.tsx
import s from "@/Styles/dashboardStyles";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryPie, VictoryTheme } from "victory-native";
import api from "../../../constants/api";

type Tx = {
  id: number | string;
  amount: number;
  type: "income" | "expense";
  category_id?: number | null;
  description?: string | null;
  occurred_at: string; // YYYY-MM-DD
};

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

function ymAdd(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function ymLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}
async function fetchMonthData(ym: string) {
  const rows = await api.listTransactions({ month: ym });
  return Array.isArray(rows) ? rows as Tx[] : [];
}

export default function Dashboard() {
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState<Tx[]>([]);
  const [trend, setTrend] = useState<{ ym: string; net: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const kpis = useMemo(() => {
    const inc = rows.reduce((s, r) => s + (r.type === "income" ? r.amount : 0), 0);
    const exp = rows.reduce((s, r) => s + (r.type === "expense" ? r.amount : 0), 0);
    const net = inc - exp;
    const rate = inc > 0 ? net / inc : 0;
    return { inc, exp, net, rate };
  }, [rows]);

  const byTypeData = useMemo(
    () => [
      { x: "Ingreso", y: kpis.inc || 0 },
      { x: "Gasto", y: kpis.exp || 0 },
    ],
    [kpis]
  );

  const expensePie = useMemo(() => {
    // si no usas categorías: agrupa por "sin categoría"
    const totalExp = rows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    if (totalExp <= 0) return [];
    return [
      { x: "Gastos", y: totalExp },
      { x: "Ahorro/otros", y: Math.max(kpis.inc - totalExp, 0) },
    ];
  }, [rows, kpis.inc]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      // Mes actual
      const cur = await fetchMonthData(month);
      setRows(cur);

      // Últimos 6 meses (incluye el actual)
      const months: string[] = [];
      let it = month;
      for (let i = 0; i < 6; i++) {
        months.unshift(it); // orden cronológico
        it = ymAdd(it, -1);
      }
      const lists = await Promise.all(months.map(m => fetchMonthData(m)));
      const trendData = months.map((m, i) => {
        const inc = lists[i].reduce((s, r) => s + (r.type === "income" ? r.amount : 0), 0);
        const exp = lists[i].reduce((s, r) => s + (r.type === "expense" ? r.amount : 0), 0);
        return { ym: m, net: inc - exp };
      });
      setTrend(trendData);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Selector de mes */}
      <View style={s.header}>
        <Pressable style={s.monthBtn} onPress={() => setMonth(m => ymAdd(m, -1))}>
          <Text style={s.monthBtnTxt}>◀︎</Text>
        </Pressable>
        <Text style={s.monthTitle}>{ymLabel(month)}</Text>
        <Pressable style={s.monthBtn} onPress={() => setMonth(m => ymAdd(m, +1))}>
          <Text style={s.monthBtnTxt}>▶︎</Text>
        </Pressable>
      </View>

      {/* KPIs */}
      <View style={s.kpis}>
        <View style={s.card}>
          <Text style={s.cardLabel}>Ingresos</Text>
          <Text style={[s.cardValue, { color: "#2e7d32" }]}>{CLP.format(kpis.inc)}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.cardLabel}>Gastos</Text>
          <Text style={[s.cardValue, { color: "#c62828" }]}>{CLP.format(kpis.exp)}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.cardLabel}>Neto</Text>
          <Text style={[s.cardValue, { color: kpis.net >= 0 ? "#2e7d32" : "#c62828" }]}>{CLP.format(kpis.net)}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.cardLabel}>% Ahorro</Text>
          <Text style={s.cardValue}>{(kpis.rate * 100).toFixed(0)}%</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          {/* Gráfico Ingreso vs Gasto */}
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Ingreso vs Gasto</Text>
            <VictoryChart theme={VictoryTheme.material} domainPadding={30}>
              <VictoryAxis />
              <VictoryAxis dependentAxis tickFormat={(t) => CLP.format(t).replace("$", "")} />
              <VictoryBar data={byTypeData} x="x" y="y" />
            </VictoryChart>
          </View>

          {/* Pie simple (Gasto vs resto) */}
          {expensePie.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Distribución simple</Text>
              <VictoryPie data={expensePie} labels={({ datum }) => `${datum.x}\n${CLP.format(datum.y)}`} />
            </View>
          )}

          {/* Tendencia 6 meses (Neto) */}
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Neto últimos 6 meses</Text>
            <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
              <VictoryAxis tickFormat={(t) => t.slice(2)} />{/* "2025-10" → "25-10" */}
              <VictoryAxis dependentAxis tickFormat={(t) => CLP.format(t).replace("$", "")} />
              <VictoryBar data={trend} x="ym" y="net" />
            </VictoryChart>
          </View>
        </>
      )}
    </ScrollView>
  );
}