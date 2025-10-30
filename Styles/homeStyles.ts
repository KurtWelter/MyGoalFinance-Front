// Styles/homeStyles.ts
import { StyleSheet } from 'react-native'

/** Paleta y tokens */
const c = {
  bg: '#141a26',
  panel: '#1f2738',
  text: '#e8edf7',
  textMuted: '#9aa7bf',
  textSoft: '#c8d0e3',
  line: '#253049',
  accent: '#f3b34c',
  accentText: '#1f2738',
  info: '#93c5fd',
}

const r = { xs: 8, sm: 10, md: 12, lg: 14, xl: 16, xxl: 20 }
const s = { xs: 6, sm: 8, md: 12, lg: 14, xl: 16, xxl: 20 }

/** Estilos Home */
const styles = StyleSheet.create({
  /* ───────── Layout ───────── */
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { flex: 1 },
  content: { padding: s.xl, gap: s.xl },

  /* ───────── Header ───────── */
  header: { paddingHorizontal: s.xl, paddingTop: 12, paddingBottom: 20 },
  brand: { color: c.text, fontWeight: '800', fontSize: 18, letterSpacing: 0.3 },
  h1: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 0.2 },
  subtitle: { color: c.textSoft, marginTop: 4 },

  /* ───────── Filas/Contenedores ───────── */
  row: { flexDirection: 'row', gap: 12 },

  card: {
    backgroundColor: c.panel,
    borderRadius: r.xl,
    padding: s.md,
    borderWidth: 1,
    borderColor: c.line,
  },

  /* ───────── KPIs ───────── */
  kpi: {
    flex: 1,
    backgroundColor: c.panel,
    borderRadius: r.xl,
    padding: s.md,
    borderWidth: 1,
    borderColor: c.line,
  },
  kpiIconWrap: {
    width: 28, height: 28, borderRadius: r.lg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  kpiLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
  kpiValue: { color: c.text, fontSize: 18, fontWeight: '800', marginTop: 2 },

  /* ───────── Tasas / Rates ───────── */
  rate: {
    flex: 1,
    backgroundColor: c.panel,
    borderRadius: r.xl,
    padding: s.md,
    borderWidth: 1,
    borderColor: c.line,
  },
  rateTitle: { color: c.textSoft, fontWeight: '700' },
  rateValue: { color: '#fff', fontWeight: '900', fontSize: 18, marginTop: 4 },
  rateHint: { color: '#92a0ba', marginTop: 2, fontSize: 12 },

  ratesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  pill: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999, borderWidth: 1, borderColor: c.line,
  },
  pillCode: { color: c.info, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  pillValue: { color: c.text, fontWeight: '800', fontSize: 14, marginTop: 2 },
  ratesUpdated: { color: c.textMuted, fontSize: 11, marginLeft: 'auto' },

  /* ───────── Acciones Rápidas ───────── */
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1,
    backgroundColor: c.accent,
    borderRadius: r.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  quickIconWrap: {
    width: 28, height: 28, borderRadius: r.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  quickTxt: { color: c.accentText, fontWeight: '800' },

  /* ───────── Secciones ───────── */
  section: { gap: 10 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sectionAction: { color: c.accent, fontWeight: '800' },

  /* ───────── Tiles genéricos ───────── */
  tile: {
    backgroundColor: c.panel,
    borderRadius: r.lg,
    padding: s.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.line,
  },
  tileTitle: { color: c.text, fontWeight: '700' },
  tileSubtitle: { color: c.textMuted, marginTop: 2 },

  /* ───────── Goals Preview ───────── */
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon: {
    width: 36, height: 36, borderRadius: r.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  goalTitle: { color: c.text, fontWeight: '700' },
  goalMeta: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  progressWrap: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, overflow: 'hidden', marginTop: 8,
  },
  progressFill: { height: '100%', backgroundColor: c.accent },

  /* ───────── News ───────── */
  newsItem: {
    backgroundColor: c.panel,
    borderRadius: r.lg,
    padding: s.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.line,
  },
  newsTitle: { color: c.text, fontWeight: '700' },
  newsMeta: { color: c.textMuted, marginTop: 4, fontSize: 12 },
  newsLink: { color: c.accent, marginTop: 6, fontWeight: '800' },

  /* ───────── Botones/CTAs ───────── */
  cta: {
    backgroundColor: c.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  ctaText: { color: c.accentText, fontWeight: '900' },

  /* ───────── Estados / utilitarios ───────── */
  loader: { paddingVertical: 14, alignItems: 'center' },
  empty: { backgroundColor: c.panel, borderRadius: r.lg, padding: s.md, borderWidth: 1, borderColor: c.line },
  emptyTxt: { color: c.textMuted },
  separator: { height: 1, backgroundColor: c.line, opacity: 0.6, marginVertical: 12 },
})

export default styles
