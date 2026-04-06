import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { QuickAddFAB } from '../src/components/QuickAddFAB';

describe('QuickAddFAB', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
  });

  it('renders with default testID quick-add-fab', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab).toBeDefined();
  });

  it('renders with a custom testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <QuickAddFAB onPress={() => {}} testID="my-fab" />,
      );
    });
    const fab = renderer!.root.findByProps({ testID: 'my-fab' });
    expect(fab).toBeDefined();
  });

  it('renders the "+" icon', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
    const icon = renderer!.root.findByProps({ testID: 'quick-add-fab-icon' });
    expect(icon.props.children).toBe('+');
  });

  it('has accessibilityRole button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab.props.accessibilityRole).toBe('button');
  });

  it('has correct accessibilityLabel', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab.props.accessibilityLabel).toBe('Log odometer reading');
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={onPress} />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    await ReactTestRenderer.act(() => {
      fab.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not disabled by default', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab.props.disabled).toBe(false);
  });

  it('is disabled when disabled prop is true', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <QuickAddFAB onPress={() => {}} disabled />,
      );
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab.props.disabled).toBe(true);
  });

  it('reflects disabled state in accessibilityState', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <QuickAddFAB onPress={() => {}} disabled />,
      );
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab.props.accessibilityState).toEqual({ disabled: true });
  });

  it('reflects enabled state in accessibilityState', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab.props.accessibilityState).toEqual({ disabled: false });
  });

  it('applies opacity style when disabled', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <QuickAddFAB onPress={() => {}} disabled />,
      );
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    const flatStyle = Array.isArray(fab.props.style)
      ? Object.assign({}, ...fab.props.style.filter(Boolean))
      : fab.props.style;
    expect(flatStyle.opacity).toBe(0.5);
  });

  it('does not apply opacity style when enabled', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<QuickAddFAB onPress={() => {}} />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    const flatStyle = Array.isArray(fab.props.style)
      ? Object.assign({}, ...fab.props.style.filter(Boolean))
      : fab.props.style;
    expect(flatStyle.opacity).toBeUndefined();
  });
});
