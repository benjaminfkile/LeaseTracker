import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Config from 'react-native-config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BannerAdView(): React.ReactElement {
  const insets = useSafeAreaInsets();

  const prodUnitId: string | undefined =
    Platform.OS === 'ios'
      ? Config.ADMOB_BANNER_UNIT_ID_IOS
      : Config.ADMOB_BANNER_UNIT_ID_ANDROID;

  const unitId: string = __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : (prodUnitId ?? TestIds.ADAPTIVE_BANNER);

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="banner-ad-view"
    >
      <BannerAd
        unitId={unitId}
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
