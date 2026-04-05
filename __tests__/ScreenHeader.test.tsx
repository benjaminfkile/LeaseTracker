import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { ScreenHeader } from '../src/components/ScreenHeader';

function renderHeader(props: Partial<React.ComponentProps<typeof ScreenHeader>> = {}) {
  const defaults = {
    title: 'My Screen',
  };
  return ReactTestRenderer.create(<ScreenHeader {...defaults} {...props} />);
}

describe('ScreenHeader', () => {
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
        renderHeader();
      });
    });

    it('renders the title text', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ title: 'Lease Details' });
      });
      const titleNode = renderer!.root.findByProps({ testID: 'screen-header-title' });
      expect(titleNode.props.children).toBe('Lease Details');
    });

    it('title uses textPrimary color in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ title: 'Title' });
      });
      const titleNode = renderer!.root.findByProps({ testID: 'screen-header-title' });
      const titleStyle = ReactNative.StyleSheet.flatten(titleNode.props.style);
      expect(titleStyle.color).toBe('#111827');
    });
  });

  describe('back button', () => {
    it('does not render back button when onBackPress is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ onBackPress: undefined });
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'screen-header-back-button' }),
      ).toThrow();
    });

    it('renders back button when onBackPress is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ onBackPress: jest.fn() });
      });
      const backButton = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
      expect(backButton).toBeDefined();
    });

    it('calls onBackPress when back button is pressed', async () => {
      const onBackPress = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ onBackPress });
      });
      const backButton = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
      await ReactTestRenderer.act(() => {
        backButton.props.onPress();
      });
      expect(onBackPress).toHaveBeenCalledTimes(1);
    });

    it('back button has accessibilityRole of button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ onBackPress: jest.fn() });
      });
      const backButton = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
      expect(backButton.props.accessibilityRole).toBe('button');
    });

    it('back button has accessibilityLabel', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ onBackPress: jest.fn() });
      });
      const backButton = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
      expect(backButton.props.accessibilityLabel).toBe('Go back');
    });
  });

  describe('right action', () => {
    it('does not render right action wrapper when rightAction is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ rightAction: undefined });
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'screen-header-right-action' }),
      ).toThrow();
    });

    it('renders right action when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      const action = <ReactNative.View testID="custom-action" />;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ rightAction: action });
      });
      const rightActionWrapper = renderer!.root.findByProps({ testID: 'screen-header-right-action' });
      expect(rightActionWrapper).toBeDefined();
    });

    it('renders child element inside right action', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      const action = <ReactNative.View testID="custom-action" />;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ rightAction: action });
      });
      const customAction = renderer!.root.findByProps({ testID: 'custom-action' });
      expect(customAction).toBeDefined();
    });
  });

  describe('layout', () => {
    it('container has a fixed height of 56', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader();
      });
      const container = renderer!.root.findAllByType(ReactNative.View)[0];
      const containerStyle = ReactNative.StyleSheet.flatten(container.props.style);
      expect(containerStyle.height).toBe(56);
    });

    it('container has horizontal padding of 16', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader();
      });
      const container = renderer!.root.findAllByType(ReactNative.View)[0];
      const containerStyle = ReactNative.StyleSheet.flatten(container.props.style);
      expect(containerStyle.paddingHorizontal).toBe(16);
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderHeader({ title: 'Dark Title' });
      });
    });

    it('title uses textPrimary color in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderHeader({ title: 'Title' });
      });
      const titleNode = renderer!.root.findByProps({ testID: 'screen-header-title' });
      const titleStyle = ReactNative.StyleSheet.flatten(titleNode.props.style);
      expect(titleStyle.color).toBe('#FFFFFF');
    });
  });
});
