const STANDALONE_BUILD = process.argv.includes('--standalone');
if (STANDALONE_BUILD) {
  console.log('standalone build; using local packages');
} else {
  console.log('online build; using cdn packages')
}

console.log("Transforming and copying python worker")
const fs = require('fs');
let workerContents = fs.readFileSync('src/utils/csworker_sw.js', 'utf8');
if (STANDALONE_BUILD) {
  workerContents = workerContents.replace('const STANDALONE_BUILD = false', 'const STANDALONE_BUILD = true')
}
fs.writeFileSync('public/static/js/mono/csworker_sw.js', workerContents, 'utf8')



const rewire = require('rewire')
const path = require('path')
// const BundleTracker = require('webpack-bundle-tracker');

// Pointing to file which we want to re-wire — this is original build script
const defaults = rewire('react-scripts/scripts/build.js')

// Getting configuration from original build script
const config = defaults.__get__('config')
//console.log('ORIGINAL CONFIG: ', config);

// build folder
config.output.path = path.join(path.dirname(__dirname), 'build')

config.output.filename = '[name]-[fullhash].js'
if (STANDALONE_BUILD) {
  config.module.rules.push({
      loader: 'string-replace-loader',
      test: /PyEditor\.tsx$/,
      options: {
        search: 'STANDALONE_BUILD = false',
        replace: 'STANDALONE_BUILD = true',
        strict: true,
      }
  });
  config.module.rules.push({
    loader: 'string-replace-loader',
    test: /pyworker_sw\.js$/,
    options: {
      search: 'STANDALONE_BUILD = false',
      replace: 'STANDALONE_BUILD = true',
      strict: true,
    }
  });
}
config.devtool = undefined;

//console.log('UPDATED CONFIG: ', config);
// config.plugins = new BundleTracker({filename: './webpack-stats.json'})

// config.optimization.splitChunks.chunks = 'all'
