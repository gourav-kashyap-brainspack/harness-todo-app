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
  ],
};
