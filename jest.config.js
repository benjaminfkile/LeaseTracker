module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation/.*|react-native-android-widget)/)',
  ],
  moduleNameMapper: {
    'react-native-android-widget':
      '<rootDir>/__mocks__/react-native-android-widget.js',
  },
};
