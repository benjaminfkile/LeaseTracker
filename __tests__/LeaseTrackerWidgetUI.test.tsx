import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LeaseTrackerWidgetUI } from '../src/widget/LeaseTrackerWidgetUI';
import type { WidgetSummary } from '../src/native/WidgetDataBridge';

const onTrackData: WidgetSummary = {
  milesRemaining: 12000,
  daysRemaining: 200,
  paceStatus: 'on-track',
  vehicleLabel: '2023 Toyota Camry SE',
};

const slightlyOverData: WidgetSummary = {
  milesRemaining: 5000,
  daysRemaining: 60,
  paceStatus: 'slightly-over',
  vehicleLabel: '2022 Honda Civic',
};

const overPaceData: WidgetSummary = {
  milesRemaining: 1000,
  daysRemaining: 30,
  paceStatus: 'over-pace',
  vehicleLabel: '2021 Ford F-150',
};

describe('LeaseTrackerWidgetUI', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LeaseTrackerWidgetUI data={onTrackData} />);
    });
  });

  it('renders the FlexWidget container', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={onTrackData} />,
      );
    });
    const container = renderer!.root.findByProps({ testID: 'flex-widget' });
    expect(container).toBeDefined();
  });

  it('displays On Track label for on-track pace status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={onTrackData} />,
      );
    });
    const texts = renderer!.root.findAllByProps({ testID: 'text-widget' });
    const values = texts.map(t => t.props.text as string);
    expect(values).toContain('On Track');
  });

  it('displays Slightly Over label for slightly-over pace status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={slightlyOverData} />,
      );
    });
    const texts = renderer!.root.findAllByProps({ testID: 'text-widget' });
    const values = texts.map(t => t.props.text as string);
    expect(values).toContain('Slightly Over');
  });

  it('displays Over Pace label for over-pace pace status', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={overPaceData} />,
      );
    });
    const texts = renderer!.root.findAllByProps({ testID: 'text-widget' });
    const values = texts.map(t => t.props.text as string);
    expect(values).toContain('Over Pace');
  });

  it('displays miles remaining value', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={onTrackData} />,
      );
    });
    const texts = renderer!.root.findAllByProps({ testID: 'text-widget' });
    const values = texts.map(t => t.props.text as string);
    expect(values.some(v => v.includes('12,000'))).toBe(true);
  });

  it('displays days remaining value', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={onTrackData} />,
      );
    });
    const texts = renderer!.root.findAllByProps({ testID: 'text-widget' });
    const values = texts.map(t => t.props.text as string);
    expect(values).toContain('200');
  });

  it('displays the vehicle label', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={onTrackData} />,
      );
    });
    const texts = renderer!.root.findAllByProps({ testID: 'text-widget' });
    const values = texts.map(t => t.props.text as string);
    expect(values).toContain('2023 Toyota Camry SE');
  });

  it('uses OPEN_APP click action on the container', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseTrackerWidgetUI data={onTrackData} />,
      );
    });
    const container = renderer!.root.findByProps({ testID: 'flex-widget' });
    expect(container.props.clickAction).toBe('OPEN_APP');
  });
});
