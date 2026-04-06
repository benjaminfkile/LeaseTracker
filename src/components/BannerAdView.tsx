import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Config from 'react-native-config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AD_UNIT_ID: string = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : (Config.ADMOB_BANNER_UNIT_ID ?? TestIds.ADAPTIVE_BANNER);

export function BannerAdView(): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="banner-ad-view"
    >
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
});
