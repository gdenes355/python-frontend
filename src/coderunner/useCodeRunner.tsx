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
import { throttle } from "lodash";
import DebugContext from "./DebugContext";

type CodeRunnerProps = {
  onCls?: () => void;
  onPrint?: (msg: string) => void;
  awaitCanvas?: () => Promise<void>;
  turtleReset?: (virtual: boolean) => void;
  onTurtle?: (id: number, msg: string) => Promise<string | undefined>;
  onDraw?: (cmds: any[]) => Promise<void>;
  onAudio?: (msg: string) => void;
  onHideTurtle?: () => void;
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
  refreshDebugContext: (dbgSetup: DebugSetup) => void;
  kill: () => void;
  keyDown: (data: React.KeyboardEvent) => void;
  keyUp: (data: React.KeyboardEvent) => void;
  step: () => void;
  continue: () => void;
  input: (input: string) => void;
  addConsoleText: (text: string) => void;
  clear: () => void;
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

const useCodeRunner = (props: CodeRunnerProps) => {
  if (!pythonCodeRunner) {
    pythonCodeRunner = new PythonCodeRunner();
  }
  const [state, setState] = useState(CodeRunnerState.LOADING);
  const [consoleText, setConsoleText] = useState("");
  const consoleTextUnthrottled = useRef("");
  const throttledPrint = useRef(
    throttle(() => setConsoleText(consoleTextUnthrottled.current), 100)
  );

  // callback references tued to the relevant props
  // this prop redirection helps to maintain a single callback
  // to the actual underlying code runner instance
  const onPrint = useRef(props.onPrint);
  const onAwaitCanvas = useRef(props.awaitCanvas);
  const onTurtleReset = useRef(props.turtleReset);
  const onTurtle = useRef(props.onTurtle);
  const onDraw = useRef(props.onDraw);
  const onAudio = useRef(props.onAudio);
  const onCls = useRef(props.onCls);
  const onHideTurtle = useRef(props.onHideTurtle);
  useEffect(() => {
    onPrint.current = props.onPrint;
  }, [props.onPrint]);
  useEffect(() => {
    onAwaitCanvas.current = props.awaitCanvas;
  }, [props.awaitCanvas]);
  useEffect(() => {
    onTurtleReset.current = props.turtleReset;
  }, [props.turtleReset]);
  useEffect(() => {
    onTurtle.current = props.onTurtle;
  }, [props.onTurtle]);
  useEffect(() => {
    onDraw.current = props.onDraw;
  }, [props.onDraw]);
  useEffect(() => {
    onAudio.current = props.onAudio;
  }, [props.onAudio]);
  useEffect(() => {
    onCls.current = props.onCls;
  }, [props.onCls]);
  useEffect(() => {
    onHideTurtle.current = props.onHideTurtle;
  }, [props.onHideTurtle]);

  useEffect(() => {
    if (!pythonCodeRunner) {
      pythonCodeRunner = new PythonCodeRunner();
    }
    let newStateId = pythonCodeRunner.onStateChanged.register((newState) => {
      setState(newState);
    });
    let onPrintId = pythonCodeRunner.onPrint.register((msg) => {
      onPrint.current?.(msg);
      consoleTextUnthrottled.current += msg;
      throttledPrint.current();
    });
    let onAwaitCanvasId = pythonCodeRunner.onAwaitCanvas.register(() =>
      onAwaitCanvas.current ? onAwaitCanvas.current() : Promise.resolve()
    );
    let onTurtleResetId = pythonCodeRunner.onTurtleReset.register((virtual) =>
      onTurtleReset.current?.(virtual)
    );
    let onTurtleId = pythonCodeRunner.onTurtle.register(({ id, msg }) =>
      onTurtle.current ? onTurtle.current(id, msg) : Promise.resolve(undefined)
    );
    let onDrawId = pythonCodeRunner.onDraw.register((cmds) =>
      onDraw.current ? onDraw.current(cmds) : Promise.resolve()
    );
    let onAudioId = pythonCodeRunner.onAudio.register((msg) =>
      onAudio.current?.(msg)
    );
    let onClsId = pythonCodeRunner.onCls.register(() => {
      consoleTextUnthrottled.current = "";
      throttledPrint.current();
      onCls.current?.();
    });
    let onHideTurtleId = pythonCodeRunner.onHideTurtle.register(() =>
      onHideTurtle.current?.()
    );

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
        pythonCodeRunner.onHideTurtle.unregister(onHideTurtleId);
      }
    };
  }, []);

  const clear = useCallback(() => {
    consoleTextUnthrottled.current = "";
    throttledPrint.current();
  }, []);

  const addConsoleText = useCallback((text: string) => {
    consoleTextUnthrottled.current += text;
    throttledPrint.current();
  }, []);

  return {
    test: pythonCodeRunner.test,
    state: state,
    kill: pythonCodeRunner.kill,
    debug: pythonCodeRunner.debug,
    keyDown: pythonCodeRunner.keyDown,
    keyUp: pythonCodeRunner.keyUp,
    step: pythonCodeRunner.step,
    refreshDebugContext: pythonCodeRunner.refreshDebugContext,
    continue: pythonCodeRunner.continue,
    input: pythonCodeRunner.input,
    consoleText: consoleText,
    debugContext: pythonCodeRunner.debugContext,
    addConsoleText: addConsoleText,
    clear: clear,
  };
};

export default useCodeRunner;
export { CodeRunnerState, CodeRunnerRef, CodeRunnerStateDisplay };
