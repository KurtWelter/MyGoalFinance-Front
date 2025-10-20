// Styles/profileStyles.ts
import { StyleSheet } from 'react-native';

export const ACCENT = '#ffb300';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 40,
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
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  card: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    padding: 14,
  },

  centerCol: {
    alignItems: 'center' as const,
    gap: 10,
  },

  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0b1324',
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#334155',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700' as const,
  },
  fab: {
    position: 'absolute' as const,
    right: -6,
    bottom: -6,
    backgroundColor: ACCENT,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#1f2738',
    elevation: 2,
  },

  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  meta: {
    color: '#94a3b8',
  },

  rowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  linkBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  linkText: {
    color: ACCENT,
    fontWeight: '700' as const,
  },

  itemRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    borderBottomColor: '#111827',
    borderBottomWidth: 1,
  },
  itemLabel: {
    color: '#94a3b8',
  },
  itemValue: {
    color: '#e2e8f0',
    fontWeight: '600' as const,
  },

  rowBtns: {
    flexDirection: 'row' as const,
    gap: 12,
  },

  btnPrimary: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    flexDirection: 'row' as const,
  },
  btnPrimaryText: {
    color: '#1f2738',
    fontWeight: '800' as const,
  },
  btnGhost: {
    backgroundColor: '#0b1324',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    flexDirection: 'row' as const,
  },
  btnGhostText: {
    color: '#cbd5e1',
    fontWeight: '700' as const,
  },
});

export default styles;
