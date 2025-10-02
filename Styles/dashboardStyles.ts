import { StyleSheet } from "react-native";
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#172e53",
  },
  monthBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  monthBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  monthTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 16, fontWeight: "700" },

  kpis: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 },
  card: { flexBasis: "48%", backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  cardLabel: { color: "#666", fontSize: 12 },
  cardValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },

  chartCard: { backgroundColor: "#fff", borderRadius: 12, padding: 8, marginHorizontal: 12, marginTop: 12 },
  chartTitle: { fontWeight: "800", fontSize: 16, margin: 8 },
});
export default s;