import typography, {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from '../src/theme/typography';

describe('typography', () => {
  it('exports fontFamily with regular, medium, and bold keys', () => {
    expect(fontFamily.regular).toBeDefined();
    expect(fontFamily.medium).toBeDefined();
    expect(fontFamily.bold).toBeDefined();
  });

  it('exports fontSize with expected scale keys', () => {
    const expectedKeys = ['xs', 'sm', 'md', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];
    expectedKeys.forEach(key => {
      expect(fontSize[key as keyof typeof fontSize]).toBeGreaterThan(0);
    });
  });

  it('fontSize values are in ascending order for core sizes', () => {
    expect(fontSize.xs).toBeLessThan(fontSize.sm);
    expect(fontSize.sm).toBeLessThan(fontSize.md);
    expect(fontSize.md).toBeLessThan(fontSize.base);
    expect(fontSize.base).toBeLessThan(fontSize.lg);
    expect(fontSize.lg).toBeLessThan(fontSize.xl);
  });

  it('exports fontWeight with string values', () => {
    expect(fontWeight.regular).toBe('400');
    expect(fontWeight.medium).toBe('500');
    expect(fontWeight.semiBold).toBe('600');
    expect(fontWeight.bold).toBe('700');
  });

  it('exports lineHeight with numeric values', () => {
    expect(lineHeight.tight).toBeGreaterThan(1);
    expect(lineHeight.normal).toBeGreaterThan(lineHeight.tight);
    expect(lineHeight.relaxed).toBeGreaterThan(lineHeight.normal);
  });

  it('default export contains all sub-tokens', () => {
    expect(typography.fontFamily).toBe(fontFamily);
    expect(typography.fontSize).toBe(fontSize);
    expect(typography.fontWeight).toBe(fontWeight);
    expect(typography.lineHeight).toBe(lineHeight);
  });
});
