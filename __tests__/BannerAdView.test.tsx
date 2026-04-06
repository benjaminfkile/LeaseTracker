jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/2435281174' },
}));

jest.mock('react-native-config', () => ({
  ADMOB_BANNER_UNIT_ID: undefined,
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
