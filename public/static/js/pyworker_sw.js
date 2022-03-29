importScripts('https://cdn.jsdelivr.net/pyodide/v0.19.1/full/pyodide.js')

// communication with the main site
// there are two commands implemented at the moment:
//   run(code) which runs a piece of code
//   input(data) which provides the input from the user to a currently blocked code
// the assumption is that run will not be called while there is an active Python code running
// also, there is an assumption that there cannot be two synchronouse inputs
onmessage = function (e) {
  if (e.data.cmd === 'setInterruptBuffer') {
    if (self.pyodide) {
      self.pyodide.setInterruptBuffer(e.data.interruptBuffer)
      self.interruptBufferToSet = null
    } else {
      self.interruptBufferToSet = e.data.interruptBuffer
    }
  } else if (e.data.cmd === 'debug') {
    let reason = 'ok'
    try {
      self.pyodide.globals.get('pydebug')(e.data.code, e.data.breakpoints)
    } catch (err) {
      if (err.message.includes('KeyboardInterrupt')) {
        reason = 'interrupt'
      } else {
        workerPrint(err)
        reason = 'error'
      }
    }
    self.postMessage({ cmd: 'debug-finished', reason })
  } else if (e.data.cmd === 'test') {
    let results = e.data.tests.map((t) => { return { outcome: false, err: 'Failed to compile' } })
    console.log('running tests')
    try {
      const tests = e.data.tests
      results = tests.map((test) => self.pyodide.globals.get('pyexec')(e.data.code, test.in, test.out))
    } catch (err) {
      if (err.message.includes('KeyboardInterrupt')) {
        results = e.data.tests.map((t) => { return { outcome: false, err: 'Interrupted' } })
      }
    }
    self.postMessage({ cmd: 'test-finished', results })
  }
}

// loading code
const loadPyodideAsync = async () => {
  let initPyPromise = fetch("./init.py")
  self.pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.19.0/full/' })
  
  initPyCode = await (await initPyPromise).text()

  if (self.interruptBufferToSet) {
    self.pyodide.setInterruptBuffer(self.interruptBufferToSet)
    self.interruptBufferToSet = null
  }
  
  await self.pyodide.runPython(initPyCode)
}
loadPyodideAsync().then(() => self.postMessage({ cmd: 'init-done' }))

// js proxy posting messages. Used from Python
// eslint-disable-next-line no-unused-vars
function workerPostMessage (msg) { self.postMessage(msg) }
function workerPrint (msg) { self.postMessage({ cmd: 'print', msg: msg }) }
