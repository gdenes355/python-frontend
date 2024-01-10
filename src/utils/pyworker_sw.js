const STANDALONE_BUILD = false;
const pyodideImportPath = STANDALONE_BUILD
  ? "/static/cdn-mirror/pyodide/v0.22.1/full/pyodide.js"
  : "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js";
const pyodideIndexUrl = STANDALONE_BUILD
  ? "/static/cdn-mirror/pyodide/v0.22.1/full/"
  : "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/";

importScripts(pyodideImportPath);

// communication with the main site
// there are two commands implemented at the moment:
//   run(code) which runs a piece of code
//   input(data) which provides the input from the user to a currently blocked code
// the assumption is that run will not be called while there is an active Python code running
// also, there is an assumption that there cannot be two synchronouse inputs
onmessage = function (e) {
  if (e.data.cmd === "setSharedBuffers") {
    if (self.pyodide) {
      self.pyodide.setInterruptBuffer(e.data.interruptBuffer);
      self.interruptBufferToSet = null;
    } else {
      self.interruptBufferToSet = e.data.interruptBuffer;
    }
    self.interruptBuffer = e.data.interruptBuffer;
    self.keyDownBuffer = e.data.keyDownBuffer;
  } else if (e.data.cmd === "debug") {
    let reason = "ok";
    try {
      if (e.data.initCode) {
        self.pyodide.globals.get("pyexec")(e.data.initCode, [], []);
      }
      self.pyodide.globals.get("pydebug")(e.data.code, e.data.breakpoints);
    } catch (err) {
      if (err.message.includes("KeyboardInterrupt")) {
        reason = "interrupt";
      } else {
        err = err.toString();
        err = err.replace(
          /"\<exec\>", line \d+.*(\n.*)*File "<unknown>"/,
          "<main.py>)"
        );
        workerPrint(err);
        reason = "error";
      }
    }
    self.postMessage({ cmd: "debug-finished", reason });
  } else if (e.data.cmd === "run") {
    let reason = "ok";
    try {
      if (e.data.initCode) {
        self.pyodide.globals.get("pyexec")(e.data.initCode, [], []);
      }
      self.pyodide.globals.get("pyrun")(e.data.code);
    } catch (err) {
      if (err.message.includes("KeyboardInterrupt")) {
        reason = "interrupt";
      } else {
        workerPrint(err);
        reason = "error";
      }
    }
    self.postMessage({ cmd: "debug-finished", reason });
  } else if (e.data.cmd === "test") {
    let results = e.data.tests.map((t) => {
      return {
        outcome: false,
        err: "Failed to compile",
        code: e.data.code,
        bookNode: e.data.bookNode,
      };
    });
    try {
      if (e.data.initCode) {
        self.pyodide.globals.get("pyexec")(e.data.initCode, [], []);
      }
      const tests = e.data.tests;
      results = tests.map((test) =>
        self.pyodide.globals.get("pyexec")(
          e.data.code,
          test.in,
          test.out,
          test.reveal ?? true
        )
      );
    } catch (err) {
      if (err.message.includes("KeyboardInterrupt")) {
        results = e.data.tests.map((t) => {
          return {
            outcome: false,
            err: "Interrupted",
            code: e.data.code,
            bookNode: e.data.bookNode,
          };
        });
      } else {
        console.log("Error while running tests", err);
      }
    }
    self.postMessage({
      cmd: "test-finished",
      results,
      code: e.data.code,
      bookNode: e.data.bookNode,
    });
  } else if (e.data.cmd === "draw-turtle-example") {
    try {
      self.pyodide.globals.get("pyexec")(e.data.code, e.data.inputs, []);
    } catch (err) {
      console.log("Error while running turtle test draw", err);
    }
    self.postMessage({
      cmd: "draw-turtle-example-finished",
      bookNode: e.data.bookNode,
    });
  }
};

// loading code
const loadPyodideAsync = async () => {
  let initPyPromise = fetch("./init.py");
  self.pyodide = await loadPyodide({ indexURL: pyodideIndexUrl });

  initPyCode = await (await initPyPromise).text();

  if (self.interruptBufferToSet) {
    self.pyodide.setInterruptBuffer(self.interruptBufferToSet);
    self.interruptBufferToSet = null;
  }
  await self.pyodide.runPython(initPyCode);
};
loadPyodideAsync().then(() => self.postMessage({ cmd: "init-done" }));

// js proxy posting messages. Used from Python
// eslint-disable-next-line no-unused-vars
function workerPostMessage(msg) {
  self.postMessage(msg);
}
function workerPrint(msg) {
  self.postMessage({ cmd: "print", msg: msg });
}
function workerCheckKeyDown(keyCode) {
  return self.keyDownBuffer[keyCode] > 0;
}
function workerInterrupted() {
  return self.interruptBuffer && self.interruptBuffer[0] > 2;
}
