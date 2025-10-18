// metro.config.js - 高速化版
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// パスエイリアスの設定
config.resolver.alias = {
  '@': './src',
};

// キャッシュとウォッチャーの最適化
config.cacheStores = [
  {
    get: () => null,
    set: () => null,
  },
];

// ファイルウォッチャーの最適化
config.watchFolders = [];

// TypeScript の高速化
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
