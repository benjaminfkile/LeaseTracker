import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TripCard } from '../src/components/TripCard';
import type { SavedTrip } from '../src/types/api';

const mockTrip: SavedTrip = {
  id: 'trip-1',
  lease_id: 'lease-1',
  user_id: 'user-1',
  name: 'Road trip to Denver',
  estimated_miles: 250,
  trip_date: '2026-05-10',
  notes: 'Some notes',
  is_completed: false,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

const mockTripNoName: SavedTrip = {
  id: 'trip-2',
  lease_id: 'lease-1',
  user_id: 'user-1',
  name: '',
  estimated_miles: 120,
  trip_date: '2026-06-15',
  notes: null,
  is_completed: false,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const mockTripLargeDistance: SavedTrip = {
  id: 'trip-3',
  lease_id: 'lease-1',
  user_id: 'user-1',
  name: 'Long drive',
  estimated_miles: 1500,
  trip_date: '2026-03-20',
  notes: null,
  is_completed: false,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

describe('TripCard', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<TripCard trip={mockTrip} />);
    });
  });

  it('renders with default testID trip-card-{id}', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} />);
    });
    const card = renderer!.root.findByProps({ testID: 'trip-card-trip-1' });
    expect(card).toBeDefined();
  });

  it('accepts a custom testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TripCard trip={mockTrip} testID="custom-trip-card" />,
      );
    });
    const card = renderer!.root.findByProps({ testID: 'custom-trip-card' });
    expect(card).toBeDefined();
  });

  describe('trip name', () => {
    it('renders the trip name when present', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} />);
      });
      const name = renderer!.root.findByProps({ testID: 'trip-name-trip-1' });
      expect(name.props.children).toBe('Road trip to Denver');
    });

    it('renders "Trip" as default name when name is empty', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTripNoName} />);
      });
      const name = renderer!.root.findByProps({ testID: 'trip-name-trip-2' });
      expect(name.props.children).toBe('Trip');
    });

    it('renders "Trip" as default name when name is whitespace only', async () => {
      const tripWhitespace: SavedTrip = { ...mockTrip, id: 'trip-ws', name: '   ' };
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={tripWhitespace} />);
      });
      const name = renderer!.root.findByProps({ testID: 'trip-name-trip-ws' });
      expect(name.props.children).toBe('Trip');
    });
  });

  describe('trip date', () => {
    it('renders the formatted trip date', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} />);
      });
      const date = renderer!.root.findByProps({ testID: 'trip-date-trip-1' });
      expect(date.props.children).toBe('May 10, 2026');
    });

    it('renders a date from a different month correctly', async () => {
      const juneTrip: SavedTrip = { ...mockTrip, id: 'trip-jun', trip_date: '2026-06-15' };
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={juneTrip} />);
      });
      const date = renderer!.root.findByProps({ testID: 'trip-date-trip-jun' });
      expect(date.props.children).toBe('Jun 15, 2026');
    });
  });

  describe('trip distance', () => {
    it('renders the distance with "mi" suffix', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} />);
      });
      const distance = renderer!.root.findByProps({ testID: 'trip-distance-trip-1' });
      expect(distance.props.children).toBe('250 mi');
    });

    it('formats large distances with locale separator', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTripLargeDistance} />);
      });
      const distance = renderer!.root.findByProps({ testID: 'trip-distance-trip-3' });
      expect(distance.props.children).toBe('1,500 mi');
    });
  });

  describe('impact line', () => {
    it('renders fallback impact text when remainingMiles is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} />);
      });
      const impact = renderer!.root.findByProps({ testID: 'trip-impact-trip-1' });
      expect(impact.props.children).toBe('−250 mi from budget');
    });

    it('renders impact line with remainingMiles when provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TripCard trip={mockTrip} remainingMiles={5000} />,
        );
      });
      const impact = renderer!.root.findByProps({ testID: 'trip-impact-trip-1' });
      expect(impact.props.children).toBe(
        'Uses 250 of your 5,000 remaining miles',
      );
    });

    it('formats remainingMiles with locale separator', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TripCard trip={mockTripLargeDistance} remainingMiles={12500} />,
        );
      });
      const impact = renderer!.root.findByProps({ testID: 'trip-impact-trip-3' });
      expect(impact.props.children).toBe(
        'Uses 1,500 of your 12,500 remaining miles',
      );
    });

    it('renders impact line when remainingMiles is zero', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TripCard trip={mockTrip} remainingMiles={0} />,
        );
      });
      const impact = renderer!.root.findByProps({ testID: 'trip-impact-trip-1' });
      expect(impact.props.children).toBe('Uses 250 of your 0 remaining miles');
    });
  });

  describe('Mark Complete button', () => {
    it('renders the Mark Complete button for active trips when onMarkComplete is provided', async () => {
      const onMarkComplete = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TripCard trip={mockTrip} onMarkComplete={onMarkComplete} />,
        );
      });
      const button = renderer!.root.findByProps({ testID: 'trip-mark-complete-trip-1' });
      expect(button).toBeDefined();
    });

    it('does not render Mark Complete button when onMarkComplete is not provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} />);
      });
      const buttons = renderer!.root.findAllByProps({
        testID: 'trip-mark-complete-trip-1',
      });
      expect(buttons).toHaveLength(0);
    });

    it('does not render Mark Complete button for completed trips', async () => {
      const onMarkComplete = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TripCard trip={mockTrip} completed onMarkComplete={onMarkComplete} />,
        );
      });
      const buttons = renderer!.root.findAllByProps({
        testID: 'trip-mark-complete-trip-1',
      });
      expect(buttons).toHaveLength(0);
    });

    it('calls onMarkComplete when the Mark Complete button is pressed', async () => {
      const onMarkComplete = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TripCard trip={mockTrip} onMarkComplete={onMarkComplete} />,
        );
      });
      const button = renderer!.root.findByProps({ testID: 'trip-mark-complete-trip-1' });
      await ReactTestRenderer.act(() => {
        button.props.onPress();
      });
      expect(onMarkComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('completed state', () => {
    it('renders a checkmark for completed trips', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} completed />);
      });
      const checkmark = renderer!.root.findByProps({ testID: 'trip-checkmark-trip-1' });
      expect(checkmark).toBeDefined();
      expect(checkmark.props.children).toBe('✓');
    });

    it('does not render a checkmark for active trips', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TripCard trip={mockTrip} />);
      });
      const checkmarks = renderer!.root.findAllByProps({ testID: 'trip-checkmark-trip-1' });
      expect(checkmarks).toHaveLength(0);
    });

    it('does not render a checkmark when completed is false', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TripCard trip={mockTrip} completed={false} />,
        );
      });
      const checkmarks = renderer!.root.findAllByProps({ testID: 'trip-checkmark-trip-1' });
      expect(checkmarks).toHaveLength(0);
    });
  });
});
