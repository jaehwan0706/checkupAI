export const colors = {
  primary: '#00B894',
  primarySoft: '#E3F8F3',
  primaryDark: '#00A381',

  green: '#4CAF82',
  warn: '#D4920E',
  warnSoft: '#FFF8E7',
  danger: '#E17055',
  dangerSoft: '#FEF0ED',

  bg: '#F8FAFB',
  white: '#FFFFFF',
  ink: '#2D3436',
  inkMid: '#636E72',
  inkSoft: '#8A97AC',
  line: '#E8ECF0',
  lineSoft: '#F1F4F7',

  gold: '#F4B942',
  goldSoft: '#FFF8E7',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: colors.ink },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.ink },
  h4: { fontSize: 15, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.ink },
  bodyMid: { fontSize: 14, fontWeight: '400' as const, color: colors.inkMid },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.inkSoft },
  label: { fontSize: 13, fontWeight: '500' as const, color: colors.inkMid },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bottom: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
};
