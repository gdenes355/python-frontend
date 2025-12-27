import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TestCases } from "../models/Tests";
import {
  AdditionalFile,
  AdditionalFilesContents,
} from "../models/AdditionalFiles";
import BookNodeModel from "../models/BookNodeModel";
import {
  PythonCodeRunner,
  CodeRunnerState,
  TestFinishedData,
  DebugFinishedData,
} from "./CodeRunner";
import DebugSetup from "./DebugSetup";
import throttle from "lodash/throttle";
import DebugContext from "./DebugContext";

type CodeRunnerProps = {
  enabled: boolean;
  onCls?: () => void;
  onPrint?: (msg: string) => void;
  awaitCanvas?: () => Promise<void>;
  turtleReset?: (virtual: boolean) => void;
  onTurtle?: (id: number, msg: string) => Promise<string | undefined>;
  onDraw?: (cmds: any[]) => Promise<void>;
  onAudio?: (msg: string) => void;
};

type CodeRunnerRef = {
  state: CodeRunnerState;
  consoleText: string;
  debugContext: DebugContext | undefined;

  test: (
    code: string,
    tests: TestCases,
    additionalFiles: AdditionalFile[] | undefined,
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => Promise<TestFinishedData>;
  debug: (
    code: string,
    mode: "debug" | "run",
    dbgSetup?: DebugSetup,
    additionalFiles?: AdditionalFile[] | undefined,
    additionalFilesLoaded?: AdditionalFilesContents,
    fixedUserInput?: string
  ) => Promise<DebugFinishedData>;
  drawTurtleExample: (
    additionalFilesLoaded: AdditionalFilesContents,
    bookNode: BookNodeModel
  ) => Promise<string>;
  refreshDebugContext: (dbgSetup: DebugSetup) => void;
  kill: () => void;
  keyDown: (data: React.KeyboardEvent) => void;
  keyUp: (data: React.KeyboardEvent) => void;
  step: () => void;
  continue: () => void;
  input: (input: string) => void;
  addConsoleText: (text: string) => void;
  clear: () => void;
  installDependencies: (deps: string[]) => void;
};

var pythonCodeRunner: PythonCodeRunner | null = null;

type CodeRunnerStateDisplayProps = {
  state: CodeRunnerState;
};
const CodeRunnerStateDisplay = (props: CodeRunnerStateDisplayProps) => {
  const { state } = props;
  const stateText = useMemo(() => {
    return "State: " + CodeRunnerState[state];
  }, [state]);
  return <span>{stateText}</span>;
};

const useCodeRunner = ({
  onAudio: onAudioProp,
  onPrint: onPrintProp,
  awaitCanvas: onAwaitCanvasProp,
  onTurtle: onTurtleProp,
  turtleReset: onTurtleResetProp,
  onCls: onClsProp,
  onDraw: onDrawProp,
  enabled,
}: CodeRunnerProps) => {
  if (!pythonCodeRunner && enabled) {
    pythonCodeRunner = new PythonCodeRunner();
  }
  const [state, setState] = useState(
    pythonCodeRunner?.state || CodeRunnerState.UNINITIALISED
  );
  const [consoleText, setConsoleText] = useState("");
  const consoleTextUnthrottled = useRef("");
  const throttledPrint = useRef(
    throttle(() => setConsoleText(consoleTextUnthrottled.current), 100)
  );

  // callback references tued to the relevant props
  // this prop redirection helps to maintain a single callback
  // to the actual underlying code runner instance
  const onPrint = useRef(onPrintProp);
  const onAwaitCanvas = useRef(onAwaitCanvasProp);
  const onTurtleReset = useRef(onTurtleResetProp);
  const onTurtle = useRef(onTurtleProp);
  const onDraw = useRef(onDrawProp);
  const onAudio = useRef(onAudioProp);
  const onCls = useRef(onClsProp);
  useEffect(() => {
    onPrint.current = onPrintProp;
  }, [onPrintProp]);
  useEffect(() => {
    onAwaitCanvas.current = onAwaitCanvasProp;
  }, [onAwaitCanvasProp]);
  useEffect(() => {
    onTurtleReset.current = onTurtleResetProp;
  }, [onTurtleResetProp]);
  useEffect(() => {
    onTurtle.current = onTurtleProp;
  }, [onTurtleProp]);
  useEffect(() => {
    onDraw.current = onDrawProp;
  }, [onDrawProp]);
  useEffect(() => {
    onAudio.current = onAudioProp;
  }, [onAudioProp]);
  useEffect(() => {
    onCls.current = onClsProp;
  }, [onClsProp]);

  useEffect(() => {
    if (!enabled) return;

    if (!pythonCodeRunner) {
      pythonCodeRunner = new PythonCodeRunner();
    }
    const newStateId = pythonCodeRunner.onStateChanged.register((newState) => {
      setState(newState);
    });
    const onPrintId = pythonCodeRunner.onPrint.register((msg) => {
      onPrint.current?.(msg);
      consoleTextUnthrottled.current += msg;
      throttledPrint.current();
    });
    const onAwaitCanvasId = pythonCodeRunner.onAwaitCanvas.register(() =>
      onAwaitCanvas.current ? onAwaitCanvas.current() : Promise.resolve()
    );
    const onTurtleResetId = pythonCodeRunner.onTurtleReset.register((virtual) =>
      onTurtleReset.current?.(virtual)
    );
    const onTurtleId = pythonCodeRunner.onTurtle.register(({ id, msg }) =>
      onTurtle.current ? onTurtle.current(id, msg) : Promise.resolve(undefined)
    );
    const onDrawId = pythonCodeRunner.onDraw.register((cmds) =>
      onDraw.current ? onDraw.current(cmds) : Promise.resolve()
    );
    const onAudioId = pythonCodeRunner.onAudio.register((msg) =>
      onAudio.current?.(msg)
    );
    const onClsId = pythonCodeRunner.onCls.register(() => {
      consoleTextUnthrottled.current = "";
      throttledPrint.current();
      onCls.current?.();
    });

    return () => {
      if (pythonCodeRunner) {
        pythonCodeRunner.onStateChanged.unregister(newStateId);
        pythonCodeRunner.onPrint.unregister(onPrintId);
        pythonCodeRunner.onAwaitCanvas.unregister(onAwaitCanvasId);
        pythonCodeRunner.onTurtleReset.unregister(onTurtleResetId);
        pythonCodeRunner.onTurtle.unregister(onTurtleId);
        pythonCodeRunner.onDraw.unregister(onDrawId);
        pythonCodeRunner.onAudio.unregister(onAudioId);
        pythonCodeRunner.onCls.unregister(onClsId);
      }
    };
  }, [enabled]);

  const clear = useCallback(() => {
    consoleTextUnthrottled.current = "";
    throttledPrint.current();
  }, []);

  const addConsoleText = useCallback((text: string) => {
    consoleTextUnthrottled.current += text;
    throttledPrint.current();
  }, []);

  return {
    test:
      pythonCodeRunner?.test ||
      (() => Promise.resolve({ results: [], code: "", bookNode: undefined })),
    state: state,
    kill: pythonCodeRunner?.kill || (() => {}),
    debug:
      pythonCodeRunner?.debug ||
      (() => Promise.resolve({ results: [], code: "", bookNode: undefined })),
    keyDown: pythonCodeRunner?.keyDown || (() => {}),
    keyUp: pythonCodeRunner?.keyUp || (() => {}),
    step: pythonCodeRunner?.step || (() => {}),
    refreshDebugContext:
      pythonCodeRunner?.refreshDebugContext || ((_: DebugSetup) => {}),
    continue: pythonCodeRunner?.continue || (() => {}),
    input: pythonCodeRunner?.input || (() => {}),
    consoleText: consoleText,
    debugContext: pythonCodeRunner?.debugContext || undefined,
    drawTurtleExample:
      pythonCodeRunner?.drawTurtleExample || (() => Promise.resolve("")),
    addConsoleText: addConsoleText,
    clear: clear,
    installDependencies: pythonCodeRunner?.installDependencies || (() => {}),
  };
};

export default useCodeRunner;
export { CodeRunnerState, CodeRunnerRef, CodeRunnerStateDisplay };
