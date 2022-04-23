import Challenge, { ChallengeState } from "./Challenge";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases, TestResults } from "../models/Tests";
import DebugContext from "../models/DebugContext";
import ChallengeTypes from "../models/ChallengeTypes";
import React from "react";
import { keyToVMCode } from "../utils/keyTools";

type WorkerResponse = {
  cmd: string;
};

type TestData = {
  code?: string;
  tests?: TestCases | null;
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

type ContinueData = {
  step?: boolean | null;
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

type DebugData = {
  code?: string | null;
  breakpoints?: number[];
};

type SaveCodeData = {
  code: string | null;
};

const ChallengeController = {
  "init-done": (comp: Challenge) =>
    comp.setState({ editorState: ChallengeStatus.READY }),
  print: (comp: Challenge, data: PrintData) => {
    if (comp.state.editorState !== ChallengeStatus.READY) {
      comp.print(data.msg);
    }
  },
  draw: (comp: Challenge, data: DrawData) => {
    if (comp.state.editorState !== ChallengeStatus.READY) {
      if (comp.state.typInferred !== ChallengeTypes.TYP_CANVAS) {
        comp.setState({ typInferred: ChallengeTypes.TYP_CANVAS });
      }
      const paneRequest = comp.state.isFixedInput ? 2 : 1;
      comp.tabbedViewRef?.current?.requestPane(paneRequest);
      comp.canvasDisplayRef?.current?.runCommand(data.msg);
    }
  },
  turtle: (comp: Challenge, data: TurtleData) => {
    if (comp.state.editorState !== ChallengeStatus.READY) {
      if (comp.state.typInferred !== ChallengeTypes.TYP_CANVAS) {
        comp.setState({ typInferred: ChallengeTypes.TYP_CANVAS });
      }
      const paneRequest = comp.state.isFixedInput ? 2 : 1;
      comp.tabbedViewRef?.current?.requestPane(paneRequest);
      comp.canvasDisplayRef?.current?.runTurtleCommand(data.msg);
    }
  },
  cls: (comp: Challenge) => comp.cls(),
  input: (comp: Challenge) => {
    if (comp.state.isFixedInput) {
      const input = comp.currentFixedUserInput.shift() || "";
      const inputData: InputData = { input: input };
      ChallengeController["input-entered"](comp, inputData);
    } else {
      comp.setState({ editorState: ChallengeStatus.AWAITING_INPUT });
      comp.tabbedViewRef?.current?.requestPane(0);
    }
  },
  "input-entered": (comp: Challenge, data: InputData) => {
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
            comp.state.breakpointsChanged && comp.editorRef.current
              ? comp.editorRef.current.getBreakpoints()
              : null,
        })
      );
    } catch (e) {
      console.log(e);
    }
    comp.print(data.input + "\n");

    comp.setState({
      editorState: ChallengeStatus.RUNNING,
    });
  },
  continue: (comp: Challenge, data: ContinueData) => {
    let x = new XMLHttpRequest();
    x.open("post", "/@debug@/continue.js");
    x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    x.setRequestHeader("cache-control", "no-cache, no-store, max-age=0");
    try {
      x.send(
        JSON.stringify({
          breakpoints:
            comp.state.breakpointsChanged && comp.editorRef.current
              ? comp.editorRef.current.getBreakpoints()
              : null,
          step: data?.step ? data.step : false,
        })
      );
    } catch (e) {
      console.log(e);
    }
    comp.setState({ editorState: ChallengeStatus.RUNNING });
  },
  step: (comp: Challenge) => {
    ChallengeController["continue"](comp, { step: true });
  },
  "debug-finished": (comp: Challenge, data: DebugFinishedData) => {
    let msg = {
      ok: "Program finished ok. Press run/debug to execute again...",
      error:
        "Interrupted by error. Check the error message, then press run/debug to execute again...",
      interrupt: "Interrupted...",
    }[data.reason];
    comp.setState((state: ChallengeState) => {
      return {
        editorState: ChallengeStatus.READY,
        testResults: comp.props.isExample
          ? [{ outcome: true }]
          : state.testResults,
      };
    });
    comp.print("\n" + msg + "\n");
  },
  "test-finished": (comp: Challenge, data: TestFinishedData) => {
    comp.setState({
      testResults: data.results,
      editorState: ChallengeStatus.READY,
    });
  },
  "restart-worker": (comp: Challenge, data: RestartWorkerData) => {
    if (comp.state.editorState === ChallengeStatus.RESTARTING_WORKER) {
      return; // already resetting
    }
    if (comp.state.editorState === ChallengeStatus.READY && !data?.force) {
      return; // in ready state already
    }
    if (comp.state.worker && comp.state.interruptBuffer) {
      comp.state.interruptBuffer[0] = 2;
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
    if (comp.state.worker) {
      comp.state.worker.terminate();
    }
    let worker = new Worker("/static/js/pyworker_sw.js");
    worker.addEventListener("message", (msg: MessageEvent<WorkerResponse>) =>
      // @ts-ignore  dybamic dispatch from worker
      ChallengeController[msg.data.cmd](comp, msg.data)
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
    comp.setState((state: ChallengeState) => {
      return {
        worker: worker,
        editorState: ChallengeStatus.RESTARTING_WORKER,
        interruptBuffer,
        keyDownBuffer,
      };
    });
    comp.print(msg);
  },
  debug: (comp: Challenge, data: DebugData) => {
    if (comp.props.typ === "parsons") {
      let code = comp.parsonsEditorRef.current?.getValue();
      data.code = code;
    }
    ChallengeController["debugpy"](comp, data);
  },
  run: (comp: Challenge, data: DebugData) => {
    if (comp.props.typ === "parsons") {
      let code = comp.parsonsEditorRef.current?.getValue();
      data.code = code;
    }
    ChallengeController["runpy"](comp, data);
  },  
  debugpy: (comp: Challenge, data: DebugData) => {
    comp.currentFixedUserInput = comp.state.fixedUserInput.split("\n") || [""];
    comp.tabbedViewRef?.current?.requestPane(0);
    if (!data.code && data.code !== "") {
      return;
    }
    if (comp.state.editorState === ChallengeStatus.READY) {
      if (comp.state.interruptBuffer) {
        comp.state.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
      }
      comp.state.worker?.postMessage({
        cmd: "debug",
        code: data.code,
        breakpoints: data.breakpoints,
      });
      comp.setState({
        editorState: ChallengeStatus.RUNNING,
        breakpointsChanged: false,
      });
      comp.cls();
    }
    ChallengeController["save-code"](comp, { code: data.code });
  },
  runpy: (comp: Challenge, data: DebugData) => {
    comp.currentFixedUserInput = comp.state.fixedUserInput.split("\n") || [""];
    comp.tabbedViewRef?.current?.requestPane(0);
    if (!data.code && data.code !== "") {
      return;
    }
    if (comp.state.editorState === ChallengeStatus.READY) {
      if (comp.state.interruptBuffer) {
        comp.state.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
      }
      comp.setState({
        editorState: ChallengeStatus.RUNNING
      });      
      comp.state.worker?.postMessage({
        cmd: "run",
        code: data.code
      });
      comp.cls();
    }
    ChallengeController["save-code"](comp, { code: data.code });
  },  
  test: (comp: Challenge, data: TestData) => {
    if (comp.props.typ === "parsons") {
      comp.setState({
        testResults: comp.parsonsEditorRef.current?.runTests() || [],
      });
      return;
    }

    ChallengeController["testpy"](comp, data);
  },
  testpy: (comp: Challenge, data: TestData) => {
    if (!comp.state.worker || !data.tests || !data.code) {
      return;
    }
    if (comp.state.editorState === ChallengeStatus.READY) {
      if (comp.state.interruptBuffer) {
        comp.state.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
      }
      comp.state.worker.postMessage({
        cmd: "test",
        code: data.code,
        tests: data.tests,
      });
      comp.setState({ editorState: ChallengeStatus.RUNNING });
      comp.cls();
    }
    ChallengeController["save-code"](comp, { code: data.code });
  },
  "reset-code": (comp: Challenge) => {
    if (comp.props.typ === "parsons") {
      comp.parsonsEditorRef.current?.reset();
      return;
    }
    if (
      (comp.state.starterCode === "" || comp.state.starterCode) &&
      comp.editorRef.current
    ) {
      comp.editorRef.current.setValue(comp.state.starterCode);
    }
  },
  breakpt: (comp: Challenge, data: DebugContext) => {
    comp.setState({
      debugContext: {
        lineno: data.lineno,
        env: new Map([...data.env.entries()].sort()),
      },
      editorState: ChallengeStatus.ON_BREAKPOINT,
    });
    comp.editorRef.current?.revealLine(data.lineno);
  },
  "save-code": (comp: Challenge, data: SaveCodeData) => {
    if ((data.code || data.code === "") && comp.props.uid) {
      localStorage.setItem(
        "code-" + encodeURIComponent(comp.props.uid),
        data.code
      );
    }
  },
  "canvas-keydown": (comp: Challenge, data: React.KeyboardEvent) => {
    if (comp.state.keyDownBuffer) {
      let code = keyToVMCode(data.key);
      if (code && code > 0 && code < 256) {
        comp.state.keyDownBuffer[code] = 1;
      }
    }
  },
  "canvas-keyup": (comp: Challenge, data: React.KeyboardEvent) => {
    if (comp.state.keyDownBuffer) {
      let code = keyToVMCode(data.key);
      if (code && code > 0 && code < 256) {
        comp.state.keyDownBuffer[code] = 0;
      }
    }
  },
};

export default ChallengeController;
