import spacing from '../src/theme/spacing';

describe('spacing', () => {
  it('contains all required scale values', () => {
    expect(spacing[1]).toBe(4);
    expect(spacing[2]).toBe(8);
    expect(spacing[3]).toBe(12);
    expect(spacing[4]).toBe(16);
    expect(spacing[5]).toBe(20);
    expect(spacing[6]).toBe(24);
    expect(spacing[8]).toBe(32);
    expect(spacing[10]).toBe(40);
    expect(spacing[12]).toBe(48);
  });

  it('all values are positive numbers', () => {
    Object.values(spacing).forEach(value => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  it('values are in ascending order', () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
