import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { Card } from '../src/components/Card';

function renderCard(props: Partial<React.ComponentProps<typeof Card>> = {}) {
  const defaults: React.ComponentProps<typeof Card> = {
    children: <ReactNative.View testID="card-child" />,
  };
  return ReactTestRenderer.create(<Card {...defaults} {...props} />);
}

describe('Card', () => {
  let useColorSchemeSpy: jest.SpyInstance;
  let originalPlatformOS: typeof ReactNative.Platform.OS;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    originalPlatformOS = ReactNative.Platform.OS;
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: 'ios',
      configurable: true,
    });
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: originalPlatformOS,
      configurable: true,
    });
  });

  describe('rendering', () => {
    it('renders without crashing', async () => {
      await ReactTestRenderer.act(() => {
        renderCard();
      });
    });

    it('renders children', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard({
          children: <ReactNative.View testID="my-child" />,
        });
      });
      const child = renderer!.root.findByProps({ testID: 'my-child' });
      expect(child).toBeDefined();
    });

    it('renders multiple children', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard({
          children: (
            <>
              <ReactNative.View testID="child-one" />
              <ReactNative.View testID="child-two" />
            </>
          ),
        });
      });
      expect(renderer!.root.findByProps({ testID: 'child-one' })).toBeDefined();
      expect(renderer!.root.findByProps({ testID: 'child-two' })).toBeDefined();
    });
  });

  describe('styling', () => {
    it('uses surface color as background on light theme', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.backgroundColor).toBe('#FFFFFF');
    });

    it('uses surface color as background on dark theme', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.backgroundColor).toBe('#1F2937');
    });

    it('applies border radius', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.borderRadius).toBe(12);
    });

    it('applies padding', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.padding).toBe(16);
    });

    it('merges custom style prop', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard({ style: { margin: 8 } });
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.margin).toBe(8);
    });

    it('allows custom style to override default padding', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard({ style: { padding: 24 } });
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.padding).toBe(24);
    });
  });

  describe('shadow (iOS)', () => {
    it('applies iOS shadow properties on iOS', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.shadowColor).toBe('#000000');
      expect(flatStyle.shadowOpacity).toBe(0.1);
      expect(flatStyle.shadowRadius).toBe(4);
      expect(flatStyle.shadowOffset).toEqual({ width: 0, height: 2 });
    });

    it('does not apply Android elevation on iOS', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.elevation).toBeUndefined();
    });
  });

  describe('elevation (Android)', () => {
    beforeEach(() => {
      Object.defineProperty(ReactNative.Platform, 'OS', {
        value: 'android',
        configurable: true,
      });
    });

    it('applies elevation on Android', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.elevation).toBe(4);
    });

    it('does not apply iOS shadow properties on Android', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.shadowColor).toBeUndefined();
      expect(flatStyle.shadowOpacity).toBeUndefined();
      expect(flatStyle.shadowRadius).toBeUndefined();
      expect(flatStyle.shadowOffset).toBeUndefined();
    });
  });

  describe('dark mode', () => {
    it('renders in dark mode without crashing', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderCard();
      });
    });

    it('uses dark surface color in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderCard();
      });
      const container = renderer!.root.findByType(ReactNative.View);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.backgroundColor).toBe('#1F2937');
    });
  });
});

const { StyleSheet } = ReactNative;
