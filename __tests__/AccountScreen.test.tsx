jest.mock('react-native-config', () => ({
  API_URL: 'https://test.api',
  COGNITO_USER_POOL_ID: 'us-east-1_test',
  COGNITO_CLIENT_ID: 'testclientid',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { display_name: 'John Doe', email: 'john@example.com', subscription_tier: 'free', subscription_expires_at: null },
    isLoading: false,
  }),
  useMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AccountScreen } from '../src/screens/settings/AccountScreen';

describe('AccountScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AccountScreen />);
    });
  });

  it('renders with testID account-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AccountScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'account-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Account title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AccountScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'account-title' });
    expect(title).toBeDefined();
  });

  it('renders the signed-in email', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AccountScreen />);
    });
    const emailText = renderer!.root.findByProps({ testID: 'account-email' });
    expect(emailText).toBeDefined();
    expect(emailText.props.children).toBe('john@example.com');
  });

  it('renders change password row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AccountScreen />);
    });
    const row = renderer!.root.findByProps({ testID: 'account-change-password' });
    expect(row).toBeDefined();
  });
});
