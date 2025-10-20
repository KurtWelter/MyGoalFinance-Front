import { StyleSheet } from 'react-native';

/** Paleta del Home */
export const BG = '#0f172a';
export const PANEL = '#0b1324';
export const FG = '#e2e8f0';
export const MUTED = '#94a3b8';
export const ACCENT = '#ffb300';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    padding: 20,
    paddingBottom: 36,
  },
  brand: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 6,
  },
  h1: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800' as const,
  },
  subtitle: {
    color: '#cbd5e1',
    marginTop: 6,
  },

  scroll: {
    padding: 16,
    gap: 14,
  },

  loader: {
    backgroundColor: PANEL,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },

  card: {
    backgroundColor: PANEL,
    borderRadius: 16,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#1f2738',
  },
  cardTitle: {
    color: FG,
    fontSize: 16,
    fontWeight: '800' as const,
    flexShrink: 1,
  },
  cardDesc: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
  },

  cta: {
    marginTop: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
  },
  ctaText: {
    color: '#1f2738',
    fontWeight: '800' as const,
    fontSize: 16,
  },
});
