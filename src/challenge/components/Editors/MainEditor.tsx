import React from "react";
import ChallengeTypes from "../../../models/ChallengeTypes";
import ParsonsEditor, { ParsonsEditorHandle } from "./ParsonsEditor";
import {
  CodeRunnerRef,
  CodeRunnerState,
} from "../../../coderunner/useCodeRunner";
import PyEditor, { PyEditorHandle } from "./PyEditor";
import { emptyDebugContext } from "../../../coderunner/DebugContext";

type MainEditorProps = {
  typ: ChallengeTypes;
  savedCode?: string;
  starterCode?: string;
  parsonsEditorRef: React.RefObject<ParsonsEditorHandle>;
  pyEditorRef: React.RefObject<PyEditorHandle>;
  codeRunner: CodeRunnerRef;
  onToggleFullScreen: () => void;
};

const MainEditor = (props: MainEditorProps) => {
  if (props.typ === "parsons") {
    return (
      <ParsonsEditor
        ref={props.parsonsEditorRef}
        starterCode={props.savedCode || props.starterCode || ""}
      />
    );
  }
  return (
    <PyEditor
      ref={props.pyEditorRef}
      starterCode={props.savedCode || props.starterCode || ""}
      canRun={props.codeRunner.state === CodeRunnerState.READY}
      canPlaceBreakpoint={
        props.codeRunner.state === CodeRunnerState.READY ||
        props.codeRunner.state === CodeRunnerState.AWAITING_INPUT ||
        props.codeRunner.state === CodeRunnerState.ON_BREAKPOINT
      }
      isOnBreakPoint={props.codeRunner.state === CodeRunnerState.ON_BREAKPOINT}
      debugContext={props.codeRunner.debugContext || emptyDebugContext}
      onToggleFullScreen={props.onToggleFullScreen}
    />
  );
};

export default MainEditor;
