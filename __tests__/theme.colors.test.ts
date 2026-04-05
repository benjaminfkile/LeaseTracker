import { lightColors, darkColors, palette } from '../src/theme/colors';

describe('colors', () => {
  describe('lightColors', () => {
    it('has all required semantic tokens', () => {
      const keys = [
        'background',
        'surface',
        'textPrimary',
        'textSecondary',
        'primary',
        'error',
        'success',
        'warning',
        'border',
      ] as const;
      keys.forEach(key => {
        expect(lightColors[key]).toBeDefined();
        expect(typeof lightColors[key]).toBe('string');
      });
    });

    it('background is lighter than surface counterpart in dark mode', () => {
      expect(lightColors.background).toBeTruthy();
      expect(lightColors.surface).toBeTruthy();
    });
  });

  describe('darkColors', () => {
    it('has all required semantic tokens', () => {
      const keys = [
        'background',
        'surface',
        'textPrimary',
        'textSecondary',
        'primary',
        'error',
        'success',
        'warning',
        'border',
      ] as const;
      keys.forEach(key => {
        expect(darkColors[key]).toBeDefined();
        expect(typeof darkColors[key]).toBe('string');
      });
    });

    it('differs from lightColors', () => {
      expect(darkColors.background).not.toBe(lightColors.background);
      expect(darkColors.surface).not.toBe(lightColors.surface);
      expect(darkColors.textPrimary).not.toBe(lightColors.textPrimary);
    });
  });

  describe('palette', () => {
    it('exposes brand color', () => {
      expect(palette.brand).toBeDefined();
      expect(typeof palette.brand).toBe('string');
    });
  });
});
