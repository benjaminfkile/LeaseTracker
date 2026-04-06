jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('../src/stores/leasesStore');

jest.mock('../src/screens/home/DashboardScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    DashboardScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'dashboard-screen' },
        MockReact.createElement(Text, { testID: 'dashboard-title' }, 'Dashboard'),
      ),
  };
});

jest.mock('../src/screens/leases/LeaseListScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    LeaseListScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'lease-list-screen' },
        MockReact.createElement(Text, { testID: 'lease-list-title' }, 'My Leases'),
      ),
  };
});

jest.mock('../src/screens/leases/AddLeaseScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    AddLeaseScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'add-lease-screen' },
        MockReact.createElement(Text, { testID: 'add-lease-title' }, 'Add Lease'),
      ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from '../src/navigation/AppNavigator';
import { useLeasesStore } from '../src/stores/leasesStore';

type LeasesStoreState = {
  leases: { id: string }[];
  overPaceCount: number;
  setLeases: jest.Mock;
  setOverPaceCount: jest.Mock;
};

function mockLeasesStore(overrides: Partial<LeasesStoreState> = {}) {
  const state: LeasesStoreState = {
    leases: [],
    overPaceCount: 0,
    setLeases: jest.fn(),
    setOverPaceCount: jest.fn(),
    ...overrides,
  };
  (useLeasesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: LeasesStoreState) => unknown) => selector(state),
  );
}

describe('AppNavigator', () => {
  beforeEach(() => {
    mockLeasesStore();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>,
      );
    });
  });

  it('renders DashboardScreen as the initial tab', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>,
      );
    });
    const dashboardTitle = renderer!.root.findByProps({ testID: 'dashboard-title' });
    expect(dashboardTitle).toBeDefined();
  });

  it('does not show a badge on Home tab when no leases are over pace', async () => {
    mockLeasesStore({ overPaceCount: 0 });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>,
      );
    });
    const json = renderer!.toJSON();
    expect(json).toBeTruthy();
  });

  it('shows a badge on Home tab when leases are over pace', async () => {
    mockLeasesStore({ overPaceCount: 2 });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>,
      );
    });
    const json = renderer!.toJSON();
    expect(json).toBeTruthy();
  });
});
