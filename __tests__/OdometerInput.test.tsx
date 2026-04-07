import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { OdometerInput } from '../src/components/OdometerInput';

const { StyleSheet } = ReactNative;

function renderOdometerInput(
  props: Partial<React.ComponentProps<typeof OdometerInput>> = {},
) {
  const defaults = {
    value: '',
    onChange: jest.fn(),
  };
  return ReactTestRenderer.create(<OdometerInput {...defaults} {...props} />);
}

describe('OdometerInput', () => {
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
        renderOdometerInput();
      });
    });

    it('renders with default testID odometer-input', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const wrapper = renderer!.root.findByProps({ testID: 'odometer-input' });
      expect(wrapper).toBeDefined();
    });

    it('renders with a custom testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ testID: 'my-odometer' });
      });
      const wrapper = renderer!.root.findByProps({ testID: 'my-odometer' });
      expect(wrapper).toBeDefined();
    });

    it('renders the inner TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input).toBeDefined();
    });

    it('uses number-pad keyboard type', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input.props.keyboardType).toBe('number-pad');
    });

    it('uses 0 as placeholder', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input.props.placeholder).toBe('0');
    });

    it('renders the mi unit label', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const texts = renderer!.root.findAllByType(ReactNative.Text);
      const unitText = texts.find(t => t.props.children === 'mi');
      expect(unitText).toBeDefined();
    });
  });

  describe('value display', () => {
    it('displays an empty string when value is empty', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ value: '' });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input.props.value).toBe('');
    });

    it('formats the value with comma separators', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ value: '12345' });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input.props.value).toBe((12345).toLocaleString());
    });

    it('formats a large value with comma separators', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ value: '100000' });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input.props.value).toBe((100000).toLocaleString());
    });

    it('displays a single digit value without formatting', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ value: '5' });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input.props.value).toBe((5).toLocaleString());
    });

    it('uses 48px font size for the large display', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ value: '1000' });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      const inputStyle = StyleSheet.flatten(input.props.style);
      expect(inputStyle.fontSize).toBe(48);
    });
  });

  describe('onChange', () => {
    it('calls onChange with cleaned numeric string', async () => {
      const onChange = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ onChange });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('12,345');
      });
      expect(onChange).toHaveBeenCalledWith('12345');
    });

    it('strips non-numeric characters before calling onChange', async () => {
      const onChange = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ onChange });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('abc123def');
      });
      expect(onChange).toHaveBeenCalledWith('123');
    });

    it('calls onChange with empty string when all characters are non-numeric', async () => {
      const onChange = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ onChange });
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('abc');
      });
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('previous reading hint', () => {
    it('does not render the previous reading hint when not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const hints = renderer!.root.findAllByProps({ testID: 'odometer-previous-reading' });
      expect(hints).toHaveLength(0);
    });

    it('renders the previous reading hint when previousReading is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ previousReading: 12000 });
      });
      const hint = renderer!.root.findByProps({ testID: 'odometer-previous-reading' });
      expect(hint).toBeDefined();
    });

    it('formats the previous reading value with comma separator', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ previousReading: 12000 });
      });
      const hint = renderer!.root.findByProps({ testID: 'odometer-previous-reading' });
      const allText = [hint.props.children].flat().join('');
      expect(allText).toContain((12000).toLocaleString());
      expect(allText).toContain('Previous:');
      expect(allText).toContain('mi');
    });

    it('renders previous reading hint with textSecondary color in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ previousReading: 5000 });
      });
      const hint = renderer!.root.findByProps({ testID: 'odometer-previous-reading' });
      const hintStyle = StyleSheet.flatten(hint.props.style);
      // textSecondary in light theme is grey500 = '#6B7280'
      expect(hintStyle.color).toBe('#6B7280');
    });

    it('renders the previous reading hint centered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ previousReading: 5000 });
      });
      const hint = renderer!.root.findByProps({ testID: 'odometer-previous-reading' });
      const hintStyle = StyleSheet.flatten(hint.props.style);
      expect(hintStyle.textAlign).toBe('center');
    });
  });

  describe('error state', () => {
    it('renders error message when errorMessage is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ errorMessage: 'Mileage is required' });
      });
      const error = renderer!.root.findByProps({ testID: 'odometer-input-error' });
      expect(error.props.children).toBe('Mileage is required');
    });

    it('does not render error message when errorMessage is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const errors = renderer!.root.findAllByProps({ testID: 'odometer-input-error' });
      expect(errors).toHaveLength(0);
    });

    it('applies error border color when errorMessage is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ errorMessage: 'Invalid' });
      });
      const container = renderer!.root.findByProps({ testID: 'odometer-input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // error color in light theme is #EF4444
      expect(containerStyle.borderColor).toBe('#EF4444');
    });

    it('applies default border color when errorMessage is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const container = renderer!.root.findByProps({ testID: 'odometer-input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // border color in light theme is grey200 = '#E5E7EB'
      expect(containerStyle.borderColor).toBe('#E5E7EB');
    });

    it('applies error color to the error message text', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ errorMessage: 'Too low' });
      });
      const error = renderer!.root.findByProps({ testID: 'odometer-input-error' });
      const errorStyle = StyleSheet.flatten(error.props.style);
      expect(errorStyle.color).toBe('#EF4444');
    });

    it('renders both previous reading hint and error message when both are provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({
          previousReading: 8000,
          errorMessage: 'Must be greater than previous',
        });
      });
      const hint = renderer!.root.findByProps({ testID: 'odometer-previous-reading' });
      const error = renderer!.root.findByProps({ testID: 'odometer-input-error' });
      expect(hint).toBeDefined();
      expect(error).toBeDefined();
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderOdometerInput({ value: '5000', previousReading: 4000, errorMessage: 'Too low' });
      });
    });

    it('applies dark error border color when errorMessage is provided in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ errorMessage: 'Invalid' });
      });
      const container = renderer!.root.findByProps({ testID: 'odometer-input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // error color in dark theme is red400 = '#F87171'
      expect(containerStyle.borderColor).toBe('#F87171');
    });

    it('applies dark textSecondary color to previous reading hint in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput({ previousReading: 7500 });
      });
      const hint = renderer!.root.findByProps({ testID: 'odometer-previous-reading' });
      const hintStyle = StyleSheet.flatten(hint.props.style);
      // textSecondary in dark theme is grey400 = '#9CA3AF'
      expect(hintStyle.color).toBe('#9CA3AF');
    });

    it('applies dark surface color to the input container background in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const container = renderer!.root.findByProps({ testID: 'odometer-input-container' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      // surface in dark theme is grey800 = '#1F2937'
      expect(containerStyle.backgroundColor).toBe('#1F2937');
    });
  });

  describe('accessibility', () => {
    it('sets accessibilityLabel to "Odometer reading" on the TextInput', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderOdometerInput();
      });
      const input = renderer!.root.findByProps({ testID: 'odometer-text-input' });
      expect(input.props.accessibilityLabel).toBe('Odometer reading');
    });
  });
});
