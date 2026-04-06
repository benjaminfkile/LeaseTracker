import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PaceStatusBadge } from '../src/components/PaceStatusBadge';

describe('PaceStatusBadge', () => {
  it('renders without crashing for on-track', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<PaceStatusBadge status="on-track" />);
    });
  });

  it('renders with testID pace-status-badge', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on-track" />);
    });
    const badge = renderer!.root.findByProps({ testID: 'pace-status-badge' });
    expect(badge).toBeDefined();
  });

  it('renders "On Track" label for on-track status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on-track" />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('On Track');
  });

  it('renders "Slightly Over" label for slightly-over status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="slightly-over" />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Slightly Over');
  });

  it('renders "Over Pace" label for over-pace status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="over-pace" />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Over Pace');
  });

  it('renders the icon for on-track', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on-track" />);
    });
    const icon = renderer!.root.findByProps({ testID: 'pace-status-badge-icon' });
    expect(icon.props.children).toBe('✓');
  });

  it('renders the icon for slightly-over', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="slightly-over" />);
    });
    const icon = renderer!.root.findByProps({ testID: 'pace-status-badge-icon' });
    expect(icon.props.children).toBe('!');
  });

  it('renders the icon for over-pace', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="over-pace" />);
    });
    const icon = renderer!.root.findByProps({ testID: 'pace-status-badge-icon' });
    expect(icon.props.children).toBe('⚠');
  });

  it('has the correct accessibility label for on-track', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceStatusBadge status="on-track" />);
    });
    const badge = renderer!.root.findByProps({ testID: 'pace-status-badge' });
    expect(badge.props.accessibilityLabel).toBe('Pace status: On Track');
  });
});
