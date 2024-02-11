import React from "react";
import { DebouncedFunc } from "lodash";
import ChallengeStatus from "../models/ChallengeStatus";
import ChallengeTypes from "../models/ChallengeTypes";
import { TestCases, TestResults } from "../models/Tests";
import {
  AdditionalFiles,
  AdditionalFilesContents,
} from "../models/AdditionalFiles";
import { CanvasDisplayHandle } from "./components/CanvasDisplay/CanvasDisplay";
import { ParsonsEditorHandle } from "./components/Editors/ParsonsEditor";
import { PyEditorHandle } from "./components/Editors/PyEditor";
import { FixedInputFieldHandle } from "./components/FixedInputField";
import { OutputsHandle } from "./components/Outputs";
import DebugContext from "../models/DebugContext";
import IBookFetcher from "../book/utils/IBookFetcher";
import { SessionContextType } from "../auth/SessionContext";
import { ProgressStorage } from "../book/utils/ProgressStorage";
import BookNodeModel from "../models/BookNodeModel";

type IChallengeProps = {
  uid: string;
  tests?: TestCases | null;
  isExample?: boolean;
  isAssessment?: boolean;
  guidePath: string;
  codePath: string;
  fetcher: IBookFetcher;
  typ?: "py" | "parsons" | "canvas";
  authContext: SessionContextType;
  progressStorage: ProgressStorage;
  bookNode: BookNodeModel;
};

type IChallengeState = {
  starterCode: string | null;
  editorState: ChallengeStatus;
  typ: ChallengeTypes; // used to determine which editor to show - a live type because it can change dynamically e.g. on turtle command
  origTyp: ChallengeTypes; // used as a backup when switching between parsons/py and canvas for restoration
  usesFixedInput: boolean;
  guideMd: string;
  debugContext: DebugContext;
  consoleText: string;
  testResults: TestResults;
  additionalFilesLoaded: AdditionalFilesContents;
  turtleExampleRendered: string | undefined;
  paneSizes: number[];
  renderKey: number; // Initial render key used for resetting the allotment pane sizes
};

interface IChallenge {
  editorRef: React.RefObject<PyEditorHandle>;
  parsonsEditorRef: React.RefObject<ParsonsEditorHandle>;
  canvasDisplayRef: React.MutableRefObject<CanvasDisplayHandle | null>;
  fixedInputFieldRef: React.RefObject<FixedInputFieldHandle>;
  outputsRef: React.RefObject<OutputsHandle>;

  breakpointsChanged: boolean;
  worker: Worker | null;
  interruptBuffer: Uint8Array | null;
  keyDownBuffer: Uint8Array | null;

  printCallback: DebouncedFunc<() => void>;
  canvasMountedCallback: () => void;
  canvasPromiseResolve?: (value: any) => void;

  currentConsoleText: string;
  currentFixedUserInput: string[];
  workerFullyInitialised: boolean;

  forceStopping: boolean;

  props: IChallengeProps;
  state: IChallengeState;
  setState: (newState: any) => void; // this seems hacky
}

export default IChallenge;
export { IChallengeProps, IChallengeState };
