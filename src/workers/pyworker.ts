/// <reference lib="webworker" />

import { TestCase } from "../models/Tests";
import { WorkerData, WorkerTestDto } from "../coderunner/WorkerDtos";
import { PyodideInterface } from "../types/pyodide/main";
import { SessionFile } from "../models/SessionFile";

type WorkerContext = {
  pyodide: PyodideInterface | null;
  interruptBufferToSet: Uint8Array | null;
  interruptBuffer: Uint8Array | null;
  keyDownBuffer: Uint8Array | null;
  micropipInitialised: boolean;
  sessionFileLockTime: number | null;
};

const workerContext: WorkerContext = {
  pyodide: null,
  interruptBufferToSet: null,
  interruptBuffer: null,
  keyDownBuffer: null,
  micropipInitialised: false,
  sessionFileLockTime: null,
};

// communication with the main site
// there are two commands implemented at the moment:
//   run(code) which runs a piece of code
//   input(data) which provides the input from the user to a currently blocked code
// the assumption is that run will not be called while there is an active Python code running
// also, there is an assumption that there cannot be two synchronouse inputs
self.onmessage = (e: MessageEvent<WorkerData>) => {
  if (e.data.cmd === "init") {
    initialise(e.data.standalone);
    return;
  } else if (e.data.cmd === "setSharedBuffers") {
    if (workerContext.pyodide) {
      workerContext.pyodide.setInterruptBuffer(e.data.interruptBuffer);
      workerContext.interruptBufferToSet = null;
    } else {
      workerContext.interruptBufferToSet = e.data.interruptBuffer;
    }
    workerContext.interruptBuffer = e.data.interruptBuffer;
    workerContext.keyDownBuffer = e.data.keyDownBuffer;
  } else if (e.data.cmd === "install-deps") {
    const data = e.data;
    (async () => {
      for (const dep of data.deps) {
        await installPackage(dep);
      }
      self.postMessage({
        cmd: "install-deps-finished",
      });
    })();
  } else if (e.data.cmd === "debug") {
    if (!workerContext.pyodide) {
      workerPrint("Pyodide not yet initialised");
      return;
    }
    let reason = "ok";
    try {
      if (e.data.initCode) {
        workerContext.pyodide.globals.get("pyexec")(e.data.initCode, [], []);
      }
      if (e.data.isSessionFilesAllowed) {
        initialiseSessionFiles(e.data.sessionFiles);
      }
      workerContext.pyodide.globals.get("pydebug")(
        e.data.code,
        e.data.breakpoints,
        e.data.watches
      );
    } catch (err: any) {
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
    const updatedSessionFiles = e.data.isSessionFilesAllowed
      ? getUpdatedSessionFiles()
      : [];
    self.postMessage({ cmd: "debug-finished", reason, updatedSessionFiles });
  } else if (e.data.cmd === "run") {
    if (!workerContext.pyodide) {
      workerPrint("Pyodide not yet initialised");
      return;
    }
    let reason = "ok";
    try {
      if (e.data.initCode) {
        workerContext.pyodide.globals.get("pyexec")(e.data.initCode, [], []);
      }
      if (e.data.isSessionFilesAllowed) {
        initialiseSessionFiles(e.data.sessionFiles);
      }
      workerContext.pyodide.globals.get("pyrun")(e.data.code);
    } catch (err: any) {
      if (err.message.includes("KeyboardInterrupt")) {
        reason = "interrupt";
      } else {
        workerPrint(err);
        reason = "error";
      }
    }
    const updatedSessionFiles = e.data.isSessionFilesAllowed
      ? getUpdatedSessionFiles()
      : [];
    self.postMessage({ cmd: "debug-finished", reason, updatedSessionFiles });
  } else if (e.data.cmd === "test") {
    if (!workerContext.pyodide) {
      workerPrint("Pyodide not yet initialised");
      return;
    }
    if (e.data.isSessionFilesAllowed) {
      initialiseSessionFiles(e.data.sessionFiles);
    }
    const data = e.data as WorkerTestDto;
    let results = data.tests.map((_: TestCase) => {
      return {
        outcome: false,
        err: "Failed to compile",
        code: data.code,
        bookNode: data.bookNode,
      };
    });
    try {
      if (data.initCode) {
        workerContext.pyodide.globals.get("pyexec")(data.initCode, [], []);
      }
      const tests = data.tests;
      results = tests.map((test: TestCase) =>
        workerContext.pyodide?.globals.get("pyexec")(
          data.code,
          test.in,
          test.out,
          test.reveal ?? true
        )
      );
    } catch (err: any) {
      if (err.message.includes("KeyboardInterrupt")) {
        results = data.tests.map((_: TestCase) => {
          return {
            outcome: false,
            err: "Interrupted",
            code: data.code,
            bookNode: data.bookNode,
          };
        });
      } else {
        console.log("Error while running tests", err);
      }
    }
    self.postMessage({
      cmd: "test-finished",
      results,
      code: data.code,
      bookNode: data.bookNode,
    });
  } else if (e.data.cmd === "draw-turtle-example") {
    try {
      workerContext.pyodide?.globals.get("pyexec")(
        e.data.code,
        e.data.inputs,
        []
      );
    } catch (err: any) {
      console.log("Error while running turtle test draw", err);
    }
    workerPostMessage({
      cmd: "draw-turtle-example-finished",
      bookNode: e.data.bookNode,
    });
  }
};

// Session files and folders
const initialiseSessionFolder = () => {
  try {
    workerContext!.pyodide!.FS.mkdirTree("session");
  } catch (e) {
    console.log("Error initialising session folder", e);
  }
};

const initialiseSessionFiles = (sessionFiles: SessionFile[] | null) => {
  if (!workerContext.pyodide || !sessionFiles) {
    return;
  }
  for (const file of sessionFiles) {
    workerContext.pyodide.FS.writeFile(`session/${file.filename}`, file.data);
  }
  workerContext.sessionFileLockTime = Date.now();
};

const getUpdatedSessionFiles = () => {
  const sessionFilesUpdated: SessionFile[] = [];

  const py = `def snapshot(root): 
  snap = {} 
  for dirpath, _, filenames in os.walk(root): 
    for name in filenames: 
      p = os.path.join(dirpath, name) 
      st = os.stat(p) 
      snap[p] = int(st.st_mtime_ns) / 1000000
  return snap
session_snapshot = to_js(snapshot("session"))
session_snapshot`;
  const snapshot = workerContext.pyodide?.runPython(py);
  const fileNames = Object.keys(snapshot);

  for (const fileName of fileNames) {
    const lastModifiedTime = snapshot[fileName];
    if (
      workerContext.sessionFileLockTime &&
      lastModifiedTime > workerContext.sessionFileLockTime
    ) {
      // @ts-ignore
      const file = workerContext.pyodide?.FS.readFile(fileName);
      if (file) {
        sessionFilesUpdated.push({
          filename: fileName,
          data: file as string | Uint8Array,
          isText:
            fileName.endsWith(".txt") ||
            fileName?.endsWith(".csv") ||
            fileName?.endsWith(".json"), // probably not an exhaustive list
        });
      }
    }
  }
  workerContext.sessionFileLockTime = null;
  return sessionFilesUpdated;
};

const initialiseMicroPip = async () => {
  workerPrint("PythonSponge initialising micropip\n");
  await workerContext.pyodide?.loadPackage("micropip");
  workerPrint(`PythonSponge successfully installed package: micropip\n`);
  workerContext.micropipInitialised = true;
};

const installPackage = async (packageName: string) => {
  if (!workerContext.micropipInitialised) {
    await initialiseMicroPip();
  }
  workerPrint(`Installing package: ${packageName}\n`);
  try {
    await workerContext.pyodide?.loadPackage(packageName);
    workerPrint(
      `PythonSponge successfully installed package '${packageName}'\n`
    );
  } catch (err) {
    console.log(err);
    workerPrint(`Error installing package: ${packageName}\n${err}`);
  }
};

const initialise = async (standalone: boolean) => {
  const pyodideImportPath = standalone
    ? "/static/cdn-mirror/pyodide/v0.28.0/full/pyodide.js"
    : "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.js";

  const pyodideIndexUrl = standalone
    ? "/static/cdn-mirror/pyodide/v0.28.0/full/"
    : "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/";

  // dynamically import library from pyodideImportPath
  importScripts(pyodideImportPath);
  const loadPyodide = (self as any).loadPyodide as (opts: {
    indexURL: string;
  }) => Promise<PyodideInterface>;

  // await in parallel
  const [initPyPromise, pyodidePromise] = await Promise.all([
    fetch("/static/js/init.py"),
    loadPyodide({ indexURL: pyodideIndexUrl }),
  ]);
  const initPyCode = await initPyPromise.text();
  workerContext.pyodide = await pyodidePromise;
  if (workerContext.interruptBufferToSet) {
    workerContext.pyodide?.setInterruptBuffer(
      workerContext.interruptBufferToSet
    );
    workerContext.interruptBufferToSet = null;
  }
  await workerContext.pyodide?.runPythonAsync(initPyCode);
  initialiseSessionFolder();
  self.postMessage({ cmd: "init-done" });
};

// js proxy posting messages. Used from Python
function workerPostMessage(msg: any) {
  self.postMessage(msg);
}
function workerPrint(msg: any) {
  self.postMessage({ cmd: "print", msg: msg });
}
function workerCheckKeyDown(keyCode: number) {
  return (
    workerContext.keyDownBuffer && workerContext.keyDownBuffer[keyCode] > 0
  );
}
function workerInterrupted() {
  return workerContext.interruptBuffer && workerContext.interruptBuffer[0] > 2;
}

Object.assign(self as any, {
  workerPostMessage,
  workerPrint,
  workerCheckKeyDown,
  workerInterrupted,
});
