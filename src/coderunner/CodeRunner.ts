import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TestCases, TestResults } from "../models/Tests";
import {
  AdditionalFile,
  AdditionalFilesContents,
} from "../models/AdditionalFiles";
import BookNodeModel from "../models/BookNodeModel";

enum CodeRunnerState {
  LOADING = 0,
  INITIALISING,
  RESTARTING_WORKER,
  READY,
  AWAITING_INPUT,
  ON_BREAKPOINT,
  RUNNING,
  RUNNING_WITH_DEBUGGER,
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

type TestFinishedData = {
  results: TestResults;
  bookNode: BookNodeModel;
  code: string;
};

type CodeRunnerProps = {
  onCls?: () => void;
  onPrint?: (msg: string) => void;
  awaitCanvas?: () => Promise<void>;
  turtleReset?: (virtual: boolean) => void;
  runTurtleCommand?: (id: number, msg: string) => void;
  onDraw?: (msg: string) => void;
  onAudio?: (msg: string) => void;
  onTurtle?: (id: number, msg: string) => void;
};

type CodeRunnerRef = {
  test: (
    code: string,
    tests: TestCases,
    additionalFiles: AdditionalFile[] | undefined,
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => Promise<TestFinishedData>;
  state: CodeRunnerState;
  restartWorker: (force?: boolean, msg?: string) => void;
  turtleCmdComplete: (turtleResult?: string) => void;
  kill: () => void;
};

type PromiseResRej<T> = {
  res: (value: T) => void;
  rej: (reason?: any) => void;
};

const useCodeRunner = (props: CodeRunnerProps) => {
  const [state, setState] = useState(CodeRunnerState.LOADING);
  const worker = useRef<Worker | null>(null);
  const interruptBuffer = useRef<Uint8Array | null>(null);
  const keyDownBuffer = useRef<Uint8Array | null>(null);
  const workerFullyInitialised = useRef(false);
  const forceStopping = useRef(false);

  const testPromiseResRej = useRef<PromiseResRej<TestFinishedData>>();

  const actions = useMemo(() => {
    return {
      "init-done": () => {
        workerFullyInitialised.current = true;
        forceStopping.current = false;
        setState(CodeRunnerState.READY);
      },
      print: ({ msg }: Data2) => {
        if (state !== CodeRunnerState.READY) {
          props.onPrint?.(msg);
        }
      },
      draw: ({ msg }: Data2) => {
        props.onDraw?.(msg);
      },
      audio: ({ msg }: Data2) => {
        props.onAudio?.(msg);
      },
      turtle: ({ id, msg }: TurtleData) => {
        props.onTurtle?.(id, msg);
      },
      "test-finished": ({ results, bookNode, code }: TestFinishedData) => {
        forceStopping.current = false;
        testPromiseResRej.current?.res({ results, bookNode, code });
        setState(CodeRunnerState.READY);
      },
    };
  }, [props, state]);

  const turtleCmdComplete = (turtleResult?: string) => {
    if (state !== CodeRunnerState.READY) {
      navigator.serviceWorker.controller?.postMessage({
        cmd: "ps-turtle-resp",
        data: turtleResult,
      });
    }
  };

  const restartWorker = useCallback(
    (force?: boolean, msg?: string) => {
      props.runTurtleCommand?.(-1, '{"action": "stop"}');
      if (state === CodeRunnerState.RESTARTING_WORKER) return;
      if (state === CodeRunnerState.READY && !force) return;
      if (
        worker.current &&
        interruptBuffer.current &&
        workerFullyInitialised.current
      ) {
        interruptBuffer.current[0] = 2;
        navigator.serviceWorker.controller?.postMessage({ cmd: "ps-reset" });
        return; // we can just issue an interrupt, no need to kill worker
      }
      worker.current?.terminate();
      forceStopping.current = false;
      let newWorker = new Worker("/static/js/pyworker_sw.js");
      newWorker.addEventListener(
        "message",
        (msg: MessageEvent<WorkerResponse>) => {
          // @ts-ignore  dynamic dispatch from worker
          actions[msg.data.cmd](msg.data);
          console.log("worker message", msg.data);
        }
      );
      let newInterruptBuffer: Uint8Array | null = null;
      let newKeyDownBuffer: Uint8Array | null = null;
      if (window.crossOriginIsolated && window.SharedArrayBuffer) {
        newInterruptBuffer = new Uint8Array(new window.SharedArrayBuffer(1));
        newInterruptBuffer[0] = 0;
        newKeyDownBuffer = new Uint8Array(new window.SharedArrayBuffer(256));
        newWorker.postMessage({
          cmd: "setSharedBuffers",
          interruptBuffer,
          newKeyDownBuffer,
        });
      }
      msg = msg || "";
      worker.current = newWorker;
      interruptBuffer.current = newInterruptBuffer;
      keyDownBuffer.current = newKeyDownBuffer;
      setState(CodeRunnerState.RESTARTING_WORKER);
      navigator.serviceWorker.controller?.postMessage({ cmd: "ps-reset" });
      props.onPrint?.(msg);
    },
    [state, props, actions]
  );

  const test = (
    code: string,
    tests: TestCases,
    additionalFiles: AdditionalFile[] | undefined,
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => {
    if (testPromiseResRej.current) {
      testPromiseResRej.current.rej("Test cancelled");
    }
    return new Promise<TestFinishedData>((res, rej) => {
      testPromiseResRej.current = { res, rej };
      runTest(code, tests, additionalFiles, additionalFilesLoaded, bookNode);
    });
  };

  const runTest = (
    code: string,
    tests: TestCases,
    additionalFiles: AdditionalFile[] | undefined,
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => {
    if (!code || !tests || !worker.current || state !== CodeRunnerState.READY) {
      return;
    }
    if (interruptBuffer.current) {
      interruptBuffer.current[0] = 0;
    }
    let additionalCode = additionalFiles
      ?.map(
        (file) =>
          `with open("${
            file.filename
          }", "w") as f:f.write("""${additionalFilesLoaded[file.filename]
            .replace(/"/g, '\\"')
            .replace(/\\/g, "\\\\")}""")\n`
      )
      .join("\n");

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

      props.awaitCanvas?.().then(() => {
        props.turtleReset?.(true);
        worker.current?.postMessage({
          cmd: "test",
          code: code,
          initCode: additionalCode,
          tests: testsClone,
          bookNode: bookNode,
        });
      });
    } else {
      // use the original tests for non turtle tests to avoid changing filenames to contents
      worker.current.postMessage({
        cmd: "test",
        code: code,
        initCode: additionalCode,
        tests: tests,
        bookNode: bookNode,
      });
    }
    setState(CodeRunnerState.RUNNING);
    props.onCls?.();
  };

  const kill = () => {
    if (forceStopping.current) return;
    forceStopping.current = true;
    setTimeout(() => {
      if (forceStopping.current) {
        interruptBuffer.current = null; // clear the interrupt buffer, it didn't work
        restartWorker(true, "Restart Python...");
        forceStopping.current = false;
        setState(CodeRunnerState.READY);
      }
    }, 2000);
    restartWorker(true, "Interrupted...");
  };

  useEffect(() => {
    console.log("Restarting worker");
    restartWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    test,
    state,
    restartWorker,
    turtleCmdComplete,
    kill,
  };
};

export default useCodeRunner;
export { CodeRunnerState, CodeRunnerRef };
