const palette = {
  brand: '#4F6AF5',
  brandDark: '#3A52D4',
  white: '#FFFFFF',
  black: '#000000',
  grey50: '#F9FAFB',
  grey100: '#F3F4F6',
  grey200: '#E5E7EB',
  grey300: '#D1D5DB',
  grey400: '#9CA3AF',
  grey500: '#6B7280',
  grey600: '#4B5563',
  grey700: '#374151',
  grey800: '#1F2937',
  grey900: '#111827',
  red400: '#F87171',
  red500: '#EF4444',
  green400: '#4ADE80',
  green500: '#22C55E',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
} as const;

export type ColorTokens = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  error: string;
  success: string;
  warning: string;
  border: string;
};

export const lightColors: ColorTokens = {
  background: palette.grey50,
  surface: palette.white,
  textPrimary: palette.grey900,
  textSecondary: palette.grey500,
  primary: palette.brand,
  error: palette.red500,
  success: palette.green500,
  warning: palette.amber500,
  border: palette.grey200,
};

export const darkColors: ColorTokens = {
  background: palette.grey900,
  surface: palette.grey800,
  textPrimary: palette.white,
  textSecondary: palette.grey400,
  primary: palette.brandDark,
  error: palette.red400,
  success: palette.green400,
  warning: palette.amber400,
  border: palette.grey700,
};

export { palette };
