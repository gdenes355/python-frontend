import React, { useContext, useImperativeHandle, useMemo, useRef } from "react";
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
import BookNodeEditor, {
  BookNodeEditorHandle,
} from "../Editors/BookNodeEditor";
import ChallengeContext from "../../ChallengeContext";
import { TestCases } from "../../../models/Tests";
import AudioPlayer, {
  AudioPlayerHandle,
} from "../../../components/AudioPlayer";
import { Box } from "@mui/material";
import TabbedView, { TabbedViewHandle } from "../../../components/TabbedView";
import BookNodeModel from "../../../models/BookNodeModel";
import BookJsonEditor from "../Editors/BookJSONEditor";

import EditableBookStore from "../../../book/utils/EditableBookStore";
import SessionFiles from "./SessionFiles";
import { SessionFile } from "../../../models/SessionFile";
import SessionFileView from "../Editors/SessionFileView";

type ChallengeOutputsProps = {
  typ: ChallengeTypes;
  additionalFiles: AdditionalFiles;
  additionalFilesLoaded: AdditionalFilesContents;
  tests?: TestCases;
  usesFixedInput: boolean;
  isSessionFilesAllowed?: boolean;
  sessionFiles: SessionFile[];

  codeRunner: CodeRunnerRef;

  // for editing book
  bookNode: BookNodeModel;
  bookStore?: EditableBookStore;
};

type ChallengeOutputsHandle = {
  focusPane: (pane: PaneType) => void;
  awaitCanvas: () => Promise<void>;
  getFixedInputs: () => string | undefined;
  getCanvas: () => CanvasDisplayHandle | null;
  getBookNodeEditor: () => BookNodeEditorHandle | null;
  getVisibleFileContents: () => Map<string, string>;
  getAudioPlayer: () => AudioPlayerHandle | null;
};

const ChallengeOutputs = React.forwardRef<
  ChallengeOutputsHandle,
  ChallengeOutputsProps
>((props, ref) => {
  const challengeContext = useContext(ChallengeContext);

  // tabbed view controller
  const tabbedViewRef = useRef<TabbedViewHandle>(null);

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
  const bookNodeEditorRef = useRef<BookNodeEditorHandle | null>(null);
  const fileEditorRefs = useRef<Map<string, AdditionalFileViewRef>>(new Map());

  useImperativeHandle(ref, () => ({
    focusPane: (pane: PaneType) => {
      tabbedViewRef.current?.requestPane(pane);
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
    getBookNodeEditor: () => bookNodeEditorRef.current,
    getVisibleFileContents: () => {
      const map = new Map<string, string>();
      fileEditorRefs.current.forEach((editor, key) => {
        map.set(key, editor.getValue());
      });
      return map;
    },
    getAudioPlayer: () => audioPlayerRef.current,
  }));

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

  const panes = [
    {
      label: "Console",
      content: (
        <ChallengeConsole
          content={props.codeRunner.consoleText}
          inputEnabled={
            props.codeRunner.state === CodeRunnerState.AWAITING_INPUT
          }
          ready={props.codeRunner.state === CodeRunnerState.READY}
        />
      ),
      show: true,
      name: "console",
    },
  ];

  panes.push({
    label: "Fixed input",
    content: <FixedInputField ref={fixedInputFieldRef} />,
    show: props.usesFixedInput,
    name: "fixed-input",
  });

  panes.push({
    label: "Canvas",
    content: (
      <CanvasDisplay
        ref={(c) => {
          canvasDisplayRef.current = c;
          if (canvasDisplayRef.current) canvasMountedCallback();
        }}
      />
    ),
    show: props.typ === ChallengeTypes.canvas,
    name: "canvas",
  });

  if (challengeContext?.isEditing) {
    panes.push({
      label: "Edit challenge",
      content: (
        <BookNodeEditor
          ref={bookNodeEditorRef}
          onToggleFullScreen={() => {}}
          onChange={() => {
            challengeContext?.actions["has-made-edit"]();
          }}
          bookNode={props.bookNode}
        />
      ),
      show: challengeContext?.isEditing,
      name: "json",
    });
    panes.push({
      label: "book.json",
      content: (
        <BookJsonEditor
          ref={() => {}}
          bookStore={props.bookStore}
          onChange={() => {
            challengeContext?.actions["has-made-edit"]();
          }}
          bookNode={props.bookNode}
        />
      ),
      show: challengeContext?.isEditing,
      name: "book.json",
    });
  } else if (props.isSessionFilesAllowed) {
    panes.push({
      label: "Session Files",
      content: (
        <SessionFiles
          onAddSessionFile={(file) => {
            props.sessionFiles.push(file);
            challengeContext?.actions["has-changed-session-files"]();
          }}
          sessionFiles={props.sessionFiles}
          onRemoveSessionFile={(fileName) => {
            const index = props.sessionFiles.findIndex(
              (file) => file.filename === fileName
            );
            if (index >= 0) {
              props.sessionFiles.splice(index, 1);
              challengeContext?.actions["has-changed-session-files"]();
            }
          }}
        />
      ),
      show: true,
      name: "session_files",
    });
    for (const file of props.sessionFiles) {
      panes.push({
        label: "session/" + file.filename,
        content: (
          <SessionFileView key={"session/" + file.filename} file={file} />
        ),
        show: true,
        name: file.filename,
      });
    }
  }

  if (displayFilesProperties) {
    displayFilesProperties.forEach((file, index) => {
      panes.push({
        label: file.filename,
        content: (
          <AdditionalFileView
            key={index}
            defaultValue={props.additionalFilesLoaded[file.filename]}
            readonly={!challengeContext?.isEditing}
            onChange={() => challengeContext?.actions["has-made-edit"]()}
            ref={(r) => {
              if (r) {
                fileEditorRefs.current?.set(file.filename, r);
              } else {
                fileEditorRefs.current?.delete(file.filename);
              }
            }}
          />
        ),
        show: file.visible || challengeContext?.isEditing || false,
        name: file.filename,
      });
    });
  }

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        <TabbedView ref={tabbedViewRef} panes={panes} />
      </Box>
      <AudioPlayer ref={(r) => (audioPlayerRef.current = r)} />
    </>
  );
});

export default ChallengeOutputs;
export { ChallengeOutputsHandle };
