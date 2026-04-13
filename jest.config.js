module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation/.*|@react-native-async-storage/.*|react-native-vision-camera|@notifee/.*|react-native-google-mobile-ads|react-native-config|react-native-android-widget)/)',
  ],
  moduleNameMapper: {
    '@react-native-async-storage/async-storage':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
    'react-native-android-widget':
      '<rootDir>/__mocks__/react-native-android-widget.js',
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
    'react-native-vision-camera': '<rootDir>/__mocks__/react-native-vision-camera.js',
    '@notifee/react-native': '<rootDir>/__mocks__/@notifee/react-native.js',
    'react-native-google-mobile-ads': '<rootDir>/__mocks__/react-native-google-mobile-ads.js',
  },
};
