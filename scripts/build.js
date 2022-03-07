const rewire = require('rewire');
const path = require('path');
//const BundleTracker = require('webpack-bundle-tracker');

// Pointing to file which we want to re-wire — this is original build script
const defaults = rewire('react-scripts/scripts/build.js');

// Getting configuration from original build script
let config = defaults.__get__('config');

// build into Django target
config.output.path = path.join(path.dirname(__dirname), 'build');

config.output.filename = '[name]-[hash].js'
//config.plugins = new BundleTracker({filename: './webpack-stats.json'})

//config.optimization.splitChunks.chunks = 'all'