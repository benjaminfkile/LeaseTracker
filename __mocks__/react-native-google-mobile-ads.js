const BannerAd = 'BannerAd';
const InterstitialAd = { createForAdRequest: jest.fn() };
const RewardedAd = { createForAdRequest: jest.fn() };
const BannerAdSize = {
  BANNER: 'BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
};
const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/2435281174',
};
const MobileAds = jest.fn(() => ({ initialize: jest.fn(() => Promise.resolve()) }));

module.exports = {
  BannerAd,
  InterstitialAd,
  RewardedAd,
  BannerAdSize,
  TestIds,
  MobileAds,
};
