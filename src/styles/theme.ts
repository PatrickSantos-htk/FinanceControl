export const theme = {
  colors: {
    bg: '#121214',
    surface: '#202024',
    surface2: '#29292E',
    border: '#323238',
    text: '#E1E1E6',
    textMuted: '#8D8D99',
    textSubtle: '#7C7C8A',
    white: '#FFFFFF',
    green: '#00B37E',
    greenStrong: '#00875F',
    greenDark: '#015F43',
    red: '#F75A68',
    redStrong: '#AB222E',
    yellow: '#FBA94C',
    blue: '#81D8F7',
  },
  radius: '8px',
  maxWidth: '1120px',
  bp: {
    md: '768px',
  },
} as const

export type AppTheme = typeof theme
