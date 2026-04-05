import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import {
  PasswordStrengthIndicator,
  checkPasswordRules,
} from '../src/components/PasswordStrengthIndicator';

describe('checkPasswordRules', () => {
  it('returns all rules unmet for an empty password', () => {
    const rules = checkPasswordRules('');
    expect(rules.every(r => !r.met)).toBe(true);
  });

  it('marks length rule as met when password has 8+ characters', () => {
    const rules = checkPasswordRules('abcdefgh');
    const lengthRule = rules.find(r => r.label === 'At least 8 characters');
    expect(lengthRule?.met).toBe(true);
  });

  it('marks length rule as unmet when password has fewer than 8 characters', () => {
    const rules = checkPasswordRules('abc');
    const lengthRule = rules.find(r => r.label === 'At least 8 characters');
    expect(lengthRule?.met).toBe(false);
  });

  it('marks uppercase rule as met when password contains an uppercase letter', () => {
    const rules = checkPasswordRules('Abcdefgh');
    const uppercaseRule = rules.find(r => r.label === 'One uppercase letter');
    expect(uppercaseRule?.met).toBe(true);
  });

  it('marks uppercase rule as unmet when password has no uppercase letter', () => {
    const rules = checkPasswordRules('abcdefgh');
    const uppercaseRule = rules.find(r => r.label === 'One uppercase letter');
    expect(uppercaseRule?.met).toBe(false);
  });

  it('marks number rule as met when password contains a digit', () => {
    const rules = checkPasswordRules('abcdefg1');
    const numberRule = rules.find(r => r.label === 'One number');
    expect(numberRule?.met).toBe(true);
  });

  it('marks number rule as unmet when password has no digit', () => {
    const rules = checkPasswordRules('abcdefgh');
    const numberRule = rules.find(r => r.label === 'One number');
    expect(numberRule?.met).toBe(false);
  });

  it('marks symbol rule as met when password contains a symbol', () => {
    const rules = checkPasswordRules('abcdefg!');
    const symbolRule = rules.find(r => r.label === 'One symbol');
    expect(symbolRule?.met).toBe(true);
  });

  it('marks symbol rule as unmet when password has no symbol', () => {
    const rules = checkPasswordRules('abcdefgh');
    const symbolRule = rules.find(r => r.label === 'One symbol');
    expect(symbolRule?.met).toBe(false);
  });

  it('returns all rules met for a strong password', () => {
    const rules = checkPasswordRules('Password1!');
    expect(rules.every(r => r.met)).toBe(true);
  });
});

describe('PasswordStrengthIndicator', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<PasswordStrengthIndicator password="" />);
    });
  });

  it('has password-strength-indicator testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PasswordStrengthIndicator password="" />,
      );
    });
    const indicator = renderer!.root.findByProps({
      testID: 'password-strength-indicator',
    });
    expect(indicator).toBeDefined();
  });

  it('renders four rule rows', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PasswordStrengthIndicator password="" />,
      );
    });
    const texts = renderer!.root
      .findAllByType(ReactNative.Text)
      .map(t => t.props.children as string);
    expect(texts).toContain('At least 8 characters');
    expect(texts).toContain('One uppercase letter');
    expect(texts).toContain('One number');
    expect(texts).toContain('One symbol');
  });

  it('renders without crashing in dark mode', async () => {
    useColorSchemeSpy.mockReturnValue('dark');
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<PasswordStrengthIndicator password="Test1!" />);
    });
  });
});
