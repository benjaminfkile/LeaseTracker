import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { EmptyState } from '../src/components/EmptyState';
import { Button } from '../src/components/Button';

function renderEmptyState(
  props: Partial<React.ComponentProps<typeof EmptyState>> = {},
) {
  const defaults = {
    title: 'Nothing here yet',
  };
  return ReactTestRenderer.create(<EmptyState {...defaults} {...props} />);
}

describe('EmptyState', () => {
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
        renderEmptyState();
      });
    });

    it('renders the outer container with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState();
      });
      const container = renderer!.root.findByProps({ testID: 'empty-state' });
      expect(container).toBeDefined();
    });

    it('renders the title text', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ title: 'No leases found' });
      });
      const title = renderer!.root.findByProps({
        testID: 'empty-state-title',
      });
      expect(title.props.children).toBe('No leases found');
    });

    it('renders the subtitle when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ subtitle: 'Add your first lease to get started' });
      });
      const subtitle = renderer!.root.findByProps({
        testID: 'empty-state-subtitle',
      });
      expect(subtitle.props.children).toBe(
        'Add your first lease to get started',
      );
    });

    it('does not render subtitle when not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ subtitle: undefined });
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'empty-state-subtitle' }),
      ).toThrow();
    });

    it('renders the illustration wrapper', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState();
      });
      const illustrationWrapper = renderer!.root.findByProps({
        testID: 'empty-state-illustration',
      });
      expect(illustrationWrapper).toBeDefined();
    });

    it('renders the illustration placeholder when no illustration is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ illustration: undefined });
      });
      const placeholder = renderer!.root.findByProps({
        testID: 'empty-state-illustration-placeholder',
      });
      expect(placeholder).toBeDefined();
    });

    it('renders a custom illustration when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      const customIllustration = (
        <ReactNative.View testID="custom-illustration" />
      );
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ illustration: customIllustration });
      });
      const custom = renderer!.root.findByProps({
        testID: 'custom-illustration',
      });
      expect(custom).toBeDefined();
    });

    it('does not render illustration placeholder when custom illustration is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      const customIllustration = (
        <ReactNative.View testID="custom-illustration" />
      );
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ illustration: customIllustration });
      });
      expect(() =>
        renderer!.root.findByProps({
          testID: 'empty-state-illustration-placeholder',
        }),
      ).toThrow();
    });
  });

  describe('CTA button', () => {
    it('renders the CTA button when both ctaLabel and onCtaPress are provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({
          ctaLabel: 'Add Lease',
          onCtaPress: jest.fn(),
        });
      });
      const cta = renderer!.root.findByProps({ testID: 'empty-state-cta' });
      expect(cta).toBeDefined();
    });

    it('does not render the CTA button when ctaLabel is omitted', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ ctaLabel: undefined, onCtaPress: jest.fn() });
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'empty-state-cta' }),
      ).toThrow();
    });

    it('does not render the CTA button when onCtaPress is omitted', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ ctaLabel: 'Add Lease', onCtaPress: undefined });
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'empty-state-cta' }),
      ).toThrow();
    });

    it('does not render the CTA button when neither ctaLabel nor onCtaPress is provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState();
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'empty-state-cta' }),
      ).toThrow();
    });

    it('calls onCtaPress when the CTA button is pressed', async () => {
      const onCtaPress = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({
          ctaLabel: 'Add Lease',
          onCtaPress,
        });
      });
      const button = renderer!.root.findByType(Button);
      await ReactTestRenderer.act(() => {
        button.props.onPress();
      });
      expect(onCtaPress).toHaveBeenCalledTimes(1);
    });

    it('passes ctaLabel as title to the Button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({
          ctaLabel: 'Get Started',
          onCtaPress: jest.fn(),
        });
      });
      const button = renderer!.root.findByType(Button);
      expect(button.props.title).toBe('Get Started');
    });

    it('renders CTA button with primary variant', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({
          ctaLabel: 'Add Lease',
          onCtaPress: jest.fn(),
        });
      });
      const button = renderer!.root.findByType(Button);
      expect(button.props.variant).toBe('primary');
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderEmptyState({
          title: 'Nothing here',
          subtitle: 'Try adding something',
          ctaLabel: 'Add',
          onCtaPress: jest.fn(),
        });
      });
    });
  });

  describe('styles', () => {
    it('applies centered alignment to the container', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState();
      });
      const container = renderer!.root.findByProps({ testID: 'empty-state' });
      const containerStyle = StyleSheet.flatten(container.props.style);
      expect(containerStyle.alignItems).toBe('center');
      expect(containerStyle.justifyContent).toBe('center');
    });

    it('applies textAlign center to the title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ title: 'Hello' });
      });
      const title = renderer!.root.findByProps({ testID: 'empty-state-title' });
      const titleStyle = StyleSheet.flatten(title.props.style);
      expect(titleStyle.textAlign).toBe('center');
    });

    it('applies textAlign center to the subtitle', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({
          title: 'Hello',
          subtitle: 'World',
        });
      });
      const subtitle = renderer!.root.findByProps({
        testID: 'empty-state-subtitle',
      });
      const subtitleStyle = StyleSheet.flatten(subtitle.props.style);
      expect(subtitleStyle.textAlign).toBe('center');
    });

    it('applies theme textPrimary color to title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ title: 'Hello' });
      });
      const title = renderer!.root.findByProps({ testID: 'empty-state-title' });
      const titleStyle = StyleSheet.flatten(title.props.style);
      // lightColors.textPrimary is grey900 = '#111827'
      expect(titleStyle.color).toBe('#111827');
    });

    it('applies theme textSecondary color to subtitle', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderEmptyState({ title: 'Hello', subtitle: 'World' });
      });
      const subtitle = renderer!.root.findByProps({
        testID: 'empty-state-subtitle',
      });
      const subtitleStyle = StyleSheet.flatten(subtitle.props.style);
      // lightColors.textSecondary is grey500 = '#6B7280'
      expect(subtitleStyle.color).toBe('#6B7280');
    });
  });
});

const { StyleSheet } = ReactNative;
