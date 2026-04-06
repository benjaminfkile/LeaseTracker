jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/2435281174' },
}));

jest.mock('react-native-config', () => ({
  ADMOB_BANNER_UNIT_ID_IOS: undefined,
  ADMOB_BANNER_UNIT_ID_ANDROID: undefined,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { BannerAdView } from '../src/components/BannerAdView';

describe('BannerAdView', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<BannerAdView />);
    });
  });

  it('renders with testID banner-ad-view', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BannerAdView />);
    });
    const container = renderer!.root.findByProps({ testID: 'banner-ad-view' });
    expect(container).toBeDefined();
  });

  it('renders a BannerAd element', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BannerAdView />);
    });
    const bannerAds = renderer!.root.findAllByType('BannerAd' as unknown as React.ElementType);
    expect(bannerAds.length).toBeGreaterThan(0);
  });

  it('passes ANCHORED_ADAPTIVE_BANNER size to BannerAd', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BannerAdView />);
    });
    const bannerAd = renderer!.root.findByType('BannerAd' as unknown as React.ElementType);
    expect(bannerAd.props.size).toBe('ANCHORED_ADAPTIVE_BANNER');
  });

  it('uses the test ad unit ID in dev mode', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BannerAdView />);
    });
    const bannerAd = renderer!.root.findByType('BannerAd' as unknown as React.ElementType);
    expect(bannerAd.props.unitId).toBe('ca-app-pub-3940256099942544/2435281174');
  });
});

describe('BannerAdView platform-specific production unit ID', () => {
  const TEST_ID = 'ca-app-pub-3940256099942544/2435281174';

  beforeEach(() => {
    jest.resetModules();
    global.__DEV__ = false;
  });

  afterEach(() => {
    global.__DEV__ = true;
  });

  it('uses ADMOB_BANNER_UNIT_ID_IOS on iOS in production', async () => {
    jest.mock('react-native', () => ({
      Platform: { OS: 'ios' },
      StyleSheet: { create: (s: unknown) => s },
      View: 'View',
    }));
    jest.mock('react-native-config', () => ({
      ADMOB_BANNER_UNIT_ID_IOS: 'ios-prod-unit-id',
      ADMOB_BANNER_UNIT_ID_ANDROID: 'android-prod-unit-id',
    }));
    jest.mock('react-native-google-mobile-ads', () => ({
      BannerAd: 'BannerAd',
      BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
      TestIds: { ADAPTIVE_BANNER: TEST_ID },
    }));
    jest.mock('react-native-safe-area-context', () => ({
      useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BannerAdView: BannerAdViewProd } = require('../src/components/BannerAdView');
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(React.createElement(BannerAdViewProd));
    });
    const bannerAd = renderer!.root.findByType('BannerAd' as unknown as React.ElementType);
    expect(bannerAd.props.unitId).toBe('ios-prod-unit-id');
  });

  it('uses ADMOB_BANNER_UNIT_ID_ANDROID on Android in production', async () => {
    jest.mock('react-native', () => ({
      Platform: { OS: 'android' },
      StyleSheet: { create: (s: unknown) => s },
      View: 'View',
    }));
    jest.mock('react-native-config', () => ({
      ADMOB_BANNER_UNIT_ID_IOS: 'ios-prod-unit-id',
      ADMOB_BANNER_UNIT_ID_ANDROID: 'android-prod-unit-id',
    }));
    jest.mock('react-native-google-mobile-ads', () => ({
      BannerAd: 'BannerAd',
      BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
      TestIds: { ADAPTIVE_BANNER: TEST_ID },
    }));
    jest.mock('react-native-safe-area-context', () => ({
      useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BannerAdView: BannerAdViewProd } = require('../src/components/BannerAdView');
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(React.createElement(BannerAdViewProd));
    });
    const bannerAd = renderer!.root.findByType('BannerAd' as unknown as React.ElementType);
    expect(bannerAd.props.unitId).toBe('android-prod-unit-id');
  });

  it('falls back to test ID when production unit ID is missing', async () => {
    jest.mock('react-native', () => ({
      Platform: { OS: 'ios' },
      StyleSheet: { create: (s: unknown) => s },
      View: 'View',
    }));
    jest.mock('react-native-config', () => ({
      ADMOB_BANNER_UNIT_ID_IOS: undefined,
      ADMOB_BANNER_UNIT_ID_ANDROID: undefined,
    }));
    jest.mock('react-native-google-mobile-ads', () => ({
      BannerAd: 'BannerAd',
      BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
      TestIds: { ADAPTIVE_BANNER: TEST_ID },
    }));
    jest.mock('react-native-safe-area-context', () => ({
      useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BannerAdView: BannerAdViewProd } = require('../src/components/BannerAdView');
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(React.createElement(BannerAdViewProd));
    });
    const bannerAd = renderer!.root.findByType('BannerAd' as unknown as React.ElementType);
    expect(bannerAd.props.unitId).toBe(TEST_ID);
  });
});
