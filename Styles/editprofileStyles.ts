// Styles/editProfileStyles.ts
import { StyleSheet } from 'react-native';

// Paleta (exportada por si quieres usar colores en el componente)
export const BG = '#0f172a';
export const PANEL = '#0b1324';
export const INPUT_BG = '#111827';
export const INPUT_BORDER = '#1f2937';
export const FG = '#e2e8f0';
export const MUTED = '#94a3b8';
export const ACCENT = '#ffb300';
export const ACCENT_DARK = '#1f2738';
export const ERROR = '#e11d48';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: { padding: 20, paddingBottom: 40 },
  brand: { color: '#cbd5e1', fontSize: 14, marginBottom: 6 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' as const },
  subtitle: { color: '#cbd5e1', marginTop: 4 },

  scroll: { padding: 16 },
  card: {
    backgroundColor: PANEL,
    borderRadius: 16,
    padding: 16,
  },

  fieldHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: { color: FG, fontWeight: '700' as const },

  chipsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chipsWrap: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  chipIdle: {
    backgroundColor: BG,
    borderColor: INPUT_BORDER,
  },
  chipSel: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  chipText: { color: FG },
  chipSelText: { color: ACCENT_DARK, fontWeight: '700' as const },

  input: {
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: FG,
  },
  helper: { color: MUTED, marginTop: 6 },

  divider: {
    height: 1,
    backgroundColor: '#111827',
    marginVertical: 14,
  },

  actions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    flexDirection: 'row' as const,
  },
  btnPrimary: { backgroundColor: ACCENT },
  btnPrimaryText: { color: ACCENT_DARK, fontWeight: '800' as const },
  btnGhost: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  btnGhostText: { color: FG, fontWeight: '700' as const },

  disclaimer: {
    color: MUTED,
    marginTop: 16,
    fontSize: 12,
  },
});

export default styles;
