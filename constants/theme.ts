// constants/theme.ts
export const colors = {
  bg: '#0f172a',
  panel: '#0b1324',
  card: '#0b1324',
  border: '#111827',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#ffb300',
  accentDark: '#1f2738',
  green: '#26c281',
  red: '#ff5a5f',
  blue: '#4dabf7',
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
};

export const shadow = {
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  } as const,
};
