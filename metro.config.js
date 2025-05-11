// metro.config.js - Expo SDK 53

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

// Load the default Metro config provided by Expo
const config = getDefaultConfig(__dirname);

// Map Node core modules to their browser-friendly counterparts or stubs
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),    // Polyfill Node 'stream' module
  events: require.resolve('events'),              // Polyfill Node 'events' module
  http: require.resolve('stream-http'),           // Polyfill Node 'http' module
  https: require.resolve('https-browserify'),     // Polyfill Node 'https' module
  crypto: require.resolve('crypto-browserify'),   // Polyfill Node 'crypto' module
  buffer: require.resolve('buffer'),              // Polyfill Node 'buffer' module
  url: require.resolve('url'),                    // Polyfill Node 'url' module
  zlib: require.resolve('browserify-zlib'),       // Polyfill Node 'zlib' module
  util: require.resolve('util'),                  // Polyfill Node 'util' module
  assert: require.resolve('assert'),              // Polyfill Node 'assert' module
  net: path.resolve(__dirname, 'empty.js'),       // Stub out Node 'net' module (empty)
  tls: path.resolve(__dirname, 'empty.js'),       // Stub out Node 'tls' module (empty)
};

// Add 'cjs' extension to the list of source file extensions
config.resolver.sourceExts.push('cjs');

module.exports = config;
