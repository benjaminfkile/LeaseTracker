import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { ErrorMessage } from '../src/components/ErrorMessage';

function renderErrorMessage(
  props: Partial<React.ComponentProps<typeof ErrorMessage>> = {},
) {
  const defaults = {
    message: 'Something went wrong',
  };
  return ReactTestRenderer.create(<ErrorMessage {...defaults} {...props} />);
}

describe('ErrorMessage', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  describe('rendering', () => {
    it('renders without crashing', async () => {
      await ReactTestRenderer.act(() => {
        renderErrorMessage();
      });
    });

    it('renders the outer container with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const container = renderer!.root.findByProps({ testID: 'error-message' });
      expect(container).toBeDefined();
    });

    it('renders the error icon', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const icon = renderer!.root.findByProps({ testID: 'error-message-icon' });
      expect(icon).toBeDefined();
      expect(icon.props.children).toBe('⚠');
    });

    it('renders the message text', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ message: 'Network error occurred' });
      });
      const text = renderer!.root.findByProps({ testID: 'error-message-text' });
      expect(text.props.children).toBe('Network error occurred');
    });
  });

  describe('retry button', () => {
    it('renders the retry button when onRetry is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ onRetry: jest.fn() });
      });
      const retry = renderer!.root.findByProps({ testID: 'error-message-retry' });
      expect(retry).toBeDefined();
    });

    it('does not render the retry button when onRetry is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ onRetry: undefined });
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'error-message-retry' }),
      ).toThrow();
    });

    it('calls onRetry when the retry button is pressed', async () => {
      const onRetry = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ onRetry });
      });
      const retry = renderer!.root.findByProps({ testID: 'error-message-retry' });
      await ReactTestRenderer.act(() => {
        retry.props.onPress();
      });
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('renders the default retry label "Retry"', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ onRetry: jest.fn() });
      });
      const retryLabel = renderer!.root.findByProps({
        testID: 'error-message-retry-label',
      });
      expect(retryLabel.props.children).toBe('Retry');
    });

    it('renders a custom retry label when retryLabel is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ onRetry: jest.fn(), retryLabel: 'Try again' });
      });
      const retryLabel = renderer!.root.findByProps({
        testID: 'error-message-retry-label',
      });
      expect(retryLabel.props.children).toBe('Try again');
    });

    it('sets accessibilityRole to button on the retry TouchableOpacity', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ onRetry: jest.fn() });
      });
      const retry = renderer!.root.findByProps({ testID: 'error-message-retry' });
      expect(retry.props.accessibilityRole).toBe('button');
    });

    it('sets accessibilityLabel to the retryLabel value on the retry button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({
          onRetry: jest.fn(),
          retryLabel: 'Try again',
        });
      });
      const retry = renderer!.root.findByProps({ testID: 'error-message-retry' });
      expect(retry.props.accessibilityLabel).toBe('Try again');
    });
  });

  describe('accessibility', () => {
    it('applies accessibilityRole of alert to the container', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const container = renderer!.root.findByProps({ testID: 'error-message' });
      expect(container.props.accessibilityRole).toBe('alert');
    });
  });

  describe('styles', () => {
    it('applies error color to the icon in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const icon = renderer!.root.findByProps({ testID: 'error-message-icon' });
      const iconStyle = StyleSheet.flatten(icon.props.style);
      // lightColors.error is red500 = '#EF4444'
      expect(iconStyle.color).toBe('#EF4444');
    });

    it('applies error color to the container border in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const container = renderer!.root.findByProps({ testID: 'error-message' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      expect(containerStyle.borderColor).toBe('#EF4444');
    });

    it('applies surface color to the container background in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const container = renderer!.root.findByProps({ testID: 'error-message' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // lightColors.surface is white = '#FFFFFF'
      expect(containerStyle.backgroundColor).toBe('#FFFFFF');
    });

    it('applies textPrimary color to the message text in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const text = renderer!.root.findByProps({ testID: 'error-message-text' });
      const textStyle = StyleSheet.flatten(text.props.style);
      // lightColors.textPrimary is grey900 = '#111827'
      expect(textStyle.color).toBe('#111827');
    });

    it('applies primary color to the retry label in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage({ onRetry: jest.fn() });
      });
      const retryLabel = renderer!.root.findByProps({
        testID: 'error-message-retry-label',
      });
      const labelStyle = StyleSheet.flatten(retryLabel.props.style);
      // lightColors.primary is brand = '#4F6AF5'
      expect(labelStyle.color).toBe('#4F6AF5');
    });

    it('applies a border radius and border width to the container', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const container = renderer!.root.findByProps({ testID: 'error-message' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      expect(containerStyle.borderRadius).toBe(8);
      expect(containerStyle.borderWidth).toBe(1);
    });

    it('lays out the icon and message in a row', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const allViews = renderer!.root.findAllByType(ReactNative.View);
      const row = allViews.find(
        v => StyleSheet.flatten(v.props.style)?.flexDirection === 'row',
      );
      expect(row).toBeDefined();
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderErrorMessage({ onRetry: jest.fn() });
      });
    });

    it('applies dark error color to the icon in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const icon = renderer!.root.findByProps({ testID: 'error-message-icon' });
      const iconStyle = StyleSheet.flatten(icon.props.style);
      // darkColors.error is red400 = '#F87171'
      expect(iconStyle.color).toBe('#F87171');
    });

    it('applies dark surface color to the container background in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderErrorMessage();
      });
      const container = renderer!.root.findByProps({ testID: 'error-message' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // darkColors.surface is grey800 = '#1F2937'
      expect(containerStyle.backgroundColor).toBe('#1F2937');
    });
  });
});

const { StyleSheet } = ReactNative;
