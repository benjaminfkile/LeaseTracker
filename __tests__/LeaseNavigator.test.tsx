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

jest.mock('../src/screens/leases/EditLeaseScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    EditLeaseScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'edit-lease-screen' },
        MockReact.createElement(Text, { testID: 'edit-lease-title' }, 'Edit Lease'),
      ),
  };
});

jest.mock('../src/screens/leases/TurnInChecklistScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    TurnInChecklistScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'turn-in-checklist-screen' },
        MockReact.createElement(Text, { testID: 'turn-in-checklist-title' }, 'Turn-In Checklist'),
      ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { LeaseNavigator } from '../src/navigation/LeaseNavigator';

describe('LeaseNavigator', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <NavigationContainer>
          <LeaseNavigator />
        </NavigationContainer>,
      );
    });
  });

  it('renders LeaseListScreen as the initial route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <LeaseNavigator />
        </NavigationContainer>,
      );
    });
    const listTitle = renderer!.root.findByProps({ testID: 'lease-list-title' });
    expect(listTitle).toBeDefined();
  });
});
