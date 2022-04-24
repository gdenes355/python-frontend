import React, { createContext } from "react";
import Challenge from "./Challenge";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases, TestResults } from "../models/Tests";
import DebugContext from "../models/DebugContext";
import ChallengeTypes from "../models/ChallengeTypes";
import { keyToVMCode } from "../utils/keyTools";
import PaneType from "../models/PaneType";
import IChallenge, { IChallengeState } from "./IChallenge";

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
    "init-done": () =>
      this.challenge.setState({ editorState: ChallengeStatus.READY }),
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
      if (this.challenge.state.editorState !== ChallengeStatus.READY) {
        if (this.challenge.state.typ !== ChallengeTypes.TYP_CANVAS) {
          this.challenge.setState({ typ: ChallengeTypes.TYP_CANVAS });
        }
        this.challenge.outputsRef?.current?.focusPane(PaneType.CANVAS);
        this.challenge.canvasDisplayRef?.current?.runCommand(data.msg);
      }
    },
    turtle: (data: TurtleData) => {
      if (this.challenge.state.editorState !== ChallengeStatus.READY) {
        if (this.challenge.state.typ !== ChallengeTypes.TYP_CANVAS) {
          this.challenge.setState({ typ: ChallengeTypes.TYP_CANVAS });
        }
        this.challenge.outputsRef?.current?.focusPane(PaneType.CANVAS);
        this.challenge.canvasDisplayRef?.current?.runTurtleCommand(data.msg);
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
        this.challenge.outputsRef?.current?.focusPane(PaneType.CONSOLE);
      }
    },
    "input-entered": (data: InputData) => {
      let x = new XMLHttpRequest();
      x.open("post", "/@input@/resp.js");
      x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      x.setRequestHeader("cache-control", "no-cache, no-store, max-age=0");
      let input = data?.input == null ? "" : data.input;
      try {
        x.send(
          JSON.stringify({
            data: input,
            breakpoints:
              this.challenge.breakpointsChanged &&
              this.challenge.editorRef.current
                ? this.challenge.editorRef.current.getBreakpoints()
                : null,
          })
        );
      } catch (e) {
        console.log(e);
      }
      this.actions["print-console"](data.input + "\n");

      this.challenge.setState({
        editorState: ChallengeStatus.RUNNING,
      });
    },
    continue: (step: boolean = false) => {
      let x = new XMLHttpRequest();
      x.open("post", "/@debug@/continue.js");
      x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      x.setRequestHeader("cache-control", "no-cache, no-store, max-age=0");
      try {
        x.send(
          JSON.stringify({
            breakpoints:
              this.challenge.breakpointsChanged &&
              this.challenge.editorRef.current
                ? this.challenge.editorRef.current.getBreakpoints()
                : null,
            step: step,
          })
        );
      } catch (e) {
        console.log(e);
      }
      this.challenge.setState({ editorState: ChallengeStatus.RUNNING });
    },
    step: () => this.actions["continue"](true),
    "debug-finished": (data: DebugFinishedData) => {
      let msg = {
        ok: "Program finished ok. Press debug to run again...",
        error:
          "Interrupted by error. Check the error message, then press debug to run again...",
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
    },
    kill: () =>
      this.actions["restart-worker"]({
        msg: "Interrupted...",
        force: true,
      }),
    "test-finished": (data: TestFinishedData) => {
      this.challenge.setState({
        testResults: data.results,
        editorState: ChallengeStatus.READY,
      });
    },
    "restart-worker": (data: RestartWorkerData) => {
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
      if (this.challenge.worker && this.challenge.interruptBuffer) {
        this.challenge.interruptBuffer[0] = 2;
        let x = new XMLHttpRequest();
        x.open("post", "/@reset@/reset.js");
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader("cache-control", "no-cache, no-store, max-age=0");
        try {
          x.send("");
        } catch (e) {
          console.log(e);
        }
        return; // we can just issue an interrupt, no need to kill worker
      }
      this.challenge.worker?.terminate();
      let worker = new Worker("/static/js/pyworker_sw.js");
      worker.addEventListener("message", (msg: MessageEvent<WorkerResponse>) =>
        // @ts-ignore  dybamic dispatch from worker
        this.actions[msg.data.cmd](msg.data)
      );
      let interruptBuffer: Uint8Array | null = null;
      let keyDownBuffer: Uint8Array | null = null;
      if (window.crossOriginIsolated && window.SharedArrayBuffer) {
        interruptBuffer = new Uint8Array(new window.SharedArrayBuffer(1));
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
      this.actions["print-console"](msg);
    },
    debug: () => {
      if (this.challenge.state.typ === ChallengeTypes.TYP_PARSONS) {
        let code = this.challenge.parsonsEditorRef.current?.getValue();
        if (code) {
          this.actions["debugpy"](code, []);
        }
      } else {
        let code = this.challenge.editorRef.current?.getValue();
        let bkpts = this.challenge.editorRef.current?.getBreakpoints() || [];
        if (code || code === "") {
          this.actions["debugpy"](code, bkpts);
        }
      }
    },
    debugpy: (code: string, breakpoints: number[]) => {
      this.challenge.currentFixedUserInput =
        this.challenge.fixedInputFieldRef.current?.getValue().split("\n") || [
          "",
        ];
      this.challenge.outputsRef?.current?.focusPane(PaneType.CONSOLE);

      if (this.challenge.state.editorState === ChallengeStatus.READY) {
        if (this.challenge.interruptBuffer) {
          this.challenge.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
        }
        this.challenge.worker?.postMessage({
          cmd: "debug",
          code: code,
          breakpoints: breakpoints,
        });
        this.challenge.setState({
          editorState: ChallengeStatus.RUNNING,
        });
        this.challenge.breakpointsChanged = false;
        this.actions["cls"]();
      }
      this.actions["save-code"]({ code });
    },
    test: () => {
      if (this.challenge.state.typ === "parsons") {
        this.challenge.setState({
          testResults:
            this.challenge.parsonsEditorRef.current?.runTests() || [],
        });
      } else {
        let code = this.challenge.editorRef.current?.getValue();
        let tests = this.challenge.props.tests;
        if (code && tests) {
          this.actions["testpy"](code, tests);
        }
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
        this.challenge.worker.postMessage({
          cmd: "test",
          code: code,
          tests: tests,
        });
        this.challenge.setState({ editorState: ChallengeStatus.RUNNING });
        this.actions["cls"]();
      }
      this.actions["save-code"]({ code });
    },
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
      this.challenge.props.fetcher
        .fetch(this.challenge.props.guidePath)
        .then((response) => {
          if (!response.ok) {
            throw Error("Failed to load guide");
          }
          return response.text();
        })
        .then((text) => this.challenge.setState({ guideMd: text }));
    },
    "fetch-code": () => {
      this.challenge.props.fetcher
        .fetch(this.challenge.props.codePath)
        .then((response) => {
          if (!response.ok) {
            throw Error("Failed to load Python code");
          }
          return response.text();
        })
        .then((text) => this.challenge.setState({ starterCode: text }));
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
