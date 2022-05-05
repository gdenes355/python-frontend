const STANDALONE_BUILD = process.argv.includes('--standalone');
if (STANDALONE_BUILD) {
  console.log('standalone build; using local packages');
} else {
  console.log('online build; using cdn packages')
}

console.log("Transforming and copying python worker")
const fs = require('fs');
let workerContents = fs.readFileSync('src/utils/pyworker_sw.js', 'utf8');
if (STANDALONE_BUILD) {
  workerContents = workerContents.replace('const STANDALONE_BUILD = false', 'const STANDALONE_BUILD = true')
}
fs.writeFileSync('public/static/js/pyworker_sw.js', workerContents, 'utf8')

