import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import {
  useTheme,
  lightTheme,
  darkTheme,
  lightColors,
  darkColors,
  spacing,
  spacingScale,
  typography,
  typographyTokens,
  palette,
  Theme,
} from '../src/theme';

function ThemeConsumer({
  onTheme,
}: {
  onTheme: (t: Theme) => void;
}): React.ReactElement | null {
  onTheme(useTheme());
  return null;
}

describe('theme/index', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  describe('useTheme', () => {
    it('returns lightTheme when color scheme is light', async () => {
      useColorSchemeSpy.mockReturnValue('light');
      let captured: Theme | undefined;
      await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <ThemeConsumer onTheme={t => { captured = t; }} />,
        );
      });
      expect(captured).toEqual(lightTheme);
    });

    it('returns darkTheme when color scheme is dark', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let captured: Theme | undefined;
      await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <ThemeConsumer onTheme={t => { captured = t; }} />,
        );
      });
      expect(captured).toEqual(darkTheme);
    });

    it('returns lightTheme when color scheme is null', async () => {
      useColorSchemeSpy.mockReturnValue(null);
      let captured: Theme | undefined;
      await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <ThemeConsumer onTheme={t => { captured = t; }} />,
        );
      });
      expect(captured).toEqual(lightTheme);
    });
  });

  describe('exported tokens', () => {
    it('lightTheme has colors, spacing, and typography', () => {
      expect(lightTheme.colors).toBeDefined();
      expect(lightTheme.spacing).toBeDefined();
      expect(lightTheme.typography).toBeDefined();
    });

    it('darkTheme has colors, spacing, and typography', () => {
      expect(darkTheme.colors).toBeDefined();
      expect(darkTheme.spacing).toBeDefined();
      expect(darkTheme.typography).toBeDefined();
    });

    it('re-exports lightColors and darkColors', () => {
      expect(lightColors).toBeDefined();
      expect(darkColors).toBeDefined();
    });

    it('re-exports spacing', () => {
      expect(spacing).toBeDefined();
      expect(spacingScale).toBe(spacing);
    });

    it('re-exports typography', () => {
      expect(typography).toBeDefined();
      expect(typographyTokens).toBe(typography);
    });

    it('re-exports palette', () => {
      expect(palette).toBeDefined();
      expect(palette.brand).toBeDefined();
    });
  });
});
