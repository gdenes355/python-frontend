import React, { createContext } from "react";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases, TestResults } from "../models/Tests";
import DebugContext from "../models/DebugContext";
import ChallengeTypes from "../models/ChallengeTypes";
import { keyToVMCode } from "../utils/keyTools";
import IChallenge, { IChallengeState } from "./IChallenge";
import BookNodeModel from "../models/BookNodeModel";
import EditableBookStore from "../book/utils/EditableBookStore";

import { absolutisePath } from "../utils/pathTools";

type WorkerResponse = {
  cmd: string;
};

type PrintData = {
  msg: string;
};

type DrawData = {
  msg: string;
};

type TurtleData = {
  id: number;
  msg: string;
};

type AudioData = {
  msg: string;
};

type InputData = {
  input: string | null;
};

type DebugFinishedData = {
  reason: number;
};

type TestFinishedData = {
  results: TestResults;
  bookNode: BookNodeModel;
  code: string;
};

type RestartWorkerData = {
  force?: boolean | null;
  msg?: string | null;
};

type SaveCodeData = {
  code: string | null;
};

class ChallengeContextClass {
  constructor(challenge: IChallenge) {
    this.challenge = challenge;
  }

  private challenge: IChallenge;
  private fileReader: FileReader | null = null;

  public actions = {
    "init-done": () => {
      this.challenge.workerFullyInitialised = true;
      this.challenge.forceStopping = false;
      this.challenge.setState({ editorState: ChallengeStatus.READY });
    },
    print: (data: PrintData) => {
      if (this.challenge.state.editorState !== ChallengeStatus.READY) {
        this.actions["print-console"](data.msg);
      }
    },
    "print-console": (text: string) => {
      this.challenge.currentConsoleText += text;
      this.challenge.printCallback();
    },
    draw: (data: DrawData) => {
      const commands = JSON.parse(data.msg) as any[];
      if (this.challenge.state.editorState !== ChallengeStatus.READY) {
        if (this.challenge.state.typ === ChallengeTypes.TYP_PY) {
          if (commands.length === 1 && commands[0]?.action === "reset") {
            //ignore single initial reset if we are meant to be a standard
            // Python challenge
            return;
          }
          this.challenge.setState({ typ: ChallengeTypes.TYP_CANVAS });
        }
        this.challenge.outputsRef?.current?.focusPane("canvas");
        this.challenge.canvasDisplayRef?.current?.runCommand(commands);
      }
    },
    audio: (data: AudioData) => {
      if (this.challenge.state.editorState !== ChallengeStatus.READY) {
        if (this.challenge.state.typ === ChallengeTypes.TYP_PY) {
          this.challenge.setState({ typ: ChallengeTypes.TYP_CANVAS });
        }
        this.challenge.canvasDisplayRef?.current?.runAudioCommand(data.msg);
      }
    },
    awaitCanvas: () => {
      return new Promise((resolve) => {
        if (this.challenge.state.typ === ChallengeTypes.TYP_PY) {
          this.challenge.setState({ typ: ChallengeTypes.TYP_CANVAS });
        }
        if (this.challenge.canvasDisplayRef.current) {
          resolve(true);
        } else {
          if (this.challenge.canvasPromiseResolve !== undefined) {
            console.log("awaitCanvas called twice");
          }
          this.challenge.canvasPromiseResolve = resolve;
        }
      });
    },
    turtle: (data: TurtleData) => {
      this.challenge.outputsRef?.current?.focusPane("canvas");
      if (this.challenge.state.editorState !== ChallengeStatus.READY) {
        this.actions.awaitCanvas().then((result) => {
          this.challenge.canvasDisplayRef?.current
            ?.runTurtleCommand(data.id, data.msg)
            .then((turtleResult) =>
              this.actions.turtleCmdComplete(turtleResult || undefined)
            )
            .catch((e) => console.log("turtle stopped with", e));
        });
      }
    },
    turtleCmdComplete: (turtleResult?: string) => {
      if (this.challenge.state.editorState !== ChallengeStatus.READY) {
        navigator.serviceWorker.controller?.postMessage({
          cmd: "ps-turtle-resp",
          data: turtleResult,
        });
      }
    },
    "hide-turtle": () => {
      this.challenge.setState({ typ: ChallengeTypes.TYP_PY });
    },
    "draw-turtle-example": () => {
      // draws the first turtle test case
      if (!!this.challenge.state.turtleExampleRendered) {
        return;
      }
      if (!this.challenge.worker) {
        return;
      }
      if (this.challenge.state.editorState === ChallengeStatus.READY) {
        if (this.challenge.interruptBuffer) {
          this.challenge.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
        }
      } else {
        return;
      }

      let code = "";
      let inputs: string | (number | string)[] = "";

      // find first testcase
      loop: for (let test of this.challenge.props.tests || []) {
        if (!(test.out instanceof Array)) {
          continue;
        }
        for (let out of test.out) {
          if (out.typ === "t" && out.filename) {
            code = this.challenge.state.additionalFilesLoaded[out.filename];
            if (!code) return; // file not yet loaded!
            inputs = test.in instanceof Array ? test.in : [test.in];
            break loop;
          }
        }
      }
      if (code) {
        this.actions.awaitCanvas().then(() => {
          this.challenge.canvasDisplayRef.current?.turtleReset(true);
          this.challenge.worker?.postMessage({
            cmd: "draw-turtle-example",
            code: code,
            inputs: inputs,
            bookNode: this.challenge.props.bookNode,
          });
          this.challenge.setState({ editorState: ChallengeStatus.RUNNING });
        });
      }
    },

    cls: () => {
      this.challenge.currentConsoleText = "";
      this.challenge.printCallback();
    },
    input: () => {
      if (this.challenge.state.usesFixedInput) {
        const input = this.challenge.currentFixedUserInput.shift() || "";
        const inputData: InputData = { input: input };
        this.actions["input-entered"](inputData);
      } else {
        this.challenge.setState({
          editorState: ChallengeStatus.AWAITING_INPUT,
        });
        this.challenge.outputsRef?.current?.focusPane("console");
      }
    },
    "input-entered": (data: InputData) => {
      let input = data?.input == null ? "" : data.input;
      navigator.serviceWorker.controller?.postMessage({
        cmd: "ps-input-resp",
        data: input,
        breakpoints:
          this.challenge.breakpointsChanged && this.challenge.editorRef.current
            ? this.challenge.editorRef.current.getBreakpoints()
            : null,
      });
      this.actions["print-console"](data.input + "\n");
      this.challenge.setState({
        editorState: ChallengeStatus.RUNNING,
      });
    },
    continue: (step: boolean = false) => {
      navigator.serviceWorker.controller?.postMessage({
        cmd: "ps-debug-continue",
        breakpoints:
          this.challenge.breakpointsChanged && this.challenge.editorRef.current
            ? this.challenge.editorRef.current.getBreakpoints()
            : null,
        step: step,
      });
      this.challenge.setState({
        editorState: ChallengeStatus.RUNNING_WITH_DEBUGGER,
      });
    },
    step: () => this.actions["continue"](true),
    "debug-finished": (data: DebugFinishedData) => {
      this.challenge.forceStopping = false;
      let msg = {
        ok: "Program finished ok. Press run/debug to run again...",
        error:
          "Interrupted by error. Check the error message, then press run/debug to execute again...",
        interrupt: "Interrupted...",
      }[data.reason];
      this.challenge.setState((state: IChallengeState) => {
        return {
          editorState: ChallengeStatus.READY,
          testResults: this.challenge.props.isExample
            ? [{ outcome: true }]
            : state.testResults,
        };
      });
      this.actions["print-console"]("\n" + msg + "\n");
      this.challenge.canvasDisplayRef?.current?.runTurtleClearup();
    },
    kill: () => {
      if (this.challenge.forceStopping) return;

      this.challenge.forceStopping = true;
      setTimeout(() => {
        if (this.challenge.forceStopping) {
          // clear interrupt buffer, as it clearly didn't work
          this.challenge.interruptBuffer = null;
          this.actions["restart-worker"]({
            msg: "Restart Python...",
            force: true,
          });
        }
      }, 2000);
      this.actions["restart-worker"]({
        msg: "Interrupted...",
        force: true,
      });
    },
    "test-finished": (data: TestFinishedData) => {
      this.challenge.forceStopping = false;
      this.actions["report-result"](data.results, data.code, data.bookNode);
      this.challenge.setState({
        testResults: data.results,
        editorState: ChallengeStatus.READY,
      });
    },
    "draw-turtle-example-finished": (data: { bookNode: BookNodeModel }) => {
      this.challenge.forceStopping = false;
      this.challenge.setState({
        editorState: ChallengeStatus.READY,
      });
      this.challenge.outputsRef?.current?.focusPane("console");
      if (this.challenge.props.bookNode.id !== data.bookNode.id) return; // ignore if we have moved on

      this.challenge.canvasDisplayRef?.current
        ?.runTurtleCommand(-1, '{"action": "dump"}')
        .then((turtleResult) => {
          this.challenge.setState({
            turtleExampleRendered: turtleResult || undefined,
          });
        });
    },
    "restart-worker": (data: RestartWorkerData) => {
      this.challenge.canvasDisplayRef?.current?.runTurtleCommand(
        -1,
        '{"action": "stop"}'
      );
      if (
        this.challenge.state.editorState === ChallengeStatus.RESTARTING_WORKER
      ) {
        return; // already resetting
      }
      if (
        this.challenge.state.editorState === ChallengeStatus.READY &&
        !data?.force
      ) {
        return; // in ready state already
      }
      if (
        this.challenge.worker &&
        this.challenge.interruptBuffer &&
        this.challenge.workerFullyInitialised
      ) {
        this.challenge.interruptBuffer[0] = 2;
        navigator.serviceWorker.controller?.postMessage({ cmd: "ps-reset" });
        return; // we can just issue an interrupt, no need to kill worker
      }
      this.challenge.worker?.terminate();
      this.challenge.forceStopping = false;
      let worker = new Worker("/static/js/pyworker_sw.js");
      worker.addEventListener("message", (msg: MessageEvent<WorkerResponse>) =>
        // @ts-ignore  dybamic dispatch from worker
        this.actions[msg.data.cmd](msg.data)
      );
      let interruptBuffer: Uint8Array | null = null;
      let keyDownBuffer: Uint8Array | null = null;
      if (window.crossOriginIsolated && window.SharedArrayBuffer) {
        interruptBuffer = new Uint8Array(new window.SharedArrayBuffer(1));
        interruptBuffer[0] = 0;
        keyDownBuffer = new Uint8Array(new window.SharedArrayBuffer(256));
        worker.postMessage({
          cmd: "setSharedBuffers",
          interruptBuffer,
          keyDownBuffer,
        });
      }
      let msg = data.msg == null ? "" : data.msg;
      this.challenge.worker = worker;
      this.challenge.interruptBuffer = interruptBuffer;
      this.challenge.keyDownBuffer = keyDownBuffer;
      this.challenge.setState({
        editorState: ChallengeStatus.RESTARTING_WORKER,
      });
      navigator.serviceWorker.controller?.postMessage({ cmd: "ps-reset" });
      this.actions["print-console"](msg);
    },
    "get-code": () => {
      if (this.challenge.state.typ === ChallengeTypes.TYP_PARSONS) {
        return this.challenge.parsonsEditorRef.current?.getValue();
      } else {
        return this.challenge.editorRef.current?.getValue();
      }
    },
    debug: (mode: "debug" | "run" = "debug") => {
      if (this.challenge.state.typ === ChallengeTypes.TYP_PARSONS) {
        let code = this.challenge.parsonsEditorRef.current?.getValue();
        if (code) {
          this.actions["debugpy"](code, [], mode);
        }
      } else {
        let code = this.challenge.editorRef.current?.getValue();
        let bkpts = this.challenge.editorRef.current?.getBreakpoints() || [];
        this.challenge.canvasDisplayRef?.current?.turtleReset();
        if (code || code === "") {
          this.actions["debugpy"](code, bkpts, mode);
        }
      }
    },
    debugpy: (
      code: string,
      breakpoints: number[],
      mode: "debug" | "run" = "debug"
    ) => {
      let additionalCode = "";

      this.challenge.props.bookNode.additionalFiles?.forEach((file) => {
        const escContents = this.challenge.state.additionalFilesLoaded[
          file.filename
        ].replace(/"/g, '\\"');
        additionalCode += `with open("${file.filename}", "w") as f:f.write("""${escContents}""")\n`;
      });

      navigator.serviceWorker.controller?.postMessage({ cmd: "ps-prerun" });
      this.challenge.currentFixedUserInput =
        this.challenge.fixedInputFieldRef.current?.getValue().split("\n") || [
          "",
        ];

      if (this.challenge.state.editorState === ChallengeStatus.READY) {
        if (this.challenge.interruptBuffer) {
          this.challenge.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
        }
        this.challenge.worker?.postMessage({
          cmd: mode,
          code: code,
          initCode: additionalCode,
          breakpoints: breakpoints,
        });
        this.challenge.setState({
          editorState:
            mode === "debug"
              ? ChallengeStatus.RUNNING_WITH_DEBUGGER
              : ChallengeStatus.RUNNING,
        });
        this.challenge.breakpointsChanged = false;
        this.actions["cls"]();
      }
      this.actions["save-code"]({ code });
    },
    test: () => {
      if (this.challenge.state.typ === "parsons") {
        let newResults =
          this.challenge.parsonsEditorRef.current?.runTests() || [];
        let code = this.challenge.parsonsEditorRef.current?.getValue() || "";
        let bookNode = this.challenge.props.bookNode;
        this.challenge.setState({
          testResults: newResults,
        });
        this.actions["report-result"](newResults, code, bookNode);
      } else {
        let code = this.challenge.editorRef.current?.getValue();
        let tests = this.challenge.props.tests;
        if (code && tests) {
          this.actions["testpy"](code, tests);
        }
      }
    },
    "report-result": (
      results: TestResults,
      code: string,
      bookNode: BookNodeModel
    ) => {
      let newTestOutcome =
        results.length === 0
          ? undefined
          : results.filter((x) => x.outcome !== true).length === 0;
      if (this.challenge.props.progressStorage) {
        this.challenge.props.progressStorage.setResult(
          bookNode,
          newTestOutcome,
          code
        );
      }
    },
    testpy: (code: string, tests: TestCases) => {
      if (!this.challenge.worker) {
        return;
      }
      if (this.challenge.state.editorState === ChallengeStatus.READY) {
        if (this.challenge.interruptBuffer) {
          this.challenge.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
        }

        let additionalCode = "";

        this.challenge.props.bookNode.additionalFiles?.forEach((file) => {
          const escContents = this.challenge.state.additionalFilesLoaded[
            file.filename
          ].replace(/"/g, '\\"');
          additionalCode += `with open("${file.filename}", "w") as f:f.write("""${escContents}""")\n`;
        });

        const testsClone = structuredClone(tests);
        let hasTurtleTest = false;

        (testsClone || []).forEach((test) => {
          if (test.out instanceof Array) {
            test.out.forEach((out) => {
              if (out.filename) {
                out.filename =
                  this.challenge.state.additionalFilesLoaded[out.filename];
              }
              if (out.typ === "t") {
                hasTurtleTest = true;
              }
            });
          }
        });

        if (hasTurtleTest) {
          // switch to virtual mode
          this.actions.awaitCanvas().then(() => {
            this.challenge.canvasDisplayRef.current?.turtleReset(true);
            this.challenge.worker?.postMessage({
              cmd: "test",
              code: code,
              initCode: additionalCode,
              tests: testsClone,
              bookNode: this.challenge.props.bookNode,
            });
          });
        } else {
          // use the original tests for non turtle tests to avoid changing filenames to contents
          this.challenge.worker.postMessage({
            cmd: "test",
            code: code,
            initCode: additionalCode,
            tests: tests,
            bookNode: this.challenge.props.bookNode,
          });
        }

        this.challenge.setState({ editorState: ChallengeStatus.RUNNING });
        this.actions["cls"]();
      }
      this.actions["save-code"]({ code });
    },
    preview: () => {},
    "breakpoints-updated": () => {
      if (
        this.challenge.editorRef.current &&
        this.challenge.state.editorState !== ChallengeStatus.READY
      ) {
        this.challenge.breakpointsChanged = true;
      }
      // otherwise no need to set the lazy flag, breakpoints will be queried when debugging
    },
    "reset-code": () => {
      if (this.challenge.state.typ === "parsons") {
        this.challenge.parsonsEditorRef.current?.reset();
        return;
      }
      if (
        (this.challenge.state.starterCode === "" ||
          this.challenge.state.starterCode) &&
        this.challenge.editorRef.current
      ) {
        this.challenge.editorRef.current.setValue(
          this.challenge.state.starterCode
        );
      }
    },
    "reset-json": () => {},
    /*this.challenge.jsonEditorRef.current?.setValue(
        this.challenge.JSON_DEFAULT
      ),*/
    breakpt: (data: DebugContext) => {
      this.challenge.setState({
        debugContext: {
          lineno: data.lineno,
          env: new Map([...data.env.entries()].sort()),
        },
        editorState: ChallengeStatus.ON_BREAKPOINT,
      });
      this.challenge.editorRef.current?.revealLine(data.lineno);
    },
    "save-code": (data: SaveCodeData) => {
      if ((data.code || data.code === "") && this.challenge.props.uid) {
        localStorage.setItem(
          "code-" + encodeURIComponent(this.challenge.props.uid),
          data.code
        );
      }
    },
    "save-json": (data: SaveCodeData) => {
      if ((data.code || data.code === "") && this.challenge.props.uid) {
        localStorage.setItem(
          "json-" + encodeURIComponent(this.challenge.props.uid),
          data.code
        );
      }
    },
    "canvas-keydown": (data: React.KeyboardEvent) => {
      if (this.challenge.keyDownBuffer) {
        let code = keyToVMCode(data.key);
        if (code && code > 0 && code < 256) {
          this.challenge.keyDownBuffer[code] = 1;
        }
      }
    },
    "canvas-keyup": (data: React.KeyboardEvent) => {
      if (this.challenge.keyDownBuffer) {
        let code = keyToVMCode(data.key);
        if (code && code > 0 && code < 256) {
          this.challenge.keyDownBuffer[code] = 0;
        }
      }
    },
    "fetch-guide": () => {
      this.challenge.setState({ turtleExampleRendered: undefined });
      this.challenge.props.fetcher
        .fetch(this.challenge.props.guidePath, this.challenge.props.authContext)
        .then((response) => {
          if (!response.ok) {
            throw Error("Failed to load guide");
          }
          return response.text();
        })
        .then((text) => this.challenge.setState({ guideMd: text }));
    },
    "fetch-code": (overrideWorkingCopy: boolean = false) => {
      this.challenge.props.fetcher
        .fetch(this.challenge.props.codePath, this.challenge.props.authContext)
        .then((response) => {
          if (!response.ok) {
            throw Error("Failed to load Python code");
          }
          return response.text();
        })
        .then((text) => {
          this.challenge.setState({ starterCode: text });
          if (overrideWorkingCopy) {
            this.actions["reset-code"]();
          }
        });
    },
    "fetch-file": (
      filename: string,
      store: EditableBookStore | null = null
    ) => {
      filename = absolutisePath(
        filename,
        this.challenge.props.fetcher.getBookPathAbsolute()
      );
      return new Promise<string>((resolve, reject) => {
        this.challenge.props.fetcher
          .fetch(filename, this.challenge.props.authContext)
          .then((response) => {
            if (!response.ok) {
              // try to make the file
              let newContents = "add new file contents here\n";
              if (store) {
                store.store.save(newContents, `edit://edit/${filename}`);
              } else {
                throw Error("file not available");
              }
              return newContents;
            }
            return response.text();
          })
          .then((text) => {
            resolve(text);
          })
          .catch((e) => {
            resolve("ERROR LOADING FILE");
          });
      });
    },
    "activate-file": (filename: string, contents: string) => {
      const escContents = contents.replace(/"/g, '\\"');
      let code = `with open("${filename}", "w") as f:f.write(r"""${escContents}""")`;
      this.challenge.worker?.postMessage({
        cmd: "run",
        code: code,
        breakpoints: [],
      });
    },
    "load-saved-code": () => {
      let savedCode = localStorage.getItem(
        "code-" + encodeURIComponent(this.challenge.props.uid)
      );
      if (this.challenge.props.typ !== "parsons" && savedCode) {
        if (savedCode) {
          this.challenge.setState({ savedCode: savedCode });
        } else {
          this.challenge.setState({ savedCode: null });
        }
      } else {
        this.challenge.setState({ savedCode: null });
      }
    },
    "handle-file-read": (e: ProgressEvent<FileReader>) => {
      if (this.fileReader?.result) {
        this.challenge.editorRef.current?.setValue(
          this.fileReader.result.toString()
        );
        this.fileReader = null;
      }
    },
    "handle-code-upload": (file: File) => {
      this.fileReader = new FileReader();
      this.fileReader.onloadend = this.actions["handle-file-read"];
      this.fileReader.readAsText(file);
    },
    "download-code": () => {
      this.challenge?.editorRef.current?.download();
    },
  };
}

const ChallengeContext = createContext<ChallengeContextClass | null>(null);

export default ChallengeContext;
export { ChallengeContextClass };
