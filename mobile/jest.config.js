module.exports = {
  preset: 'react-native',
  setupFiles: ['react-native-gesture-handler/jestSetup.js', '<rootDir>/jest/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-css-interop|nativewind|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-vector-icons|react-native-mmkv|react-native-bootsplash|react-native-keychain|@tanstack)/)',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/cssMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'App.tsx',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
