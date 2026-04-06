jest.mock('react-native-safe-area-context', () => {
  const MockReact = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => MockReact.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn().mockResolvedValue(undefined) }),
}));

jest.mock('../src/api/subscriptionApi', () => ({
  verifyApplePurchase: jest.fn().mockResolvedValue({ isPremium: true }),
  verifyGooglePurchase: jest.fn().mockResolvedValue({ isPremium: true }),
}));

jest.mock('../src/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#F9FAFB',
      surface: '#FFFFFF',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      primary: '#4F6AF5',
      error: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
      border: '#E5E7EB',
    },
  }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SubscriptionScreen } from '../src/screens/settings/SubscriptionScreen';

describe('SubscriptionScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<SubscriptionScreen />);
    });
  });

  it('renders with testID subscription-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'subscription-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Go Premium title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'subscription-title' });
    expect(title).toBeDefined();
  });

  it('renders the hero section', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const hero = renderer!.root.findByProps({ testID: 'subscription-hero' });
    expect(hero).toBeDefined();
  });

  it('renders the feature list', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const features = renderer!.root.findByProps({ testID: 'subscription-features' });
    expect(features).toBeDefined();
  });

  it('renders monthly and yearly pricing tiles', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const monthly = renderer!.root.findByProps({ testID: 'subscription-plan-monthly' });
    const yearly = renderer!.root.findByProps({ testID: 'subscription-plan-yearly' });
    expect(monthly).toBeDefined();
    expect(yearly).toBeDefined();
  });

  it('renders Best Value chip on yearly tile', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const chip = renderer!.root.findByProps({ testID: 'subscription-best-value-chip' });
    expect(chip).toBeDefined();
  });

  it('renders the subscribe button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'subscription-subscribe-button' });
    expect(btn).toBeDefined();
  });

  it('renders the restore purchases link', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const restore = renderer!.root.findByProps({ testID: 'subscription-restore' });
    expect(restore).toBeDefined();
  });

  it('renders the legal footer with Terms, Privacy, and Billing links', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const legal = renderer!.root.findByProps({ testID: 'subscription-legal' });
    const terms = renderer!.root.findByProps({ testID: 'subscription-terms' });
    const privacy = renderer!.root.findByProps({ testID: 'subscription-privacy' });
    const billing = renderer!.root.findByProps({ testID: 'subscription-billing' });
    expect(legal).toBeDefined();
    expect(terms).toBeDefined();
    expect(privacy).toBeDefined();
    expect(billing).toBeDefined();
  });
});
