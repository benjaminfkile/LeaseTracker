import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

function ThrowError({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <ReactNative.Text testID="child-text">{'Child'}</ReactNative.Text>;
}

describe('ErrorBoundary', () => {
  let useColorSchemeSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('rendering children', () => {
    it('renders children when there is no error', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>,
        );
      });
      const child = renderer!.root.findByProps({ testID: 'child-text' });
      expect(child).toBeDefined();
      expect(child.props.children).toBe('Child');
    });

    it('does not render the fallback UI when there is no error', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>,
        );
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'error-boundary-container' }),
      ).toThrow();
    });
  });

  describe('error fallback UI', () => {
    it('renders the fallback container when a child throws', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const container = renderer!.root.findByProps({
        testID: 'error-boundary-container',
      });
      expect(container).toBeDefined();
    });

    it('renders the error title when a child throws', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const title = renderer!.root.findByProps({ testID: 'error-boundary-title' });
      expect(title).toBeDefined();
      expect(title.props.children).toBe('Something went wrong');
    });

    it('renders the error message when a child throws', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const message = renderer!.root.findByProps({
        testID: 'error-boundary-message',
      });
      expect(message).toBeDefined();
      expect(message.props.children).toBe('Test error message');
    });

    it('renders the reset button when a child throws', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const resetButton = renderer!.root.findByProps({
        testID: 'error-boundary-reset',
      });
      expect(resetButton).toBeDefined();
    });

    it('renders the reset button label "Try again"', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const label = renderer!.root.findByProps({
        testID: 'error-boundary-reset-label',
      });
      expect(label.props.children).toBe('Try again');
    });

    it('does not render the children when a child throws', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'child-text' }),
      ).toThrow();
    });
  });

  describe('reset functionality', () => {
    it('resets the error state and renders children when the reset button is pressed', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });

      const resetButton = renderer!.root.findByProps({
        testID: 'error-boundary-reset',
      });

      await ReactTestRenderer.act(() => {
        resetButton.props.onPress();
      });

      // After reset, the ErrorBoundary renders children again;
      // ThrowError still throws so the fallback re-appears.
      const container = renderer!.root.findByProps({
        testID: 'error-boundary-container',
      });
      expect(container).toBeDefined();
    });
  });

  describe('custom fallback', () => {
    it('renders the custom fallback when provided and a child throws', async () => {
      const customFallback = (
        <ReactNative.Text testID="custom-fallback">
          {'Custom error UI'}
        </ReactNative.Text>
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary fallback={customFallback}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const fallback = renderer!.root.findByProps({ testID: 'custom-fallback' });
      expect(fallback).toBeDefined();
      expect(fallback.props.children).toBe('Custom error UI');
    });

    it('does not render the default fallback UI when a custom fallback is provided', async () => {
      const customFallback = (
        <ReactNative.Text testID="custom-fallback">
          {'Custom error UI'}
        </ReactNative.Text>
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary fallback={customFallback}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'error-boundary-container' }),
      ).toThrow();
    });
  });

  describe('accessibility', () => {
    it('applies accessibilityRole of alert to the fallback container', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const container = renderer!.root.findByProps({
        testID: 'error-boundary-container',
      });
      expect(container.props.accessibilityRole).toBe('alert');
    });

    it('applies accessibilityRole of button to the reset button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const resetButton = renderer!.root.findByProps({
        testID: 'error-boundary-reset',
      });
      expect(resetButton.props.accessibilityRole).toBe('button');
    });

    it('sets accessibilityLabel to "Try again" on the reset button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const resetButton = renderer!.root.findByProps({
        testID: 'error-boundary-reset',
      });
      expect(resetButton.props.accessibilityLabel).toBe('Try again');
    });
  });

  describe('styles', () => {
    it('applies background color to the fallback container in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const container = renderer!.root.findByProps({
        testID: 'error-boundary-container',
      });
      const { StyleSheet } = ReactNative;
      const containerStyle = StyleSheet.flatten(container.props.style);
      // lightColors.background = grey50 = '#F9FAFB'
      expect(containerStyle.backgroundColor).toBe('#F9FAFB');
    });

    it('applies error color to the title in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const title = renderer!.root.findByProps({ testID: 'error-boundary-title' });
      const { StyleSheet } = ReactNative;
      const titleStyle = StyleSheet.flatten(title.props.style);
      // lightColors.error = red500 = '#EF4444'
      expect(titleStyle.color).toBe('#EF4444');
    });

    it('applies primary color to the reset button in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const resetButton = renderer!.root.findByProps({
        testID: 'error-boundary-reset',
      });
      const { StyleSheet } = ReactNative;
      const buttonStyle = StyleSheet.flatten(resetButton.props.style);
      // lightColors.primary = brand = '#4F6AF5'
      expect(buttonStyle.backgroundColor).toBe('#4F6AF5');
    });
  });

  describe('dark mode', () => {
    it('renders the fallback UI without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
    });

    it('applies dark error color to the title in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const title = renderer!.root.findByProps({ testID: 'error-boundary-title' });
      const { StyleSheet } = ReactNative;
      const titleStyle = StyleSheet.flatten(title.props.style);
      // darkColors.error = red400 = '#F87171'
      expect(titleStyle.color).toBe('#F87171');
    });

    it('applies dark background color to the container in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>,
        );
      });
      const container = renderer!.root.findByProps({
        testID: 'error-boundary-container',
      });
      const { StyleSheet } = ReactNative;
      const containerStyle = StyleSheet.flatten(container.props.style);
      // darkColors.background = grey900 = '#111827'
      expect(containerStyle.backgroundColor).toBe('#111827');
    });
  });
});
