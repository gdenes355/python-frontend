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
import { Card, CardContent, Paper } from "@mui/material";
import { Box } from "@mui/system";

import { Allotment } from "allotment";
import "allotment/dist/style.css";

import BookControlFabs from "../book/components/BookControlFabs";
import DebugPane from "./components/Debug/DebugPane";
import MainControls from "./components/Guide/MainControls";
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
  onBookUploaded?: (file: File, edit: boolean) => void;
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

  /// state

  const [editorFullScreen, setEditorFullScreen] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResults>([]);
  const [comment, setComment] = useState<string | undefined>(undefined);
  const [guideMinimised, setGuideMinimised] = useState<boolean>(false);
  const [typ, setTyp] = useState<ChallengeTypes>(ChallengeTypes.py);
  const [usesFixedInput, setUsesFixedInput] = useState<boolean>(false);
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

  /// hooks
  const codeRunner = useCodeRunner({
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
  } = useChallengeLoader({
    fetcher: props.fetcher,
    guidePath: props.guidePath,
    codePath: props.codePath,
    additionalFiles: props.bookNode.additionalFiles || [],
    typ: nodeTyp,
    uid: props.uid,
    store: props.store || null,
    isEditing: props.isEditing,
  });

  const onReportResult = useCallback(
    (results: TestResults, code: string, bookNode: BookNodeModel) => {
      setTestResults(results);
      let newTestOutcome =
        results.length === 0
          ? undefined
          : results.filter((x) => x.outcome !== true).length === 0;

      props.progressStorage?.setResult(
        bookNode,
        newTestOutcome,
        code,
        bookNode.isLong
      );
    },
    [props.progressStorage]
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
    let testRes = props.bookNode
      ? props.progressStorage.getResult(props.bookNode)
      : undefined;
    setTestResults(testRes === undefined ? [] : [{ outcome: testRes }]);
    let comment = props.bookNode
      ? props.progressStorage.allTestResults.comments.get(props.bookNode.id)
      : undefined;
    setComment(comment);
    // TODO: consider re-loading the code file if a result is present and not change has been made so far
  }, [props.bookNode, props.progressStorage]);

  // run state
  useEffect(() => {
    pyEditorRef.current?.updateEditorDecorations();
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

  // accepting actions from child nodes
  // actions interface; cached, so the
  // challenge context can be passed down without frequent re-renders
  // this is OK, as actions are just callbacks, no state transferred
  const actions = useMemo(() => {
    return {
      debug: (mode: "debug" | "run" = "debug") => {
        if (nodeTyp === ChallengeTypes.parsons && !props.isEditing) {
          let code = parsonsEditorRef.current?.getValue();
          if (code) {
            codeRunner.debug(
              code,
              mode,
              { breakpoints: [], watches: [] },
              props.bookNode?.additionalFiles || [],
              additionalFilesLoaded,
              usesFixedInput ? outputsRef.current?.getFixedInputs() : undefined
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
                  : undefined
              )
              .then((result) => {
                if (props.bookNode?.isExample) {
                  onReportResult([{ outcome: true }], code, bookNode);
                }
                outputsRef.current?.getCanvas()?.runTurtleClearup();
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
                props.bookNode
              )
              .then((results) => {
                onReportResult(results.results, results.code, results.bookNode);
              });
          }
        }
      },
      "input-entered": (input: string | null) => {
        let inputStr = input == null ? "" : input;
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
      "handle-file-read": (e: ProgressEvent<FileReader>) => {
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
      reload: () => {
        forceReload();
        props.onBookReloadRequested();
      },
      "has-made-edit": () => setHasEdited(true),
      "has-changed-session-files": () => {
        console.log("session files changed");
      },
      "save-node": () => {
        const changed = saveNode(
          props.bookNode,
          props.store,
          pyEditorRef.current?.getValue(),
          guideRef.current?.getValue(),
          outputsRef.current?.getBookNodeEditor()?.getValue(),
          additionalFilesLoaded,
          outputsRef.current?.getVisibleFileContents()
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
    usesFixedInput,
    typ,
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
              hasEdited={hasEdited}
              isEditingGuide={isEditingGuide}
              onEditingGuideChange={(editing) => {
                setIsEditingGuide(editing);
                setHasEdited((x) => x || editing);
              }}
              bookFetcher={props.fetcher}
            />
            <Allotment className="h-100" defaultSizes={[650, 350]}>
              <Allotment.Pane>
                <Allotment vertical defaultSizes={[650, 350]}>
                  <Allotment.Pane>
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
                    />
                  </Allotment.Pane>
                  <Allotment.Pane
                    visible={getVisibilityWithHack(!editorFullScreen)}
                    maxSize={750}
                    minSize={150}
                  >
                    <ChallengeOutputs
                      ref={outputsRef}
                      typ={typ}
                      codeRunner={codeRunner}
                      usesFixedInput={usesFixedInput}
                      additionalFiles={props.bookNode.additionalFiles || []}
                      additionalFilesLoaded={additionalFilesLoaded}
                      bookNode={props.bookNode}
                      bookStore={props.store}
                    />
                  </Allotment.Pane>
                </Allotment>
              </Allotment.Pane>
              <Allotment.Pane
                visible={getVisibilityWithHack(
                  !editorFullScreen && !guideMinimised
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
                    <Card sx={{ overflow: "visible" }}>
                      <CardContent>
                        <MainControls
                          guideMinimised={guideMinimised}
                          onGuideDisplayToggle={() =>
                            setGuideMinimised((x) => !x)
                          }
                          canDebug={codeRunner.state === CodeRunnerState.READY}
                          canRunOnly={nodeTyp === "parsons" && !props.isEditing}
                          canSubmit={canSubmit}
                          testResults={testResults}
                          canKill={codeRunner.state === CodeRunnerState.RUNNING}
                          isAssessment={!!props.bookNode.isAssessment}
                        />
                      </CardContent>
                    </Card>
                    {guideMinimised ? null : (
                      <ChallengeGuide
                        ref={guideRef}
                        challengeId={props.bookNode.id}
                        initialMd={guideMd || ""}
                        turtleExampleImage={turtleExampleRendered}
                        isEditing={isEditingGuide}
                        comment={comment}
                      />
                    )}
                    <BookControlFabs
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
          <Box>
            {!guideMinimised ? undefined : (
              <div>
                <Card sx={{ overflow: "visible" }}>
                  <CardContent>
                    <MainControls
                      guideMinimised={guideMinimised}
                      onGuideDisplayToggle={() => setGuideMinimised((x) => !x)}
                      canDebug={codeRunner.state === CodeRunnerState.READY}
                      canRunOnly={nodeTyp === "parsons" && !props.isEditing}
                      canSubmit={canSubmit}
                      testResults={testResults}
                      canKill={codeRunner.state === CodeRunnerState.RUNNING}
                      isAssessment={!!props.bookNode.isAssessment}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </Box>
        </Paper>
        <SaveDialog
          open={saveDialogProps ? true : false}
          onSave={saveDialogProps?.onSave || (() => {})}
          onClose={saveDialogProps?.onClose || (() => {})}
          message="You might have unsaved changes on this page. Would you like to save first?"
          cancelText="Don't save"
        />
      </ChallengeContext.Provider>
    </>
  );
};

export default Challenge;
