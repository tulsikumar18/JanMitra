module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-localization',
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@utils': './src/utils',
            '@assets': './src/assets',
            '@locales': './src/locales',
            '@hooks': './src/hooks',
            '@navigation': './src/navigation',
            '@config': './src/config'
          }
        }
      ]
    ]
  };
};