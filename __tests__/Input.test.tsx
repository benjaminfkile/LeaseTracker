import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { Input } from '../src/components/Input';

const { StyleSheet } = ReactNative;

function renderInput(props: Partial<React.ComponentProps<typeof Input>> = {}) {
  return ReactTestRenderer.create(<Input {...props} />);
}

describe('Input', () => {
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
        renderInput();
      });
    });

    it('renders a TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      expect(textInput).toBeDefined();
    });

    it('renders label when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ label: 'Email' });
      });
      const label = renderer!.root.findByProps({ testID: 'input-label' });
      expect(label.props.children).toBe('Email');
    });

    it('does not render label when not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      expect(() => renderer!.root.findByProps({ testID: 'input-label' })).toThrow();
    });

    it('renders helper text when provided and no error', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ helperText: 'Enter your email address' });
      });
      const helper = renderer!.root.findByProps({ testID: 'input-helper-text' });
      expect(helper.props.children).toBe('Enter your email address');
    });

    it('does not render helper text when not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      expect(() => renderer!.root.findByProps({ testID: 'input-helper-text' })).toThrow();
    });

    it('does not render helper text when error is also present', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({
          helperText: 'Some help',
          errorMessage: 'Something went wrong',
        });
      });
      expect(() => renderer!.root.findByProps({ testID: 'input-helper-text' })).toThrow();
    });

    it('renders leftIcon when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      const icon = <ReactNative.View testID="my-left-icon" />;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ leftIcon: icon });
      });
      const leftIconWrapper = renderer!.root.findByProps({ testID: 'input-left-icon' });
      expect(leftIconWrapper).toBeDefined();
      const innerIcon = renderer!.root.findByProps({ testID: 'my-left-icon' });
      expect(innerIcon).toBeDefined();
    });

    it('does not render left icon wrapper when leftIcon is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ leftIcon: undefined });
      });
      expect(() => renderer!.root.findByProps({ testID: 'input-left-icon' })).toThrow();
    });

    it('renders rightIcon when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      const icon = <ReactNative.View testID="my-right-icon" />;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ rightIcon: icon });
      });
      const rightIconWrapper = renderer!.root.findByProps({ testID: 'input-right-icon' });
      expect(rightIconWrapper).toBeDefined();
      const innerIcon = renderer!.root.findByProps({ testID: 'my-right-icon' });
      expect(innerIcon).toBeDefined();
    });

    it('does not render right icon wrapper when rightIcon is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ rightIcon: undefined });
      });
      expect(() => renderer!.root.findByProps({ testID: 'input-right-icon' })).toThrow();
    });

    it('passes placeholder to TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ placeholder: 'Type here…' });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      expect(textInput.props.placeholder).toBe('Type here…');
    });

    it('passes value to TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ value: 'hello' });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      expect(textInput.props.value).toBe('hello');
    });
  });

  describe('error state', () => {
    it('renders error message when errorMessage is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ errorMessage: 'This field is required' });
      });
      const error = renderer!.root.findByProps({ testID: 'input-error-message' });
      expect(error.props.children).toBe('This field is required');
    });

    it('does not render error message when errorMessage is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      expect(() => renderer!.root.findByProps({ testID: 'input-error-message' })).toThrow();
    });

    it('applies error border color when errorMessage is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ errorMessage: 'Invalid input' });
      });
      const container = renderer!.root.findByProps({ testID: 'input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // error color in light theme is #EF4444
      expect(containerStyle.borderColor).toBe('#EF4444');
    });

    it('error message text uses error color', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ errorMessage: 'Invalid input' });
      });
      const error = renderer!.root.findByProps({ testID: 'input-error-message' });
      const errorStyle = StyleSheet.flatten(error.props.style);
      expect(errorStyle.color).toBe('#EF4444');
    });
  });

  describe('focus state', () => {
    it('applies default border color when not focused', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      const container = renderer!.root.findByProps({ testID: 'input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // default border in light theme is #E5E7EB
      expect(containerStyle.borderColor).toBe('#E5E7EB');
    });

    it('applies primary border color when focused', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        textInput.props.onFocus({ nativeEvent: {} });
      });
      const container = renderer!.root.findByProps({ testID: 'input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // primary color in light theme is #4F6AF5
      expect(containerStyle.borderColor).toBe('#4F6AF5');
    });

    it('reverts to default border color on blur', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        textInput.props.onFocus({ nativeEvent: {} });
      });
      await ReactTestRenderer.act(() => {
        textInput.props.onBlur({ nativeEvent: {} });
      });
      const container = renderer!.root.findByProps({ testID: 'input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      expect(containerStyle.borderColor).toBe('#E5E7EB');
    });

    it('error border takes priority over focus border', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ errorMessage: 'Required' });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        textInput.props.onFocus({ nativeEvent: {} });
      });
      const container = renderer!.root.findByProps({ testID: 'input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      expect(containerStyle.borderColor).toBe('#EF4444');
    });

    it('calls external onFocus handler when focused', async () => {
      const onFocus = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ onFocus });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        textInput.props.onFocus({ nativeEvent: {} });
      });
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('calls external onBlur handler when blurred', async () => {
      const onBlur = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ onBlur });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        textInput.props.onBlur({ nativeEvent: {} });
      });
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderInput({ label: 'Password', errorMessage: 'Too short' });
      });
    });

    it('applies dark error color on error in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ errorMessage: 'Invalid' });
      });
      const container = renderer!.root.findByProps({ testID: 'input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // error color in dark theme is #F87171
      expect(containerStyle.borderColor).toBe('#F87171');
    });

    it('applies dark primary border color on focus in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput();
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        textInput.props.onFocus({ nativeEvent: {} });
      });
      const container = renderer!.root.findByProps({ testID: 'input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // primary color in dark theme is #3A52D4
      expect(containerStyle.borderColor).toBe('#3A52D4');
    });
  });

  describe('accessibility', () => {
    it('passes accessibilityLabel to TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ accessibilityLabel: 'Email address' });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      expect(textInput.props.accessibilityLabel).toBe('Email address');
    });

    it('passes secureTextEntry to TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ secureTextEntry: true });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      expect(textInput.props.secureTextEntry).toBe(true);
    });

    it('passes keyboardType to TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderInput({ keyboardType: 'email-address' });
      });
      const textInput = renderer!.root.findByType(ReactNative.TextInput);
      expect(textInput.props.keyboardType).toBe('email-address');
    });
  });
});
