// @ts-check
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
if (!config.resolver.sourceExts.includes('wasm')) {
  config.resolver.sourceExts.push('wasm');
}
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}
module.exports = config;
