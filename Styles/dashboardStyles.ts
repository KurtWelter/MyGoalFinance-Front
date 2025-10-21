// Styles/dashboardStyles.ts
import { StyleSheet } from 'react-native';

const BG = '#0f172a';
const PANEL = '#0b1324';
const BORDER = '#1f2937';
const FG = '#e2e8f0';
const MUTED = '#94a3b8';
const ACCENT = '#ffb300';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: { padding: 16, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff1a',
  },
  h1: { color: FG, fontSize: 18, fontWeight: '800' },

  kpisRow: { flexDirection: 'row', gap: 10 },
  kpi: {
    flex: 1,
    backgroundColor: PANEL,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  kpiLabel: { color: MUTED, fontSize: 12, marginBottom: 4 },
  kpiValue: { color: FG, fontSize: 16, fontWeight: '800' },

  scroll: { flex: 1 },
  content: { padding: 14, gap: 12 },

  card: {
    backgroundColor: PANEL,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { color: FG, fontSize: 15, fontWeight: '700' },

  chart: { marginTop: 4, borderRadius: 12 },

  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
