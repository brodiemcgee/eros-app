// Eros app theme (inspired by Grindr's yellow/black aesthetic)

export const COLORS = {
  // Primary colors
  primary: '#FFCC00', // Grindr-inspired yellow
  primaryDark: '#E6B800',
  primaryLight: '#FFD633',

  // Backgrounds
  background: '#000000',
  backgroundSecondary: '#1A1A1A',
  backgroundTertiary: '#2A2A2A',

  // Text
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  textMuted: '#666666',

  // Status colors
  success: '#00D448',
  error: '#FF3B30',
  warning: '#FFCC00',
  info: '#0A84FF',

  // Grays
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Borders
  border: '#333333',
  borderLight: '#444444',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Online status
  online: '#00D448',
  offline: '#666666',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 6.27,
    elevation: 8,
  },
};

export const TAP_ICONS = {
  flame: '🔥',
  woof: '🐾',
  looking: '👀',
  friendly: '👋',
  hot: '🌶️',
};
