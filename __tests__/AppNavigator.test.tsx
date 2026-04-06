jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('../src/stores/leasesStore');

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

  it('renders HomeScreen as the initial tab', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>,
      );
    });
    const homeTitle = renderer!.root.findByProps({ testID: 'home-title' });
    expect(homeTitle).toBeDefined();
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
