// Styles/goalsStyles.ts
import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: { padding: spacing.lg, paddingBottom: spacing.lg + 8 },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800' as const },
  subtitle: { color: '#cbd5e1', marginTop: 4 },

  content: { padding: spacing.md, gap: spacing.md },

  input: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.text,
    marginBottom: 10,
  },

  goalTitle: { color: colors.text, fontSize: 16, fontWeight: '700' as const },
  goalMeta: { color: '#cbd5e1', marginTop: 2 },
  goalPct: { color: colors.muted, marginTop: 2 },

  chipsRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: '#1a2236',
    borderColor: '#22304b',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  chipText: { color: '#dbeafe', fontWeight: '700' as const },
});

