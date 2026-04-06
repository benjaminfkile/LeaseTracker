import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StatCard } from '../src/components/StatCard';

describe('StatCard', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<StatCard label="Miles Remaining" value={12000} />);
    });
  });

  it('renders with default testID stat-card', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatCard label="Miles Remaining" value={12000} />,
      );
    });
    const container = renderer!.root.findByProps({ testID: 'stat-card' });
    expect(container).toBeDefined();
  });

  it('renders with a custom testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatCard label="Days Left" value={90} testID="stat-days" />,
      );
    });
    const container = renderer!.root.findByProps({ testID: 'stat-days' });
    expect(container).toBeDefined();
  });

  it('renders the value', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatCard label="Miles Remaining" value={24000} testID="stat-miles" />,
      );
    });
    const valueEl = renderer!.root.findByProps({ testID: 'stat-miles-value' });
    expect(valueEl.props.children).toBe(24000);
  });

  it('renders a string value', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatCard label="Status" value="Active" testID="stat-status" />,
      );
    });
    const valueEl = renderer!.root.findByProps({ testID: 'stat-status-value' });
    expect(valueEl.props.children).toBe('Active');
  });

  it('renders the label', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatCard label="Days Left" value={30} testID="stat-days" />,
      );
    });
    const labelEl = renderer!.root.findByProps({ testID: 'stat-days-label' });
    expect(labelEl.props.children).toBe('Days Left');
  });

  it('renders the unit when provided', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatCard label="Miles Remaining" value={12000} unit="mi" testID="stat-mi" />,
      );
    });
    const unitEl = renderer!.root.findByProps({ testID: 'stat-mi-unit' });
    expect(unitEl.props.children).toBe('mi');
  });

  it('does not render a unit element when unit is not provided', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatCard label="Count" value={5} testID="stat-count" />,
      );
    });
    const unitEls = renderer!.root.findAllByProps({ testID: 'stat-count-unit' });
    expect(unitEls).toHaveLength(0);
  });
});
