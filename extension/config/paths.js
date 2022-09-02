'use strict';

const path = require('path');

const PATHS = {
  src: path.resolve(__dirname, '../src'),
  Flatted: path.resolve(__dirname, '../../node_modules/flatted/esm/index.js'),
  PixiExposer: path.resolve(__dirname, '../../src/PixiExposer.js'),
  build: path.resolve(__dirname, '../build'),
};

module.exports = PATHS;
