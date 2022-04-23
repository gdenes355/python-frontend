import React from "react";
import { DebouncedFunc } from "lodash";
import ChallengeStatus from "../models/ChallengeStatus";
import ChallengeTypes from "../models/ChallengeTypes";
import { TestCases } from "../models/Tests";
import { CanvasDisplayHandle } from "./components/CanvasDisplay/CanvasDisplay";
import { ParsonsEditorHandle } from "./components/Editors/ParsonsEditor";
import { PyEditorHandle } from "./components/Editors/PyEditor";
import { FixedInputFieldHandle } from "./components/FixedInputField";
import { OutputsHandle } from "./components/Outputs";
import IFetcher from "../utils/IFetcher";
import DebugContext from "../models/DebugContext";

type IChallengeProps = {
  uid: string;
  tests?: TestCases | null;
  isExample?: boolean;
  guidePath: string;
  codePath: string;
  fetcher: IFetcher;
  typ?: "py" | "parsons" | "canvas";
};

type IChallengeState = {
  starterCode: string | null;
  editorState: ChallengeStatus;
  typ: ChallengeTypes;
  usesFixedInput: boolean;
  guideMd: string;
  debugContext: DebugContext;
  consoleText: string;
};

interface IChallenge {
  editorRef: React.RefObject<PyEditorHandle>;
  parsonsEditorRef: React.RefObject<ParsonsEditorHandle>;
  canvasDisplayRef: React.RefObject<CanvasDisplayHandle>;
  fixedInputFieldRef: React.RefObject<FixedInputFieldHandle>;
  outputsRef: React.RefObject<OutputsHandle>;

  breakpointsChanged: boolean;
  worker: Worker | null;
  interruptBuffer: Uint8Array | null;
  keyDownBuffer: Uint8Array | null;

  printCallback: DebouncedFunc<() => void>;

  currentConsoleText: string;
  currentFixedUserInput: string[];

  props: IChallengeProps;
  state: IChallengeState;
  setState: (newState: any) => void; // this seems hacky
}

export default IChallenge;
export { IChallengeProps, IChallengeState };
