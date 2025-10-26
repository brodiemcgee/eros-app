// Thirsty app theme (inspired by Hinge's sophisticated aesthetic)

export const COLORS = {
  // Primary colors - Purple (Hinge-inspired)
  primary: '#6B2E5F', // Deep purple for navigation, sent messages, accents
  primaryDark: '#581F4A',
  primaryLight: '#8A4375',

  // Secondary - Teal for primary CTAs
  secondary: '#1C7C7C',
  secondaryDark: '#156363',
  secondaryLight: '#239595',

  // Backgrounds
  background: '#FFFFFF', // Pure white
  backgroundSecondary: '#F8F8F8', // Very light gray
  backgroundTertiary: '#F0F0F0', // Light gray for received messages

  // Text
  text: '#000000', // Black
  textSecondary: '#757575', // Medium gray
  textTertiary: '#9E9E9E', // Light gray
  textMuted: '#BDBDBD', // Very light gray

  // Status colors
  success: '#00D448', // Keep green for online status
  error: '#FF3B30',
  warning: '#FFB800',
  info: '#6B2E5F', // Use primary purple

  // Grays (light theme)
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
  border: '#E0E0E0', // Subtle light gray
  borderLight: '#F0F0F0',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Online status
  online: '#00D448',
  offline: '#BDBDBD',

  // Card colors
  cardBackground: '#FFFFFF',
  cardBorder: '#E0E0E0',
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
  xs: 12, // Caption
  sm: 14, // Small text
  md: 16, // Body
  lg: 18, // Body large
  xl: 20, // H3
  xxl: 24, // H2
  xxxl: 28, // H1
  display: 40, // Display headings
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

// Font families - serif for headers, sans-serif for body
export const FONT_FAMILIES = {
  // Use Playfair Display for headers if available, fallback to Georgia
  serif: "'Playfair Display', Georgia, serif",
  sansSerif: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12, // Standard for cards
  lg: 16, // Large cards
  xl: 20,
  pill: 9999, // For pill-shaped buttons
  round: 9999, // For circular elements
};

export const SHADOWS = {
  // Softer, lighter shadows for light theme
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const TAP_ICONS = {
  flame: '🔥',
  woof: '🐾',
  looking: '👀',
  friendly: '👋',
  hot: '🌶️',
};
