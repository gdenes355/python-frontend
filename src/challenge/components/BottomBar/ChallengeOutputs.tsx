import React, { useContext, useImperativeHandle, useMemo, useRef } from "react";
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
import AdditionalFileView, {
  AdditionalFileViewRef,
} from "../Editors/AdditionalFileView";
import JsonEditor, { JsonEditorHandle } from "../Editors/JsonEditor";
import ChallengeContext from "../../ChallengeContext";
import { TestCases } from "../../../models/Tests";
import AudioPlayer, {
  AudioPlayerHandle,
} from "../../../components/AudioPlayer";

type ChallengeOutputsProps = {
  typ: ChallengeTypes;
  additionalFiles: AdditionalFiles;
  additionalFilesLoaded: AdditionalFilesContents;
  tests?: TestCases;
  usesFixedInput: boolean;

  codeRunner: CodeRunnerRef;

  // for editing book
  nodeAsJson?: string;
};

type ChallengeOutputsHandle = {
  focusPane: (pane: PaneType) => void;
  awaitCanvas: () => Promise<void>;
  getFixedInputs: () => string | undefined;
  getCanvas: () => CanvasDisplayHandle | null;
  getJsonEditor: () => JsonEditorHandle | null;
  getVisibleFileContents: () => Map<string, string>;
  getAudioPlayer: () => AudioPlayerHandle | null;
};

const ChallengeOutputs = React.forwardRef<
  ChallengeOutputsHandle,
  ChallengeOutputsProps
>((props, ref) => {
  const challengeContext = useContext(ChallengeContext);

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

  // audio player
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null);

  // fixed input
  const fixedInputFieldRef = useRef<FixedInputFieldHandle | null>(null);

  // editors (if editing book)
  const jsonEditorRef = useRef<JsonEditorHandle | null>(null);
  const fileEditorRefs = useRef<Map<string, AdditionalFileViewRef>>(new Map());

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
    getJsonEditor: () => jsonEditorRef.current,
    getVisibleFileContents: () => {
      const map = new Map<string, string>();
      fileEditorRefs.current.forEach((editor, key) => {
        map.set(key, editor.getValue());
      });
      return map;
    },
    getAudioPlayer: () => audioPlayerRef.current,
  }));

  const displayFiles = useMemo(() => {
    const files = (props.additionalFiles || []).map((file) => file.filename);

    props.tests?.forEach((test) => {
      if (test.out instanceof Array) {
        test.out.forEach((out) => {
          if (out.filename && !files.includes(out.filename)) {
            files.push(out.filename);
          }
        });
      }
    });
    return files;
  }, [props.tests, props.additionalFiles]);

  const displayFilesProperties = useMemo(() => {
    const filesProperties = props.additionalFiles || [];
    const files = (props.additionalFiles || []).map((file) => file.filename);

    props.tests?.forEach((test) => {
      if (test.out instanceof Array) {
        test.out.forEach((out) => {
          if (out.filename && !files.includes(out.filename)) {
            filesProperties.push({
              filename: out.filename,
              visible: false,
            });
            files.push(out.filename);
          }
        });
      }
    });

    return filesProperties;
  }, [props.tests, props.additionalFiles]);

  return (
    <>
      <Outputs
        ref={outputsRef}
        visiblePanes={[
          "console",
          ...(props.typ === ChallengeTypes.canvas
            ? ["canvas" as PaneType]
            : []),
          ...(props.usesFixedInput ? ["fixed-input" as PaneType] : []),
          ...(challengeContext?.isEditing ? ["json" as PaneType] : []),
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
        json={
          <JsonEditor
            ref={jsonEditorRef}
            starterCode={props.nodeAsJson || ""}
            onToggleFullScreen={() => {}}
            onChange={() => {
              challengeContext?.actions["has-made-edit"]();
            }}
          />
        }
        files={
          displayFiles.map((file, index) => (
            <AdditionalFileView
              key={index}
              defaultValue={props.additionalFilesLoaded[file]}
              readonly={!challengeContext?.isEditing}
              onChange={() => challengeContext?.actions["has-made-edit"]()}
              ref={(r) => {
                if (r) {
                  fileEditorRefs.current?.set(file, r);
                } else {
                  fileEditorRefs.current?.delete(file);
                }
              }}
            />
          )) || []
        }
        fileProperties={displayFilesProperties}
        fileShowAll={challengeContext?.isEditing || false}
      />
      <AudioPlayer ref={(r) => (audioPlayerRef.current = r)} />
    </>
  );
});

export default ChallengeOutputs;
export { ChallengeOutputsHandle };
