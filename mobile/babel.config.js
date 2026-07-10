module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
        extensions: [
          '.ios.js',
          '.android.js',
          '.ios.tsx',
          '.android.tsx',
          '.js',
          '.jsx',
          '.json',
          '.ts',
          '.tsx',
        ],
      },
    ],
    // react-native-reanimated/plugin MUST be listed last (NativeWind 4
    // animation utilities + reanimated worklets require it) — carry-forward
    // fix from the FND-001 review.
    'react-native-reanimated/plugin',
  ],
};
