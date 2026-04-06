import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { NotificationPermissionModal } from '../src/components/NotificationPermissionModal';

function renderModal(
  props: Partial<React.ComponentProps<typeof NotificationPermissionModal>> = {},
) {
  const defaults: React.ComponentProps<typeof NotificationPermissionModal> = {
    visible: true,
    onAllow: jest.fn(),
    onDeny: jest.fn(),
  };
  return ReactTestRenderer.create(<NotificationPermissionModal {...defaults} {...props} />);
}

describe('NotificationPermissionModal', () => {
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
        renderModal();
      });
    });

    it('renders the Modal', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal).toBeDefined();
    });

    it('renders the backdrop with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const backdrop = renderer!.root.findByProps({ testID: 'notification-permission-backdrop' });
      expect(backdrop).toBeDefined();
    });

    it('renders the card with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const card = renderer!.root.findByProps({ testID: 'notification-permission-card' });
      expect(card).toBeDefined();
    });

    it('renders the icon with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const icon = renderer!.root.findByProps({ testID: 'notification-permission-icon' });
      expect(icon).toBeDefined();
    });

    it('renders the title with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const title = renderer!.root.findByProps({ testID: 'notification-permission-title' });
      expect(title).toBeDefined();
    });

    it('renders the body with the correct copy', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const body = renderer!.root.findByProps({ testID: 'notification-permission-body' });
      expect(body.props.children).toMatch(/approaching your mileage limit/i);
    });

    it('renders the allow button with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const btn = renderer!.root.findByProps({ testID: 'notification-permission-allow-button' });
      expect(btn).toBeDefined();
    });

    it('renders the deny button with testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const btn = renderer!.root.findByProps({ testID: 'notification-permission-deny-button' });
      expect(btn).toBeDefined();
    });
  });

  describe('visibility', () => {
    it('passes visible=true to Modal', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.visible).toBe(true);
    });

    it('passes visible=false to Modal', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: false });
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.visible).toBe(false);
    });
  });

  describe('modal props', () => {
    it('renders Modal with transparent prop', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal();
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.transparent).toBe(true);
    });

    it('renders Modal with fade animationType', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal();
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.animationType).toBe('fade');
    });

    it('renders Modal with statusBarTranslucent', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal();
      });
      const modal = renderer!.root.findByType(ReactNative.Modal);
      expect(modal.props.statusBarTranslucent).toBe(true);
    });
  });

  describe('interactions', () => {
    it('calls onAllow when the allow button is pressed', async () => {
      const onAllow = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ onAllow });
      });
      const btn = renderer!.root.findByProps({ testID: 'notification-permission-allow-button' });
      await ReactTestRenderer.act(() => {
        btn.props.onPress();
      });
      expect(onAllow).toHaveBeenCalledTimes(1);
    });

    it('calls onDeny when the deny button is pressed', async () => {
      const onDeny = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ onDeny });
      });
      const btn = renderer!.root.findByProps({ testID: 'notification-permission-deny-button' });
      await ReactTestRenderer.act(() => {
        btn.props.onPress();
      });
      expect(onDeny).toHaveBeenCalledTimes(1);
    });
  });

  describe('styles', () => {
    it('applies semi-transparent background to backdrop', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal();
      });
      const backdrop = renderer!.root.findByProps({ testID: 'notification-permission-backdrop' });
      const style = ReactNative.StyleSheet.flatten(backdrop.props.style);
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('applies theme surface color to card in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal();
      });
      const card = renderer!.root.findByProps({ testID: 'notification-permission-card' });
      const style = ReactNative.StyleSheet.flatten(card.props.style);
      // lightColors.surface = '#FFFFFF'
      expect(style.backgroundColor).toBe('#FFFFFF');
    });

    it('applies theme primary color to allow button in light mode', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal();
      });
      const btn = renderer!.root.findByProps({ testID: 'notification-permission-allow-button' });
      const style = ReactNative.StyleSheet.flatten(btn.props.style);
      // lightColors.primary = '#4F6AF5'
      expect(style.backgroundColor).toBe('#4F6AF5');
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderModal({ visible: true });
      });
    });

    it('applies dark theme surface color to card', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const card = renderer!.root.findByProps({ testID: 'notification-permission-card' });
      const style = ReactNative.StyleSheet.flatten(card.props.style);
      // darkColors.surface = '#1F2937'
      expect(style.backgroundColor).toBe('#1F2937');
    });

    it('applies dark theme primary color to allow button', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderModal({ visible: true });
      });
      const btn = renderer!.root.findByProps({ testID: 'notification-permission-allow-button' });
      const style = ReactNative.StyleSheet.flatten(btn.props.style);
      // darkColors.primary = '#3A52D4'
      expect(style.backgroundColor).toBe('#3A52D4');
    });
  });
});
