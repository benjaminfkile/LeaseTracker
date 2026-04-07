import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { Button } from '../src/components/Button';

function renderButton(props: Partial<React.ComponentProps<typeof Button>> = {}) {
  const defaults = {
    title: 'Press me',
    onPress: jest.fn(),
  };
  return ReactTestRenderer.create(<Button {...defaults} {...props} />);
}

describe('Button', () => {
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
        renderButton();
      });
    });

    it('renders the title text', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ title: 'Hello' });
      });
      const text = renderer!.root.findByType(ReactNative.Text);
      expect(text.props.children).toBe('Hello');
    });

    it('renders ActivityIndicator when isLoading is true', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ isLoading: true });
      });
      const indicator = renderer!.root.findByType(ReactNative.ActivityIndicator);
      expect(indicator).toBeDefined();
    });

    it('does not render ActivityIndicator when isLoading is false', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ isLoading: false });
      });
      expect(() => renderer!.root.findByType(ReactNative.ActivityIndicator)).toThrow();
    });

    it('does not render title text when isLoading is true', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ isLoading: true });
      });
      expect(() => renderer!.root.findByType(ReactNative.Text)).toThrow();
    });

    it('renders leftIcon when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      const icon = <ReactNative.View testID="left-icon" />;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ leftIcon: icon });
      });
      const leftIconNode = renderer!.root.findByProps({ testID: 'left-icon' });
      expect(leftIconNode).toBeDefined();
    });

    it('does not render leftIcon wrapper when leftIcon is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ leftIcon: undefined });
      });
      // No View should carry the icon wrapper's marginRight style
      const allViews = renderer!.root.findAllByType(ReactNative.View);
      const iconWrappers = allViews.filter(
        v =>
          StyleSheet.flatten(v.props.style)?.marginRight === 8,
      );
      expect(iconWrappers.length).toBe(0);
    });
  });

  describe('disabled state', () => {
    it('sets disabled prop on TouchableOpacity when disabled is true', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ disabled: true });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      expect(touchable.props.disabled).toBe(true);
    });

    it('sets disabled prop on TouchableOpacity when isLoading is true', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ isLoading: true });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      expect(touchable.props.disabled).toBe(true);
    });

    it('does not disable TouchableOpacity when both disabled and isLoading are false', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ disabled: false, isLoading: false });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      expect(touchable.props.disabled).toBe(false);
    });
  });

  describe('onPress', () => {
    it('calls onPress when pressed', async () => {
      const onPress = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ onPress });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      await ReactTestRenderer.act(() => {
        touchable.props.onPress();
      });
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('variants', () => {
    const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant without crashing`, async () => {
        await ReactTestRenderer.act(() => {
          renderButton({ variant });
        });
      });
    });

    it('defaults to primary variant', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton();
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      const containerStyle = StyleSheet.flatten(touchable.props.style);
      expect(containerStyle.borderWidth).toBe(0);
      expect(containerStyle.backgroundColor).not.toBe('transparent');
    });

    it('secondary variant has a border', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ variant: 'secondary' });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      const containerStyle = StyleSheet.flatten(touchable.props.style);
      expect(containerStyle.borderWidth).toBe(1);
      expect(containerStyle.backgroundColor).toBe('transparent');
    });

    it('ghost variant has transparent background and no border', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ variant: 'ghost' });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      const containerStyle = StyleSheet.flatten(touchable.props.style);
      expect(containerStyle.borderWidth).toBe(0);
      expect(containerStyle.backgroundColor).toBe('transparent');
    });

    it('destructive variant has error background color', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ variant: 'destructive' });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      const containerStyle = StyleSheet.flatten(touchable.props.style);
      expect(containerStyle.backgroundColor).toBe('#EF4444');
    });

    it('primary variant text is white', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ variant: 'primary' });
      });
      const text = renderer!.root.findByType(ReactNative.Text);
      const textStyle = StyleSheet.flatten(text.props.style);
      expect(textStyle.color).toBe('#FFFFFF');
    });

    it('destructive variant text is white', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ variant: 'destructive' });
      });
      const text = renderer!.root.findByType(ReactNative.Text);
      const textStyle = StyleSheet.flatten(text.props.style);
      expect(textStyle.color).toBe('#FFFFFF');
    });

    it('secondary variant text uses primary color', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ variant: 'secondary' });
      });
      const text = renderer!.root.findByType(ReactNative.Text);
      const textStyle = StyleSheet.flatten(text.props.style);
      expect(textStyle.color).toBe('#4F6AF5');
    });

    it('ghost variant text uses primary color', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ variant: 'ghost' });
      });
      const text = renderer!.root.findByType(ReactNative.Text);
      const textStyle = StyleSheet.flatten(text.props.style);
      expect(textStyle.color).toBe('#4F6AF5');
    });
  });

  describe('dark mode', () => {
    it('renders primary variant with dark theme without crashing', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderButton({ variant: 'primary' });
      });
    });
  });

  describe('accessibility', () => {
    it('has accessibilityRole of button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton();
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      expect(touchable.props.accessibilityRole).toBe('button');
    });

    it('sets accessibilityState busy when isLoading is true', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ isLoading: true });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      expect(touchable.props.accessibilityState.busy).toBe(true);
    });

    it('sets accessibilityState disabled when disabled is true', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderButton({ disabled: true });
      });
      const touchable = renderer!.root.findByType(ReactNative.TouchableOpacity);
      expect(touchable.props.accessibilityState.disabled).toBe(true);
    });
  });
});

const { StyleSheet } = ReactNative;
