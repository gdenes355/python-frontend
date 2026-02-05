import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TestResults } from "../models/Tests";
import ChallengeTypes from "../models/ChallengeTypes";
import IBookFetcher from "../book/utils/IBookFetcher";
import { ProgressStorage } from "../book/utils/ProgressStorage";
import BookNodeModel from "../models/BookNodeModel";
import { PyEditorHandle } from "./components/Editors/PyEditor";
import { ParsonsEditorHandle } from "./components/Editors/ParsonsEditor";

import useCodeRunner, { CodeRunnerState } from "../coderunner/useCodeRunner";
import BookUploadModal from "../book/components/BookUploadModal";
import { Paper } from "@mui/material";
import { Box } from "@mui/system";

import { Allotment, AllotmentHandle } from "allotment";
import "allotment/dist/style.css";

import BookControlFabs from "../book/components/BookControlFabs";
import DebugPane from "./components/Debug/DebugPane";
import ChallengeContext, { Actions, wrapActions } from "./ChallengeContext";
import useChallengeLoader from "./hooks/useChallengeLoader";
import "./Challenge.css";
import Header from "./components/Header/Header";
import MainEditor from "./components/Editors/MainEditor";
import ChallengeOutputs, {
  ChallengeOutputsHandle,
} from "./components/Outputs/Outputs";
import EditableBookStore from "../book/utils/EditableBookStore";
import ChallengeGuide, {
  ChallengeGuideRef,
} from "./components/Guide/ChallengeGuide";
import saveNode from "../book/utils/BookSaver";
import SaveDialog, { SaveDialogProps } from "../components/dialogs/SaveDialog";
import NotificationsContext from "../components/NotificationsContext";
import { SessionFile } from "../models/SessionFile";

import { GuideToggleFab } from "./components/GuideToggleFab";
import { BookUploadType } from "../book/components/BookUpload";
import BookServerUploader, {
  BookServerUploaderRef,
} from "./components/Editors/BookServerUploader";

type ChallengeProps = {
  uid: string;
  guidePath: string;
  codePath: string;
  fetcher: IBookFetcher;
  progressStorage: ProgressStorage;
  bookNode: BookNodeModel;
  title?: string;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
  onBookUploaded?: (file: File, uploadType: BookUploadType) => void;
  canReloadBook?: boolean;
  onBookReloadRequested: () => void;

  isEditing?: boolean;
  store?: EditableBookStore;
};

