import { useColorScheme } from 'react-native';
import { darkColors, lightColors, palette } from './colors';
import type { ColorTokens } from './colors';
import spacing from './spacing';
import type { SpacingScale } from './spacing';
import typography from './typography';
import { useAppearanceStore } from '../stores/appearanceStore';

export type Theme = {
  colors: ColorTokens;
  spacing: SpacingScale;
  typography: typeof typography;
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  typography,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  typography,
};

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const mode = useAppearanceStore(state => state.mode);

  const effectiveScheme =
    mode === 'system' ? systemScheme : mode;

  return effectiveScheme === 'dark' ? darkTheme : lightTheme;
}

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const mode = useAppearanceStore(state => state.mode);

  const effectiveScheme =
    mode === 'system' ? systemScheme : mode;

  return effectiveScheme === 'dark';
}

export { palette };
export type { ColorTokens, SpacingScale };
export { spacing, typography };
export { lightColors, darkColors } from './colors';
export { default as spacingScale } from './spacing';
export { default as typographyTokens } from './typography';
