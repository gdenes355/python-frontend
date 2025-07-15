import {
  AdditionalFile,
  AdditionalFilesContents,
} from "../models/AdditionalFiles";
import BookNodeModel from "../models/BookNodeModel";
import DebugContext from "./DebugContext";
import { TestCases, TestResults } from "../models/Tests";
import Event, { AsyncEvent } from "../utils/Event";
import { keyToVMCode } from "../utils/keyTools";
import CodeRunnerState from "./CodeRunnerState";
import DebugSetup from "./DebugSetup";
import { SessionFile } from "../models/SessionFile";

interface ICodeRunner {
  // publis state
  state: CodeRunnerState;
  debugContext?: DebugContext;

  // events to subscribe to
  onStateChanged: Event<CodeRunnerState>;
  onDraw: Event<any[], Promise<void>>;
  onTurtleReset: Event<boolean>;
  onTurtle: AsyncEvent<{ id: number; msg: string }, string | undefined>;
  onTurtleClearup: Event<void>;
  onAudio: Event<string>;
  onPrint: Event<string>;
  onCls: Event<void>;
  onAwaitCanvas: AsyncEvent<void>;

  // lauch the code in debug mode
  debug: (
    code: string,
    mode: "debug" | "run",
    dbgSetup?: DebugSetup,
    additionalFiles?: AdditionalFile[] | undefined,
    additionalFilesLoaded?: AdditionalFilesContents,
    fixedUserInput?: string
  ) => Promise<DebugFinishedData>;