const Challenge = (props: ChallengeProps) => {
  const nodeTyp: ChallengeTypes = useMemo(
    () =>
      props.bookNode.typ
        ? ChallengeTypes[props.bookNode.typ]
        : ChallengeTypes.py,
    [props.bookNode.typ]
  );

  const canSubmit = useMemo(
    () =>
      (!props.bookNode.isExample &&
        ((!!props.bookNode.tests && props.bookNode.tests.length > 0) ||
          nodeTyp === "parsons")) ||
      !!props.bookNode.isAssessment,
    [props.bookNode, nodeTyp]
  );

  const canVerifySolutions = useMemo(
    () => (!!props.bookNode.sol && props.isEditing) || false,
    [props.bookNode.sol, props.isEditing]
  );

  /// state

  const [editorFullScreen, setEditorFullScreen] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResults>([]);
  const [comment, setComment] = useState<string | undefined>(undefined);
  const [typ, setTyp] = useState<ChallengeTypes>(ChallengeTypes.py);
  const [usesFixedInput, setUsesFixedInput] = useState<boolean>(false);

  // states related to UI
  const [isGuideMinimised, setGuideMinimised] = useState<boolean>(false);
  const [showBookUpload, setShowBookUpload] = useState<boolean>(false);
  const [turtleExampleRendered, setTurtleExampleRendered] = useState<
    string | undefined
  >(undefined);

  // states related to editing only
  const [hasEdited, setHasEdited] = useState<boolean>(false);
  const [isEditingGuide, setIsEditingGuide] = useState<boolean>(false);
  const [saveDialogProps, setSaveDialogProps] = useState<
    SaveDialogProps | undefined
  >(undefined);

  const watches = useRef<string[]>([]);

  /// references to sub-components
  const pyEditorRef = useRef<PyEditorHandle | null>(null);
  const parsonsEditorRef = useRef<ParsonsEditorHandle | null>(null);
  const outputsRef = useRef<ChallengeOutputsHandle | null>(null);
  const fileReader = useRef<FileReader | null>(null);
  const guideRef = useRef<ChallengeGuideRef | null>(null);

  const notificationContext = useContext(NotificationsContext);

  const mainAllotmentRef = useRef<AllotmentHandle | null>(null);
  const leftHandSideAllotmentRef = useRef<AllotmentHandle | null>(null);
  const leftHandSideAllotmentIsResizingRef = useRef<boolean>(false);
  const leftHandSideAllotmentSizesInDebugRef = useRef<[number, number] | null>(
    null
  );
  const leftHandSideAllotmentSizesNotInDebugRef = useRef<
    [number, number] | null
  >(null);

  // state related to session files
  const [sessionFiles, setSessionFiles] = useState<SessionFile[]>([]);

  const currentProgressStorageRef = useRef<ProgressStorage | null>(null);
  useEffect(() => {
    currentProgressStorageRef.current = props.progressStorage;
  }, [props.progressStorage]);

  const currentTestResultsRef = useRef<TestResults | null>(null);
  useEffect(() => {
    currentTestResultsRef.current = testResults;
  }, [testResults]);

  const currentTestResultNodeIddRef = useRef<string | null>(null);

  /// hooks
  const codeRunner = useCodeRunner({
    enabled: true,
    onDraw: async (commands) => {
      if (codeRunner.state !== CodeRunnerState.READY) {
        if (typ !== ChallengeTypes.canvas) {
          if (commands.length === 1 && commands[0]?.action === "reset") {
            //ignore single initial reset if we are meant to be a standard
            // Python challenge
            return;
          }
          setTyp(ChallengeTypes.canvas);
        }
        outputsRef.current?.focusPane("canvas");
        await outputsRef.current?.awaitCanvas();
        outputsRef.current?.getCanvas()?.runCommand(commands);
      }
    },
    awaitCanvas: async () => {
      if (typ !== ChallengeTypes.canvas) {
        setTyp(ChallengeTypes.canvas);
      }
      if (outputsRef.current) {
        await outputsRef.current.awaitCanvas();
      }
    },
    turtleReset: (virtual: boolean) =>
      outputsRef.current?.getCanvas()?.turtleReset(virtual),
    onTurtle: async (id, msg) => {
      if (codeRunner.state !== CodeRunnerState.READY) {
        if (typ !== ChallengeTypes.canvas) {
          if (msg === '{"action": "stop"}') {
            return;
          }
          setTyp(ChallengeTypes.canvas);
        }
        outputsRef.current?.focusPane("canvas");
        await outputsRef.current?.awaitCanvas();
        let res = await outputsRef.current
          ?.getCanvas()
          ?.runTurtleCommand(id, msg);
        return res || undefined;
      }
      return undefined;
    },
    onAudio: (msg) => {
      if (codeRunner.state !== CodeRunnerState.READY) {
        outputsRef.current?.getAudioPlayer()?.runAudioCommand(msg);
      }
    },
  });

  const {
    guideMd,
    savedCode,
    starterCode,
    additionalFilesLoaded,
    forceReload,
    isLoadingGuide,
    isLoadingCode,
    solutionFile,
  } = useChallengeLoader({
    fetcher: props.fetcher,
    guidePath: props.guidePath,
    codePath: props.codePath,
    additionalFiles: props.bookNode.additionalFiles || [],
    typ: nodeTyp,
    uid: props.uid,
    store: props.store || null,
    isEditing: props.isEditing,
    solution: props.bookNode.sol,
  });

  const onReportResult = useCallback(
    (results: TestResults, code: string, bookNode: BookNodeModel) => {
      setTestResults(results);
      currentTestResultsRef.current = results;
      currentTestResultNodeIddRef.current = bookNode.id;
      let newTestOutcome =
        results.length === 0
          ? undefined
          : results.filter((x) => x.outcome !== true).length === 0;

      currentProgressStorageRef.current?.setResult(
        bookNode,
        newTestOutcome,
        code,
        bookNode.isLong
      );
    },
    []
  );

  const getVisibilityWithHack = (visible: boolean) => {
    // allotment seems to dislike visibility=true during load time
    return codeRunner.state === CodeRunnerState.LOADING ? undefined : visible;
  };

  // node tells us that typ has changed
  useEffect(() => {
    setTyp(nodeTyp);
  }, [nodeTyp]);

  // when the book node changes
  useEffect(() => {
    // stop runner
    if (codeRunner.state > CodeRunnerState.READY) {
      codeRunner.kill?.();
      codeRunner.clear?.();
    }
    setTurtleExampleRendered(undefined);
    setHasEdited(false);

    // eslint-disable-next-line
  }, [props.uid, props.bookNode]);

  // results changed
  useEffect(() => {
    if (
      props.isEditing &&
      currentTestResultNodeIddRef.current === props.bookNode.id
    ) {
      return;
    }

    let testRes = props.bookNode
      ? props.progressStorage.getResult(props.bookNode)
      : undefined;
    setTestResults(testRes === undefined ? [] : [{ outcome: testRes }]);
    currentTestResultNodeIddRef.current = props.bookNode.id;
    let comment = props.bookNode
      ? props.progressStorage.allTestResults.comments.get(props.bookNode.id)
      : undefined;
    setComment(comment);
    // TODO: consider re-loading the code file if a result is present and not change has been made so far
  }, [props.bookNode, props.progressStorage, props.isEditing]);

  // run state
  useEffect(() => {
    pyEditorRef.current?.updateEditorDecorations();
    if (
      codeRunner.state === CodeRunnerState.READY &&
      leftHandSideAllotmentSizesNotInDebugRef.current
    ) {
      leftHandSideAllotmentRef.current?.resize(
        leftHandSideAllotmentSizesNotInDebugRef.current
      );
    }
    if (
      codeRunner.state === CodeRunnerState.AWAITING_INPUT ||
      CodeRunnerState.READY
    ) {
      outputsRef.current?.focusPane("console");
    }
  }, [codeRunner.state]);

  const makeDebugSetup = useCallback(() => {
    return {
      breakpoints: pyEditorRef.current?.getBreakpoints() || [],
      watches: watches.current,
    };
  }, []);

  // editor->server upload
  const bookServerUploaderRef = useRef<BookServerUploaderRef | null>(null);

  // accepting actions from child nodes
  // actions interface; cached, so the
  // challenge context can be passed down without frequent re-renders
  // this is OK, as actions are just callbacks, no state transferred
  const actions = useMemo(() => {
    return {
      debug: (mode: "debug" | "run" = "debug") => {
        if (leftHandSideAllotmentSizesInDebugRef.current) {
          leftHandSideAllotmentRef.current?.resize(
            leftHandSideAllotmentSizesInDebugRef.current
          );
        }
        if (nodeTyp === ChallengeTypes.parsons && !props.isEditing) {
          let code = parsonsEditorRef.current?.getValue();
          if (code) {
            codeRunner.debug(
              code,
              mode,
              { breakpoints: [], watches: [] },
              props.bookNode?.additionalFiles || [],
              additionalFilesLoaded,
              usesFixedInput ? outputsRef.current?.getFixedInputs() : undefined,
              sessionFiles,
              props.bookNode.isSessionFilesAllowed
            );
          }
        } else {
          const code = pyEditorRef.current?.getValue();
          const bookNode = props.bookNode;
          if (code || code === "") {
            actions["save-code"](code);
            codeRunner
              .debug(
                code,
                mode,
                makeDebugSetup(),
                props.bookNode?.additionalFiles || [],
                additionalFilesLoaded,
                usesFixedInput
                  ? outputsRef.current?.getFixedInputs()
                  : undefined,
                sessionFiles,
                props.bookNode.isSessionFilesAllowed
              )
              .then((data) => {
                if (props.bookNode?.isExample) {
                  onReportResult([{ outcome: true }], code, bookNode);
                }
                outputsRef.current?.getCanvas()?.runTurtleClearup();
                for (const file of data.updatedSessionFiles) {
                  if (!file.filename.startsWith("session/")) {
                    continue;
                  }
                  const filename = file.filename.substring("session/".length);
                  // remove if already exists
                  const index = sessionFiles.findIndex(
                    (f) => f.filename === filename
                  );
                  if (index >= 0) {
                    sessionFiles.splice(index, 1);
                  }
                  // add new file
                  sessionFiles.push({
                    ...file,
                    filename: filename,
                  });
                }
                actions["has-changed-session-files"]();
              });
          }
        }
      },
      test: () => {
        if (!props.bookNode) return;
        if (nodeTyp === "parsons" && !props.isEditing) {
          const newResults = parsonsEditorRef.current?.runTests() || [];
          const code = parsonsEditorRef.current?.getValue() || "";
          const bookNode = props.bookNode;
          onReportResult(newResults, code, bookNode);
        } else {
          const code = pyEditorRef.current?.getValue();
          const tests = props.bookNode.tests || [];
          const bookNode = props.bookNode;
          if (code && props.bookNode.isAssessment) {
            onReportResult([{ outcome: true }], code, bookNode);
            actions["save-code"](code);
          } else if (code && tests) {
            actions["save-code"](code);
            codeRunner
              ?.test(
                code,
                tests,
                props.bookNode?.additionalFiles || [],
                additionalFilesLoaded,
                props.bookNode,
                sessionFiles,
                props.bookNode.isSessionFilesAllowed
              )
              .then((results) => {
                onReportResult(results.results, results.code, results.bookNode);
              });
          }
        }
      },
      "verify-solutions": () => {
        if (!props.bookNode) return;
        const code = outputsRef.current
          ?.getSolutionFileEditor()
          ?.getSolutionValue();
        if (!code) return;
        const tests = props.bookNode.tests || [];
        if (!code || !tests) return;
        codeRunner
          ?.test(
            code,
            tests,
            props.bookNode?.additionalFiles || [],
            additionalFilesLoaded,
            props.bookNode,
            sessionFiles,
            props.bookNode.isSessionFilesAllowed
          )
          .then((results) => {
            onReportResult(results.results, results.code, results.bookNode);
          });
      },
      "input-entered": (input: string | null) => {
        const inputStr = input == null ? "" : input;
        codeRunner?.input(inputStr, makeDebugSetup());
      },
      kill: () => codeRunner?.kill(),
      step: () => codeRunner?.step(makeDebugSetup()),
      continue: () => codeRunner?.continue(makeDebugSetup()),
      "breakpoints-updated": () => {},
      "reset-code": () => {
        if (nodeTyp === "parsons") {
          parsonsEditorRef.current?.reset();
          return;
        }
        if ((starterCode === "" || starterCode) && pyEditorRef.current) {
          pyEditorRef.current.setValue(starterCode);
        }
        notificationContext.addMessage("Code reset", "info");
      },
      "save-code": (code: string) => {
        if ((code || code === "") && props.uid) {
          localStorage.setItem("code-" + encodeURIComponent(props.uid), code);
        }
      },
      "download-code": () => pyEditorRef.current?.download(),
      "handle-file-read": () => {
        if (fileReader.current?.result) {
          pyEditorRef.current?.setValue(fileReader.current.result.toString());
          fileReader.current = null;
        }
      },
      "handle-code-upload": (file: File) => {
        fileReader.current = new FileReader();
        fileReader.current.onloadend = actions["handle-file-read"];
        fileReader.current.readAsText(file);
      },
      "canvas-keydown": (data: React.KeyboardEvent) =>
        codeRunner?.keyDown(data),
      "canvas-keyup": (data: React.KeyboardEvent) => codeRunner?.keyUp(data),
      "hide-turtle": () => {
        if (typ === ChallengeTypes.canvas) {
          setTyp(nodeTyp);
          codeRunner.addConsoleText(
            "Hiding turtle. Did you forget to call turtle.done()?"
          );
        }
      },
      "draw-turtle-example": () => {
        codeRunner
          .drawTurtleExample(additionalFilesLoaded, props.bookNode)
          .then((id: string) => {
            outputsRef.current?.focusPane("console");
            if (props.bookNode.id !== id) return; // ignore old
            outputsRef.current
              ?.getCanvas()
              ?.runTurtleCommand(-1, '{"action": "dump"}')
              .then((turtleResult) => {
                setTurtleExampleRendered(turtleResult || undefined);
              });
          })
          .catch(() => setTurtleExampleRendered(undefined));
      },
      "install-dependencies": (deps: string[]) => {
        codeRunner?.installDependencies(deps);
      },
      reload: () => {
        forceReload();
        props.onBookReloadRequested();
      },
      "has-made-edit": () => setHasEdited(true),
      "has-changed-session-files": () => {
        setSessionFiles([...sessionFiles]); // trigger UI update
      },
      "save-node": () => {
        const changed = saveNode(
          props.bookNode,
          props.store,
          pyEditorRef.current?.getValue(),
          guideRef.current?.getValue(),
          outputsRef.current?.getBookNodeEditor()?.getValue(),
          additionalFilesLoaded,
          outputsRef.current?.getVisibleFileContents(),
          outputsRef.current?.getSolutionFileEditor()?.getSolutionObject(),
          outputsRef.current?.getSolutionFileEditor()?.getSolutionValue()
        );
        forceReload();
        setHasEdited(false);
        if (changed) {
          props.onBookReloadRequested();
        }
      },
      "save-book": (book: string) => {
        props.store?.store.saveBook(book);
        forceReload();
        setHasEdited(false);
        props.onBookReloadRequested();
      },
    };
  }, [
    additionalFilesLoaded,
    forceReload,
    makeDebugSetup,
    nodeTyp,
    props,
    codeRunner,
    onReportResult,
    starterCode,
    solutionFile,
    usesFixedInput,
    typ,
    sessionFiles,
    notificationContext,
  ]);
  const actionsRef = useRef<Actions>(actions);
  const context = useMemo(() => {
    return {
      actions: wrapActions(actionsRef),
      isEditing: props.isEditing || false,
    };
  }, [actionsRef, props.isEditing]);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  // save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!props.isEditing) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // stop browser "Save page"
        actionsRef.current?.["save-node"]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const callWithSaveCheck = useCallback(
    (action: (() => void) | undefined) => {
      if (!action) return;
      if (!hasEdited || !props.isEditing) {
        action();
        return;
      }
      setSaveDialogProps({
        open: true,
        onSave: () => {
          context.actions["save-node"]();
          action();
          setSaveDialogProps(undefined);
        },
        onClose: () => {
          action();
          setSaveDialogProps(undefined);
        },
      });
    },
    [hasEdited, props.isEditing, context]
  );

  return (
    <>
      <GuideToggleFab
        isGuideMinimised={isGuideMinimised}
        onGuideDisplayToggle={() => setGuideMinimised((x) => !x)}
      />
      {showBookUpload && props.onBookUploaded ? (
        <BookUploadModal
          visible={true}
          onClose={() => setShowBookUpload(false)}
          onBookUploaded={props.onBookUploaded}
        />
      ) : null}

      <ChallengeContext.Provider value={context}>
        <Paper
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
            flexDirection: "row",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              overflow: "hidden",
              flexDirection: "column",
            }}
          >
            <Header
              canReloadBook={props.canReloadBook || false}
              title={props.title || props.bookNode?.name || ""}
              bookNode={props.bookNode}
              usesFixedInput={usesFixedInput}
              onSetUsesFixedInput={setUsesFixedInput}
              onSetShowBookUpload={
                props.onBookUploaded ? setShowBookUpload : undefined
              }
              codeRunner={codeRunner}
              isEditing={props.isEditing || false}
              hasEdited={hasEdited}
              isEditingGuide={isEditingGuide}
              onEditingGuideChange={(editing) => {
                setIsEditingGuide(editing);
                setHasEdited((x) => x || editing);
                if (editing) {
                  mainAllotmentRef.current?.resize([300, 700]);
                } else {
                  mainAllotmentRef.current?.resize([650, 350]);
                }
              }}
              bookFetcher={props.fetcher}
              canRunOnly={nodeTyp === "parsons" && !props.isEditing}
              canSubmit={canSubmit}
              canVerifySolutions={canVerifySolutions}
              testResults={testResults}
              isAssessment={!!props.bookNode.isAssessment}
              onBookUploadToServer={() => {
                bookServerUploaderRef.current?.showDialog(props.fetcher);
              }}
            />
            <Allotment
              className="h-100"
              defaultSizes={[650, 350]}
              ref={mainAllotmentRef}
            >
              <Allotment.Pane>
                <Allotment
                  vertical
                  defaultSizes={[650, 350]}
                  onDragStart={() => {
                    leftHandSideAllotmentIsResizingRef.current = true;
                  }}
                  onDragEnd={() => {
                    leftHandSideAllotmentIsResizingRef.current = false;
                  }}
                  ref={leftHandSideAllotmentRef}
                  onChange={(sizes) => {
                    if (!leftHandSideAllotmentIsResizingRef.current) return;
                    if (
                      codeRunner.state ===
                        CodeRunnerState.RUNNING_WITH_DEBUGGER ||
                      codeRunner.state === CodeRunnerState.ON_BREAKPOINT ||
                      codeRunner.state === CodeRunnerState.AWAITING_INPUT
                    ) {
                      leftHandSideAllotmentSizesInDebugRef.current = sizes as [
                        number,
                        number
                      ];
                    } else {
                      leftHandSideAllotmentSizesNotInDebugRef.current =
                        sizes as [number, number];
                    }
                  }}
                >
                  <Allotment.Pane>
                    {props.isEditing && !props.bookNode?.py ? (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {props.bookNode?.guide ? (
                          <span>
                            This page is guide-only; it does not have a Python
                            file.
                          </span>
                        ) : (
                          <span>
                            This page is just a section header; it does not have
                            a Python file.
                          </span>
                        )}
                      </Box>
                    ) : (
                      <MainEditor
                        parsonsEditorRef={parsonsEditorRef}
                        typ={nodeTyp}
                        savedCode={savedCode}
                        starterCode={starterCode}
                        pyEditorRef={pyEditorRef}
                        onToggleFullScreen={() => {
                          console.log("toggle full screen", editorFullScreen);
                          setEditorFullScreen((x) => !x);
                        }}
                        codeRunner={codeRunner}
                        isLoading={isLoadingCode}
                      />
                    )}
                  </Allotment.Pane>
                  <Allotment.Pane
                    visible={getVisibilityWithHack(!editorFullScreen)}
                    maxSize={750}
                    minSize={150}
                  >
                    {!props.bookNode.guide || !props.bookNode.py ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        {!props.bookNode.guide ? (
                          <span>
                            This page is guide-only; you can edit its title in
                            the book drawer on the right.
                          </span>
                        ) : (
                          <span>
                            This page is just a section header; you can edit its
                            title in the book drawer on the right.
                          </span>
                        )}
                      </Box>
                    ) : (
                      <ChallengeOutputs
                        ref={outputsRef}
                        typ={typ}
                        codeRunner={codeRunner}
                        usesFixedInput={usesFixedInput}
                        additionalFiles={props.bookNode.additionalFiles || []}
                        additionalFilesLoaded={additionalFilesLoaded}
                        bookNode={props.bookNode}
                        bookStore={props.store}
                        isSessionFilesAllowed={
                          props.bookNode.isSessionFilesAllowed
                        }
                        sessionFiles={sessionFiles}
                        solutionFile={solutionFile}
                        guideMd={props.isEditing ? guideMd : undefined}
                        starterCode={props.isEditing ? starterCode : undefined}
                        hasEdited={hasEdited}
                      />
                    )}
                  </Allotment.Pane>
                </Allotment>
              </Allotment.Pane>
              <Allotment.Pane
                visible={getVisibilityWithHack(
                  !editorFullScreen && !isGuideMinimised
                )}
              >
                <Allotment vertical className="challenge__right-pane">
                  <Box
                    sx={{
                      paddingLeft: 2,
                      paddingRight: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {isGuideMinimised ? null : !props.bookNode.guide ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        This page is just a section header; it does not have a
                        guide text.
                      </Box>
                    ) : (
                      <ChallengeGuide
                        ref={guideRef}
                        challengeId={props.bookNode.id}
                        initialMd={guideMd || ""}
                        turtleExampleImage={turtleExampleRendered}
                        isEditing={isEditingGuide}
                        comment={comment}
                        isLoading={isLoadingGuide}
                      />
                    )}
                    <BookControlFabs
                      hasEdited={hasEdited}
                      onNavigateToPrevPage={() =>
                        callWithSaveCheck(props.onRequestPreviousChallenge)
                      }
                      onNavigateToNextPage={() =>
                        callWithSaveCheck(props.onRequestNextChallenge)
                      }
                      onOpenMenu={() => {
                        props.openBookDrawer?.(true);
                      }}
                      onSave={
                        props.isEditing ? actions["save-node"] : undefined
                      }
                      onUploadToServer={
                        props.isEditing
                          ? () => {
                              bookServerUploaderRef.current?.showDialog(
                                props.fetcher
                              );
                            }
                          : undefined
                      }
                    />
                  </Box>
                  <Allotment.Pane
                    maxSize={350}
                    minSize={150}
                    snap={true}
                    visible={
                      codeRunner.state ===
                        CodeRunnerState.RUNNING_WITH_DEBUGGER ||
                      codeRunner.state === CodeRunnerState.ON_BREAKPOINT ||
                      codeRunner.state === CodeRunnerState.AWAITING_INPUT
                    }
                    className="debug-pane"
                  >
                    <DebugPane
                      codeRunner={codeRunner}
                      OnWatchAdd={(n) => {
                        watches.current?.push(n);
                        codeRunner.refreshDebugContext(makeDebugSetup());
                      }}
                      OnWatchRemove={(n) => {
                        watches.current = watches.current.filter(
                          (x) => x !== n
                        );
                        codeRunner.refreshDebugContext(makeDebugSetup());
                      }}
                    />
                  </Allotment.Pane>
                </Allotment>
              </Allotment.Pane>
            </Allotment>
          </Box>
        </Paper>
        <SaveDialog
          open={saveDialogProps ? true : false}
          onSave={saveDialogProps?.onSave || (() => {})}
          onClose={saveDialogProps?.onClose || (() => {})}
          message="You might have unsaved changes on this page. Would you like to save first?"
          cancelText="Don't save"
        />
        {props.isEditing && <BookServerUploader ref={bookServerUploaderRef} />}
      </ChallengeContext.Provider>
    </>
  );
};

export default Challenge;
