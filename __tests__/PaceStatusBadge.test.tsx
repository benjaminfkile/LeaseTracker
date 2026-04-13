import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PaceStatusBadge } from '../src/components/PaceStatusBadge';

describe('PaceStatusBadge', () => {
  it('renders without crashing for on_track', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<PaceStatusBadge status="on_track" />);
    });
  });

  it('renders with testID pace-status-badge', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on_track" />);
    });
    const badge = renderer!.root.findByProps({ testID: 'pace-status-badge' });
    expect(badge).toBeDefined();
  });

  it('renders "On Track" label for on_track status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on_track" />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('On Track');
  });

  it('renders "Over Pace" label for ahead status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="ahead" />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Over Pace');
  });

  it('renders "Under Pace" label for behind status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="behind" />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Under Pace');
  });

  it('renders the icon for on_track', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on_track" />);
    });
    const icon = renderer!.root.findByProps({ testID: 'pace-status-badge-icon' });
    expect(icon.props.children).toBe('✓');
  });

  it('renders the icon for ahead', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="ahead" />);
    });
    const icon = renderer!.root.findByProps({ testID: 'pace-status-badge-icon' });
    expect(icon.props.children).toBe('⚠');
  });

  it('renders the icon for behind', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="behind" />);
    });
    const icon = renderer!.root.findByProps({ testID: 'pace-status-badge-icon' });
    expect(icon.props.children).toBe('✓');
  });

  it('has the correct accessibility label for on_track', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on_track" />);
    });
    const badge = renderer!.root.findByProps({ testID: 'pace-status-badge' });
    expect(badge.props.accessibilityLabel).toBe('Pace status: On Track');
  });
});
