import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { LoadingOverlay } from '../src/components/LoadingOverlay';

function renderLoadingOverlay(
  props: Partial<React.ComponentProps<typeof LoadingOverlay>> = {},
) {
  const defaults = {
    visible: true,
  };
  return ReactTestRenderer.create(<LoadingOverlay {...defaults} {...props} />);
}

describe('LoadingOverlay', () => {
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
        renderLoadingOverlay();
      });
    });

    it('renders the Modal', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal).toBeDefined();
    });

    it('renders the backdrop with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const backdrop = renderer!.root.findByProps({ testID: 'loading-overlay-backdrop' });
      expect(backdrop).toBeDefined();
    });

    it('renders the spinner container with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const spinnerContainer = renderer!.root.findByProps({
        testID: 'loading-overlay-spinner-container',
      });
      expect(spinnerContainer).toBeDefined();
    });

    it('renders the ActivityIndicator with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const indicator = renderer!.root.findByProps({
        testID: 'loading-overlay-indicator',
      });
      expect(indicator).toBeDefined();
    });

    it('renders ActivityIndicator with large size', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const indicator = renderer!.root.findByType(ReactNative.ActivityIndicator);
      expect(indicator.props.size).toBe('large');
    });
  });

  describe('visibility', () => {
    it('sets Modal visible prop to true when visible is true', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.visible).toBe(true);
    });

    it('sets Modal visible prop to false when visible is false', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: false });
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.visible).toBe(false);
    });
  });

  describe('modal props', () => {
    it('renders Modal with transparent prop', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay();
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.transparent).toBe(true);
    });

    it('renders Modal with fade animationType', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay();
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.animationType).toBe('fade');
    });

    it('renders Modal with statusBarTranslucent', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay();
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.statusBarTranslucent).toBe(true);
    });
  });

  describe('styles', () => {
    it('applies flex 1 and centered alignment to backdrop', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay();
      });
      const backdrop = renderer!.root.findByProps({ testID: 'loading-overlay-backdrop' });
      const backdropStyle = ReactNative.StyleSheet.flatten(backdrop.props.style);
      expect(backdropStyle.flex).toBe(1);
      expect(backdropStyle.alignItems).toBe('center');
      expect(backdropStyle.justifyContent).toBe('center');
    });

    it('applies semi-transparent background to backdrop', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay();
      });
      const backdrop = renderer!.root.findByProps({ testID: 'loading-overlay-backdrop' });
      const backdropStyle = ReactNative.StyleSheet.flatten(backdrop.props.style);
      expect(backdropStyle.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('applies theme surface color to spinner container', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay();
      });
      const spinnerContainer = renderer!.root.findByProps({
        testID: 'loading-overlay-spinner-container',
      });
      const containerStyle = ReactNative.StyleSheet.flatten(spinnerContainer.props.style);
      // lightColors.surface = '#FFFFFF'
      expect(containerStyle.backgroundColor).toBe('#FFFFFF');
    });

    it('applies theme primary color to ActivityIndicator', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay();
      });
      const indicator = renderer!.root.findByType(ReactNative.ActivityIndicator);
      // lightColors.primary = '#4F6AF5'
      expect(indicator.props.color).toBe('#4F6AF5');
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderLoadingOverlay({ visible: true });
      });
    });

    it('applies dark theme surface color to spinner container', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const spinnerContainer = renderer!.root.findByProps({
        testID: 'loading-overlay-spinner-container',
      });
      const containerStyle = ReactNative.StyleSheet.flatten(spinnerContainer.props.style);
      // darkColors.surface = '#1F2937'
      expect(containerStyle.backgroundColor).toBe('#1F2937');
    });

    it('applies dark theme primary color to ActivityIndicator', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderLoadingOverlay({ visible: true });
      });
      const indicator = renderer!.root.findByType(ReactNative.ActivityIndicator);
      // darkColors.primary = '#3A52D4'
      expect(indicator.props.color).toBe('#3A52D4');
    });
  });
});
