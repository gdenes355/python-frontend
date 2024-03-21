import React, { useImperativeHandle, useRef } from "react";
import Outputs, { OutputsHandle } from "./Outputs";
import PaneType from "../../../models/PaneType";
import ChallengeTypes from "../../../models/ChallengeTypes";
import ChallengeConsole from "./ChallengeConsole";
import {
  CodeRunnerRef,
  CodeRunnerState,
} from "../../../coderunner/useCodeRunner";
import FixedInputField, { FixedInputFieldHandle } from "./FixedInputField";
import CanvasDisplay, {
  CanvasDisplayHandle,
} from "./CanvasDisplay/CanvasDisplay";
import {
  AdditionalFiles,
  AdditionalFilesContents,
} from "../../../models/AdditionalFiles";
import AdditionalFileView from "../Editors/AdditionalFileView";

type ChallengeOutputsHandle = {
  focusPane: (pane: PaneType) => void;
  awaitCanvas: () => Promise<void>;
  getFixedInputs: () => string | undefined;
  getCanvas: () => CanvasDisplayHandle | null;
};

type ChallengeOutputsProps = {
  typ: ChallengeTypes;
  additionalFiles: AdditionalFiles;
  additionalFilesLoaded: AdditionalFilesContents;
  usesFixedInput: boolean;

  codeRunner: CodeRunnerRef;
};

const ChallengeOutputs = React.forwardRef<
  ChallengeOutputsHandle,
  ChallengeOutputsProps
>((props, ref) => {
  // reference to generic underlying outputs component
  const outputsRef = useRef<OutputsHandle>(null);

  // canvas
  const canvasPromiseResolve = useRef<((value: any) => void) | null>(null);
  const canvasDisplayRef = useRef<CanvasDisplayHandle | null>(null);
  const canvasMountedCallback = () => {
    if (canvasPromiseResolve.current) {
      const local = canvasPromiseResolve.current;
      canvasPromiseResolve.current = null;
      if (local) local(true);
    }
  };

  // fixed input
  const fixedInputFieldRef = useRef<FixedInputFieldHandle | null>(null);

  useImperativeHandle(ref, () => ({
    focusPane: (pane: PaneType) => {
      outputsRef.current?.focusPane(pane);
    },
    awaitCanvas: () => {
      return new Promise<void>((resolve) => {
        if (canvasDisplayRef.current) {
          resolve();
          return;
        }
        if (!!canvasPromiseResolve.current) {
          console.log("awaitCanvas called twice");
        }
        canvasPromiseResolve.current = resolve;
      });
    },
    getFixedInputs: () => {
      return fixedInputFieldRef.current?.getValue();
    },
    getCanvas: () => canvasDisplayRef.current,
  }));

  return (
    <Outputs
      ref={outputsRef}
      visiblePanes={[
        "console",
        ...(props.typ === ChallengeTypes.canvas ? ["canvas" as PaneType] : []),
        ...(props.usesFixedInput ? ["fixed-input" as PaneType] : []),
      ]}
      console={
        <ChallengeConsole
          content={props.codeRunner.consoleText}
          inputEnabled={
            props.codeRunner.state === CodeRunnerState.AWAITING_INPUT
          }
        />
      }
      fixedInput={<FixedInputField ref={fixedInputFieldRef} />}
      canvas={
        <CanvasDisplay
          ref={(c) => {
            canvasDisplayRef.current = c;
            if (canvasDisplayRef.current) canvasMountedCallback();
          }}
        />
      }
      files={
        props.additionalFiles?.map((file, index) => (
          <AdditionalFileView
            key={index}
            defaultValue={props.additionalFilesLoaded[file.filename]}
            readonly={true}
          />
        )) || []
      }
      fileProperties={props.additionalFiles || []}
      fileShowAll={false}
    />
  );
});

export default ChallengeOutputs;
export { ChallengeOutputsHandle };
