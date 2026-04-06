jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const mockComponent = (name: string) => {
    const Comp = ({ children, testID, ...rest }: { children?: React.ReactNode; testID?: string; [key: string]: unknown }) =>
      React.createElement(View, { testID: testID ?? name, ...rest }, children);
    Comp.displayName = name;
    return Comp;
  };
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    G: mockComponent('G'),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { MileageProgressRing } from '../src/components/MileageProgressRing';

describe('MileageProgressRing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <MileageProgressRing totalMiles={36000} usedMiles={12000} />,
      );
    });
  });

  it('renders with testID mileage-progress-ring', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MileageProgressRing totalMiles={36000} usedMiles={12000} />,
      );
    });
    const ring = renderer!.root.findByProps({ testID: 'mileage-progress-ring' });
    expect(ring).toBeDefined();
  });

  it('renders the percentage text', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MileageProgressRing totalMiles={36000} usedMiles={9000} />,
      );
    });
    const percentEl = renderer!.root.findByProps({ testID: 'mileage-progress-ring-percent' });
    expect(percentEl.props.children).toBe('25%');
  });

  it('renders 0% when no miles used', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MileageProgressRing totalMiles={36000} usedMiles={0} />,
      );
    });
    const percentEl = renderer!.root.findByProps({ testID: 'mileage-progress-ring-percent' });
    expect(percentEl.props.children).toBe('0%');
  });

  it('renders 100% and clamps when used exceeds total', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MileageProgressRing totalMiles={36000} usedMiles={40000} />,
      );
    });
    const percentEl = renderer!.root.findByProps({ testID: 'mileage-progress-ring-percent' });
    expect(percentEl.props.children).toBe('100%');
  });

  it('renders 0% when totalMiles is 0', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MileageProgressRing totalMiles={0} usedMiles={0} />,
      );
    });
    const percentEl = renderer!.root.findByProps({ testID: 'mileage-progress-ring-percent' });
    expect(percentEl.props.children).toBe('0%');
  });

  it('renders the miles used / total text', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MileageProgressRing totalMiles={36000} usedMiles={12000} />,
      );
    });
    const usedEl = renderer!.root.findByProps({ testID: 'mileage-progress-ring-used' });
    expect(usedEl.props.children).toBe('12,000 / 36,000 mi');
  });

  it('accepts custom size prop', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <MileageProgressRing totalMiles={36000} usedMiles={12000} size={160} />,
      );
    });
  });
});
