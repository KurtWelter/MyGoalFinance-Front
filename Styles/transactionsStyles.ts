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
    backgroundColor: '#0b1324',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  kpiLabel: { color: MUTED, fontSize: 12, marginBottom: 4 },
  kpiValue: { color: FG, fontSize: 16, fontWeight: '800' },

  scroll: { flex: 1 },
  content: { padding: 14, gap: 12 },

  loader: {
    backgroundColor: PANEL,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  empty: { backgroundColor: PANEL, borderRadius: 14, padding: 16 },
  emptyTxt: { color: MUTED },

  card: { backgroundColor: PANEL, borderRadius: 14, padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  rowTitle: { color: FG, fontWeight: '600' },
  rowMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  rowAmount: { fontWeight: '800', marginLeft: 10 },

  // Add panel (sticky bottom)
  addPanelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  addPanel: {
    backgroundColor: PANEL,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    borderTopWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f015',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIdle: { backgroundColor: 'transparent' },
  tabActive: { backgroundColor: '#e2e8f02a' },
  tabTxt: { color: FG, fontWeight: '700' },
  tabActiveTxt: { color: FG, fontWeight: '800' },

  input: {
    backgroundColor: '#111827',
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: FG,
  },

  btnPrimary: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'row',
  },

  title: {
  color: '#ffffff',
  fontSize: 28,         // grande como en la captura
  fontWeight: '800',
  textAlign: 'center',
  marginBottom: 8,      // pequeño espacio antes del mes
},
btnPrimaryTxt: { color: '#1f2738', fontWeight: '800' },

});