  // run test suite
  test: (
    code: string,
    tests: TestCases,
    additionalFiles: AdditionalFile[] | undefined,
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => Promise<TestFinishedData>;

  // draw the first turtle example.
  // Finished turtle drawing will be on the canvas that onTurtle draws to
  drawTurtleExample: (
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => Promise<string>;

  // send user input to the running code. Valid if state is AWAITING_INPUT
  input: (input: string, dbgSetup: DebugSetup) => void;

  // debug controls. Valid if state is ON_BREAKPOINT
  continue: (dbgSetup: DebugSetup) => void;
  step: (dbgSetup: DebugSetup) => void;
  refreshDebugContext: (dbgSetup: DebugSetup) => void; // ask the worker to re-report watches and vars

  // send keyboard events to the running code
  keyDown: (data: React.KeyboardEvent) => void;
  keyUp: (data: React.KeyboardEvent) => void;
}

type WorkerResponse = {
  cmd: string;
};

type TurtleData = {
  id: number;
  msg: string;
};

type Data2 = {
  msg: string;
};

type DebugFinishedData = {
  reason: string;
};

type TestFinishedData = {
  results: TestResults;
  bookNode: BookNodeModel;
  code: string;
};

type PromiseResRej<T> = {
  res: (value: T) => void;
  rej: (reason?: any) => void;
};

class PythonCodeRunner implements ICodeRunner {
  // from interface
  public state = CodeRunnerState.UNINITIALISED;
  public debugContext?: DebugContext = undefined;

  public onStateChanged = new Event<CodeRunnerState>();
  public onDraw = new Event<any[], Promise<void>>();
  public onTurtleReset = new Event<boolean>();
  public onTurtle = new AsyncEvent<
    { id: number; msg: string },
    string | undefined
  >();
  public onTurtleClearup = new Event<void>();
  public onAudio = new Event<string>();
  public onPrint = new Event<string>();
  public onCls = new Event<void>();
  public onAwaitCanvas = new AsyncEvent<void>();

  // local fields to interact with Pyodide
  private worker: Worker | null = null;
  private interruptBuffer: Uint8Array | null = null;
  private keyDownBuffer: Uint8Array | null = null;
  private workerFullyInitialised = false;
  private forceStopping = false;

  // testing session
  private testPromiseResRej: PromiseResRej<TestFinishedData> | null = null; // active test promise

  // debug session
  private debugPromiseResRej: PromiseResRej<DebugFinishedData> | null = null; // active debug promise
  private currentFixedUserInput: string[] | undefined = undefined;

  // turtle example session
  private turtleExamplePromiseResRej: PromiseResRej<string> | null = null; // active turtle example promise

  constructor() {
    this.state = CodeRunnerState.LOADING;
    this.restartWorker(true, "Initialising");
    this.onStateChanged.fire(this.state);
  }

  public debug = (
    code: string,
    mode: "debug" | "run",
    dbgSetup?: DebugSetup,
    additionalFiles?: AdditionalFile[] | undefined,
    additionalFilesLoaded?: AdditionalFilesContents,
    fixedUserInput?: string,
    sessionFiles: SessionFile[] = []
  ) => {
    if (this.debugPromiseResRej) {
      this.debugPromiseResRej.rej("Debug cancelled");
    }
    return new Promise<DebugFinishedData>((res, rej) => {
      this.debugPromiseResRej = { res, rej };
      this.runDebug(
        code,
        mode,
        dbgSetup,
        additionalFiles,
        additionalFilesLoaded,
        fixedUserInput,
        sessionFiles
      );
    });
  };

  public test = (
    code: string,
    tests: TestCases,
    additionalFiles: AdditionalFile[] | undefined,
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel,
    sessionFiles: SessionFile[] = []
  ) => {
    if (this.testPromiseResRej) {
      this.testPromiseResRej.rej("Test cancelled");
    }
    return new Promise<TestFinishedData>((res, rej) => {
      this.testPromiseResRej = { res, rej };
      this.runTest(
        code,
        tests,
        additionalFiles,
        additionalFilesLoaded,
        bookNode,
        sessionFiles
      );
    });
  };

  public drawTurtleExample = (
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => {
    if (this.turtleExamplePromiseResRej) {
      this.turtleExamplePromiseResRej.rej("Turtle drawing cancelled");
    }

    return new Promise<string>((res, rej) => {
      this.turtleExamplePromiseResRej = { res, rej };
      this.runTurtleExample(additionalFilesLoaded, bookNode);
    });
  };

  private additionalCodeForFiles = (
    additionalFiles?: AdditionalFile[] | undefined,
    additionalFilesLoaded?: AdditionalFilesContents,
    sessionFiles: SessionFile[] = []
  ) => {
    let code = additionalFilesLoaded
      ? additionalFiles
          ?.map((file) =>
            this.fileWriteTXT(
              file.filename,
              additionalFilesLoaded[file.filename]
            )
          )
          .join("\n")
      : "";
    if (sessionFiles.length > 0) {
      code += "import os\n";
      code += "os.makedirs('session', exist_ok=True)\n";
      code += sessionFiles
        .map((file) =>
          file.isText
            ? this.fileWriteTXT(`session/${file.filename}`, file.data as string)
            : this.fileWriteBin(
                `session/${file.filename}`,
                file.data as ArrayBuffer
              )
        )
        .join("\n");
    }
    return code;
  };

  private fileWriteTXT = (filename: string, content: string) => {
    return `with open("${filename}", "w") as f:f.write(r"""${content} """)\n`;
  };

  private fileWriteBin = (filename: string, content: ArrayBuffer) => {
    return `with open("${filename}", "wb") as f:f.write(bytearray([${content}]))\n`;
  };

  private runDebug = (
    code: string,
    mode: "debug" | "run",
    dbgSetup?: DebugSetup,
    additionalFiles?: AdditionalFile[] | undefined,
    additionalFilesLoaded?: AdditionalFilesContents,
    fixedUserInput?: string,
    sessionFiles: SessionFile[] = []
  ) => {
    if (!code || !this.worker || this.state !== CodeRunnerState.READY) {
      this.debugPromiseResRej?.rej("cannot run debug");
      console.log("debug", "not ready", code, this.worker, this.state);
      return;
    }
    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 0;
    }

    let additionalCode = this.additionalCodeForFiles(
      additionalFiles,
      additionalFilesLoaded,
      sessionFiles
    );

    navigator.serviceWorker.controller?.postMessage({ cmd: "ps-prerun" });
    this.currentFixedUserInput = fixedUserInput?.split("\n");
    this.debugContext = undefined;
    this.onTurtleReset.fire(false);
    this.worker?.postMessage({
      cmd: mode,
      code: code,
      initCode: additionalCode,
      breakpoints:
        dbgSetup?.breakpoints === undefined ? null : dbgSetup?.breakpoints,
      watches: dbgSetup?.watches === undefined ? null : dbgSetup?.watches,
    });
    this.state =
      mode === "debug"
        ? CodeRunnerState.RUNNING_WITH_DEBUGGER
        : CodeRunnerState.RUNNING;
    this.onStateChanged.fire(this.state);
    this.onCls.fire();
  };

  public kill = () => {
    if (this.forceStopping) return;
    this.forceStopping = true;
    setTimeout(() => {
      // hopefully, the worker will have stopped by 2s, but if not, we'll restart it properly
      if (this.forceStopping) {
        this.interruptBuffer = null; // clear interrupt buffer, it didn't work
        this.restartWorker(true, "Restart Python...");
        this.forceStopping = false;
        this.state = CodeRunnerState.READY;
        this.onStateChanged.fire(this.state);
      }
    }, 2000);
    this.restartWorker(true, "Interrupted");
  };

  public input = (input: string, dbgSetup?: DebugSetup) => {
    navigator.serviceWorker.controller?.postMessage({
      cmd: "ps-input-resp",
      data: input,
      breakpoints:
        dbgSetup?.breakpoints === undefined ? null : dbgSetup?.breakpoints,
      watches: dbgSetup?.watches,
    });
    this.onPrint.fire(input + "\n");
    this.state = CodeRunnerState.RUNNING;
    this.onStateChanged.fire(this.state);
  };

  public continue = (dbgSetup?: DebugSetup) => {
    if (this.state !== CodeRunnerState.ON_BREAKPOINT) return;
    navigator.serviceWorker.controller?.postMessage({
      cmd: "ps-debug-continue",
      breakpoints:
        dbgSetup?.breakpoints === undefined ? null : dbgSetup?.breakpoints,
      step: false,
      watches: dbgSetup?.watches,
    });
    this.state = CodeRunnerState.RUNNING_WITH_DEBUGGER;
    this.onStateChanged.fire(this.state);
  };

  public step = (dbgSetup?: DebugSetup) => {
    if (this.state !== CodeRunnerState.ON_BREAKPOINT) return;
    navigator.serviceWorker.controller?.postMessage({
      cmd: "ps-debug-continue",
      breakpoints:
        dbgSetup?.breakpoints === undefined ? null : dbgSetup?.breakpoints,
      step: true,
      watches: dbgSetup?.watches,
    });
    this.state = CodeRunnerState.RUNNING_WITH_DEBUGGER;
    this.onStateChanged.fire(this.state);
  };

  public refreshDebugContext = (dbgSetup: DebugSetup) => {
    if (this.state !== CodeRunnerState.ON_BREAKPOINT) return;
    navigator.serviceWorker.controller?.postMessage({
      cmd: "ps-debug-continue",
      breakpoints:
        dbgSetup?.breakpoints === undefined ? null : dbgSetup?.breakpoints,
      watches: dbgSetup?.watches,
      stay: true, // ask worker to stay on the same line
    });
    this.state = CodeRunnerState.RUNNING_WITH_DEBUGGER;
    this.onStateChanged.fire(this.state);
  };

  private actions = {
    "init-done": () => {
      this.workerFullyInitialised = true;
      this.forceStopping = false;
      this.state = CodeRunnerState.READY;
      this.onStateChanged.fire(this.state);
    },
    print: ({ msg }: Data2) => {
      if (this.state !== CodeRunnerState.READY) {
        this.onPrint.fire(msg);
      }
    },
    draw: ({ msg }: Data2) => {
      this.onDraw.fire(JSON.parse(msg) as any[]);
    },
    audio: ({ msg }: Data2) => {
      this.onAudio.fire(msg);
    },
    turtle: ({ id, msg }: TurtleData) => {
      this.onTurtle.fire({ id, msg }).then((turtleResult) => {
        navigator.serviceWorker.controller?.postMessage({
          cmd: "ps-turtle-resp",
          data: turtleResult,
        });
      });
    },
    "test-finished": ({ results, bookNode, code }: TestFinishedData) => {
      this.forceStopping = false;
      this.testPromiseResRej?.res({ results, bookNode, code });
      this.state = CodeRunnerState.READY;
      this.onStateChanged.fire(this.state);
    },
    "debug-finished": ({ reason }: DebugFinishedData) => {
      this.forceStopping = false;
      let msg = {
        ok: "Program finished ok. Press run/debug to run again...",
        error:
          "Interrupted by error. Check the error message, then press run/debug to execute again...",
        interrupt: "Interrupted...",
      }[reason];
      this.onPrint.fire(`\n${msg}\n`);
      this.state = CodeRunnerState.READY;
      this.onStateChanged.fire(this.state);
      this.debugPromiseResRej?.res({ reason });
    },
    input: () => {
      if (this.currentFixedUserInput) {
        const input = this.currentFixedUserInput.shift();
        this.input(input || "", {});
      } else {
        this.state = CodeRunnerState.AWAITING_INPUT;
        this.onStateChanged.fire(this.state);
      }
    },
    breakpt: (data: DebugContext) => {
      this.state = CodeRunnerState.ON_BREAKPOINT;
      this.debugContext = data;
      this.onStateChanged.fire(this.state);
    },
    "draw-turtle-example-finished": (data: { bookNode: BookNodeModel }) => {
      this.forceStopping = false;
      this.turtleExamplePromiseResRej?.res(data.bookNode.id);
      this.state = CodeRunnerState.READY;
      this.onStateChanged.fire(this.state);
    },
    cls: () => {
      this.onCls.fire();
    },
  };

  private runTest = (
    code: string,
    tests: TestCases,
    additionalFiles: AdditionalFile[] | undefined,
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel,
    sessionFiles: SessionFile[] = []
  ) => {
    if (
      !code ||
      !tests ||
      !this.worker ||
      this.state !== CodeRunnerState.READY
    ) {
      this.testPromiseResRej?.rej("cannot run tests");
      return;
    }
    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 0;
    }
    let additionalCode = this.additionalCodeForFiles(
      additionalFiles,
      additionalFilesLoaded,
      sessionFiles
    );
    const testsClone = structuredClone(tests);
    let hasTurtleTest = false;

    (testsClone || []).forEach((test) => {
      if (test.out instanceof Array) {
        test.out.forEach((out) => {
          if (out.filename) {
            out.filename = additionalFilesLoaded[out.filename];
          }
          if (out.typ === "t") {
            hasTurtleTest = true;
          }
        });
      }
    });

    if (hasTurtleTest) {
      // switch to virtual mode
      this.onAwaitCanvas.fire().then(() => {
        this.onTurtleReset.fire(true);
        this.worker?.postMessage({
          cmd: "test",
          code: code,
          initCode: additionalCode,
          tests: testsClone,
          bookNode: bookNode,
        });
      });
    } else {
      // use the original tests for non turtle tests to avoid changing filenames to contents
      this.worker.postMessage({
        cmd: "test",
        code: code,
        initCode: additionalCode,
        tests: tests,
        bookNode: bookNode,
      });
    }
    this.state = CodeRunnerState.RUNNING;
    this.onStateChanged.fire(this.state);
    this.onCls.fire();
  };

  private runTurtleExample = (
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => {
    const tests = bookNode.tests || [];
    if (!tests || !this.worker || this.state !== CodeRunnerState.READY) {
      this.turtleExamplePromiseResRej?.rej("cannot run turtle example");
      return;
    }
    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 0;
    }

    let code = "";
    let inputs: string | (number | string)[] = "";
    // find the first turtle test
    loop: for (let test of tests || []) {
      if (!(test.out instanceof Array)) {
        continue;
      }
      for (let out of test.out) {
        if (out.typ === "t" && out.filename) {
          code = additionalFilesLoaded[out.filename];
          if (!code) {
            this.turtleExamplePromiseResRej?.rej("cannot run turtle example");
            return; // file not yet loaded!
          }
          inputs = test.in instanceof Array ? test.in : [test.in];
          break loop;
        }
      }
    }

    if (!code) {
      this.turtleExamplePromiseResRej?.rej("cannot run turtle example");
      return; // no turtle test found
    }

    this.onAwaitCanvas.fire().then(() => {
      this.onTurtleReset.fire(true);
      this.worker?.postMessage({
        cmd: "draw-turtle-example",
        code: code,
        inputs: inputs,
        bookNode: bookNode,
      });
    });
    this.state = CodeRunnerState.RUNNING;
    this.onStateChanged.fire(this.state);
  };

  private restartWorker = (_?: boolean, msg?: string) => {
    this.onTurtle.fire({ id: -1, msg: '{"action": "stop"}' });
    if (this.state === CodeRunnerState.RESTARTING_WORKER) {
      return; // already restarting
    }
    if (this.worker && this.interruptBuffer && this.workerFullyInitialised) {
      this.interruptBuffer[0] = 2;
      navigator.serviceWorker.controller?.postMessage({ cmd: "ps-reset" });
      return; // we can just issue an interrupt, no need to kill worker
    }
    this.worker?.terminate();
    this.forceStopping = false;
    this.worker = new Worker("/static/js/pyworker_sw.js");
    this.worker.addEventListener(
      "message",
      (msg: MessageEvent<WorkerResponse>) => {
        try {
          // @ts-ignore  dynamic dispatch from worker
          this.actions[msg.data.cmd](msg.data);
        } catch (e) {
          console.error(
            `Error in code runner worker response for msg cmd "${msg.data.cmd}"`,
            e
          );
        }
      }
    );
    let newInterruptBuffer: Uint8Array | null = null;
    let newKeyDownBuffer: Uint8Array | null = null;
    if (window.crossOriginIsolated && window.SharedArrayBuffer) {
      console.log("Cross origin isolated with shared array buffer");
      newInterruptBuffer = new Uint8Array(new window.SharedArrayBuffer(1));
      newInterruptBuffer[0] = 0;
      newKeyDownBuffer = new Uint8Array(new window.SharedArrayBuffer(256));
      this.worker.postMessage({
        cmd: "setSharedBuffers",
        interruptBuffer: newInterruptBuffer,
        keyDownBuffer: newKeyDownBuffer,
      });
    } else {
      console.log(
        "Not cross origin isolated, so interrupt will be slow and keydowns will be ignored"
      );
    }
    msg = msg || "";
    this.interruptBuffer = newInterruptBuffer;
    this.keyDownBuffer = newKeyDownBuffer;
    this.state = CodeRunnerState.RESTARTING_WORKER;
    this.onStateChanged.fire(this.state);
    navigator.serviceWorker.controller?.postMessage({ cmd: "ps-reset" });
    this.onPrint.fire(msg);
  };

  public keyDown = (data: React.KeyboardEvent) => {
    if (this.keyDownBuffer) {
      let code = keyToVMCode(data.key);
      if (code && code > 0 && code < 256) {
        this.keyDownBuffer[code] = 1;
      }
    }
  };

  public keyUp = (data: React.KeyboardEvent) => {
    if (this.keyDownBuffer) {
      let code = keyToVMCode(data.key);
      if (code && code > 0 && code < 256) {
        this.keyDownBuffer[code] = 0;
      }
    }
  };
}

export {
  PythonCodeRunner,
  CodeRunnerState,
  DebugFinishedData,
  TestFinishedData,
};
