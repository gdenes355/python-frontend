import React, { useCallback, useEffect, useRef, useState } from "react";
import { emptyDebugContext } from "../coderunner/DebugContext";
import { TestCases, TestResults } from "../models/Tests";
import ChallengeTypes from "../models/ChallengeTypes";
import IBookFetcher from "../book/utils/IBookFetcher";
import { SessionContextType } from "../auth/SessionContext";
import { ProgressStorage } from "../book/utils/ProgressStorage";
import BookNodeModel from "../models/BookNodeModel";
import PyEditor, { PyEditorHandle } from "./components/Editors/PyEditor";
import ParsonsEditor, {
  ParsonsEditorHandle,
} from "./components/Editors/ParsonsEditor";
import FixedInputField, {
  FixedInputFieldHandle,
} from "./components/FixedInputField";
import Outputs, { OutputsHandle } from "./components/Outputs";
import useCodeRunner, { CodeRunnerState } from "../coderunner/useCodeRunner";
import Guide from "../components/Guide";
import BookUploadModal from "../book/components/BookUploadModal";
import { Card, CardContent, Grid, IconButton, Paper } from "@mui/material";
import { Box } from "@mui/system";
import HeaderBar from "../components/HeaderBar";
import HeaderMenu from "./components/HeaderMenu";

import CachedIcon from "@mui/icons-material/Cached";
import SessionWsStateIndicator from "../auth/components/SessionWsStateIndicator";
import HeaderButtons from "./components/HeaderButtons";
import { Allotment } from "allotment";
import PaneType from "../models/PaneType";
import ChallengeConsole from "./components/ChallengeConsole";
import CanvasDisplay, {
  CanvasDisplayHandle,
} from "./components/CanvasDisplay/CanvasDisplay";
import AdditionalFileView from "./components/Editors/AdditionalFileView";
import BookControlFabs from "../book/components/BookControlFabs";
import DebugPane from "../components/DebugPane";
import MainControls from "./components/MainControls";
import ChallengeContext, { ChallengeContextClass2 } from "./ChallengeContext";
import useChallengeLoader from "./useChallengeLoader";
import "./Challenge.css";
import { resolve } from "path";

type ChallengeProps = {
  uid: string;
  guidePath: string;
  codePath: string;
  fetcher: IBookFetcher;
  typ?: ChallengeTypes;
  authContext: SessionContextType;
  progressStorage: ProgressStorage;
  bookNode: BookNodeModel;
  title?: string;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
  onBookUploaded: (file: File, edit: boolean) => void;
  canReloadBook?: boolean;
  onBookReloadRequested: () => void;
};

const Challenge2 = (props: ChallengeProps) => {
  /// state

  const [editorFullScreen, setEditorFullScreen] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResults>([]);
  const [testsPassing, setTestsPassing] = useState<boolean | undefined>(
    undefined
  );
  const [guideMinimised, setGuideMinimised] = useState<boolean>(false);
  const [typ, setTyp] = useState<string>(ChallengeTypes.py);
  const [origType, setOrigType] = useState<ChallengeTypes>(ChallengeTypes.py);
  const [usesFixedInput, setUsesFixedInput] = useState<boolean>(false);
  const [showBookUpload, setShowBookUpload] = useState<boolean>(false);

  const [turtleExampleRendered, setTurtleExampleRendered] = useState<
    string | undefined
  >(undefined);

  // canvas
  const canvasPromiseResolve = useRef<((value: any) => void) | null>(null);

  /// references to sub-components
  const editorRef = useRef<PyEditorHandle | null>(null);
  const parsonsEditorRef = useRef<ParsonsEditorHandle | null>(null);
  const canvasDisplayRef = useRef<CanvasDisplayHandle | null>(null);
  const fixedInputFieldRef = useRef<FixedInputFieldHandle | null>(null);
  const outputsRef = useRef<OutputsHandle | null>(null);

  const awaitCanvas = () => {
    return new Promise<void>((resolve) => {
      if (typ !== ChallengeTypes.canvas) {
        setTyp(ChallengeTypes.canvas);
      }
      if (canvasDisplayRef.current) {
        resolve();
        return;
      }

      if (!!canvasPromiseResolve.current) {
        console.log("awaitCanvas called twice");
      }
      canvasPromiseResolve.current = resolve;
    });
  };

  /// hooks
  const codeRunner = useCodeRunner({
    onDraw: async (commands) => {
      if (codeRunner.state !== CodeRunnerState.READY) {
        if (origType === ChallengeTypes.py) {
          if (commands.length === 1 && commands[0]?.action === "reset") {
            //ignore single initial reset if we are meant to be a standard
            // Python challenge
            return;
          }
          setTyp(ChallengeTypes.canvas);
        }
        outputsRef.current?.focusPane("canvas");
        canvasDisplayRef.current?.runCommand(commands);
      }
    },
    awaitCanvas,
    turtleReset: canvasDisplayRef.current?.turtleReset,
    onTurtle: async (id, msg) => {
      if (codeRunner.state !== CodeRunnerState.READY) {
        if (origType === ChallengeTypes.py) {
          setTyp(ChallengeTypes.canvas);
        }
        outputsRef.current?.focusPane("canvas");
        await awaitCanvas();
        let res = await canvasDisplayRef.current?.runTurtleCommand(id, msg);
        return res || undefined;
      }
      return undefined;
    },
  });
  const { guideMd, savedCode, starterCode, additionalFilesLoaded } =
    useChallengeLoader({
      fetcher: props.fetcher,
      guidePath: props.guidePath,
      codePath: props.codePath,
      additionalFiles: props.bookNode.additionalFiles || [],
      typ: props.typ || ChallengeTypes.py,
      uid: props.uid,
      store: null,
    });

  const onReportResult = useCallback(
    (results: TestResults, code: string, bookNode: BookNodeModel) => {
      setTestResults(results);
      let newTestOutcome =
        results.length === 0
          ? undefined
          : results.filter((x) => x.outcome !== true).length === 0;

      props.progressStorage?.setResult(bookNode, newTestOutcome, code);
    },
    [props.progressStorage]
  );

  const canvasMountedCallback = () => {
    if (canvasPromiseResolve.current) {
      const local = canvasPromiseResolve.current;
      canvasPromiseResolve.current = null;
      if (local) local(true);
    }
  };

  const getVisibilityWithHack = (visible: boolean) => {
    // allotment seems to dislike visibility=true during load time
    return codeRunner.state === CodeRunnerState.LOADING ? undefined : visible;
  };

  const Header = () => {
    return (
      <HeaderBar
        title={`${props.title ? props.title + " \u203A " : ""}  ${
          props.bookNode?.name
        }`}
        menuItems={
          <HeaderMenu
            onUsingFixedInputChange={(fixedInput) =>
              setUsesFixedInput(fixedInput)
            }
            usingFixedInput={usesFixedInput}
            onBookUpload={() => {
              setShowBookUpload(true);
            }}
          />
        }
      >
        {props.canReloadBook ? (
          <Grid item>
            <IconButton
              onClick={() => {
                // TODO:
                // fetch guide
                //this.chContext.actions["fetch-code"](true);
                props.onBookReloadRequested();
              }}
            >
              <CachedIcon />
            </IconButton>
          </Grid>
        ) : undefined}
        {props.authContext.token ? (
          <Grid item>
            <SessionWsStateIndicator />
          </Grid>
        ) : undefined}
        <HeaderButtons canReset={codeRunner.state === CodeRunnerState.READY} />
      </HeaderBar>
    );
  };

  const chContext = useRef<ChallengeContextClass2>(
    new ChallengeContextClass2()
  );

  /// Link with controller context
  useEffect(() => {
    chContext.current.codeRunnerRef = codeRunner;
    chContext.current.pyEditorRef = editorRef.current;
    chContext.current.parsonsEditorRef = parsonsEditorRef.current;
    chContext.current.canvasRef = canvasDisplayRef.current;
    chContext.current.starterCode = starterCode;
    chContext.current.fixedInputFieldRef = fixedInputFieldRef.current;
  }, [
    codeRunner,
    editorRef,
    parsonsEditorRef,
    canvasDisplayRef,
    starterCode,
    fixedInputFieldRef,
  ]);

  // updates

  useEffect(() => {
    chContext.current.onReportResult = onReportResult;
  }, [onReportResult]);

  useEffect(() => {
    chContext.current.additionalFilesLoaded = additionalFilesLoaded;
  }, [additionalFilesLoaded]);

  useEffect(() => {
    chContext.current.bookNode = props.bookNode;
  }, [props.bookNode]);

  useEffect(() => {
    chContext.current.typ = props.typ || ChallengeTypes.py;
    setOrigType(props.typ || ChallengeTypes.py);
  }, [props.typ]);

  useEffect(() => {
    if (codeRunner.state > CodeRunnerState.READY) {
      codeRunner.kill?.();
      codeRunner.clear?.();
    }

    chContext.current.uid = props.uid;
    // eslint-disable-next-line
  }, [props.uid, props.bookNode]);

  useEffect(() => {
    let testRes = props.bookNode
      ? props.progressStorage.getResult(props.bookNode)
      : undefined;
    setTestResults(testRes === undefined ? [] : [{ outcome: testRes }]);
    setTestsPassing(testRes);
  }, [props.bookNode, props.progressStorage]);

  useEffect(() => {
    editorRef.current?.updateEditorDecorations();
    if (codeRunner.state === CodeRunnerState.AWAITING_INPUT) {
      outputsRef.current?.focusPane("console");
    }
  }, [codeRunner.state]);

  return (
    <>
      {showBookUpload ? (
        <BookUploadModal
          visible={true}
          onClose={() => setShowBookUpload(false)}
          onBookUploaded={props.onBookUploaded}
        />
      ) : null}

      <ChallengeContext.Provider value={chContext.current}>
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
            <Header />
            <Allotment className="h-100" defaultSizes={[650, 350]}>
              <Allotment.Pane>
                <Allotment vertical defaultSizes={[650, 350]}>
                  <Allotment.Pane>
                    {props.typ === "parsons" ? (
                      <ParsonsEditor
                        ref={parsonsEditorRef}
                        starterCode={savedCode || starterCode || ""}
                      />
                    ) : (
                      <PyEditor
                        ref={editorRef}
                        canRun={codeRunner.state === CodeRunnerState.READY}
                        canPlaceBreakpoint={
                          codeRunner.state === CodeRunnerState.READY ||
                          codeRunner.state === CodeRunnerState.AWAITING_INPUT ||
                          codeRunner.state === CodeRunnerState.ON_BREAKPOINT
                        }
                        isOnBreakPoint={
                          codeRunner.state === CodeRunnerState.ON_BREAKPOINT
                        }
                        debugContext={
                          codeRunner.debugContext || emptyDebugContext
                        }
                        starterCode={savedCode || starterCode || ""}
                        onToggleFullScreen={() =>
                          setEditorFullScreen(!editorFullScreen)
                        }
                      />
                    )}
                  </Allotment.Pane>
                  <Allotment.Pane
                    visible={getVisibilityWithHack(!editorFullScreen)}
                    maxSize={550}
                    minSize={150}
                  >
                    <Outputs
                      ref={outputsRef}
                      visiblePanes={[
                        "console",
                        ...(typ === ChallengeTypes.canvas
                          ? ["canvas" as PaneType]
                          : []),
                        ...(usesFixedInput ? ["fixed-input" as PaneType] : []),
                      ]}
                      console={
                        <ChallengeConsole
                          content={codeRunner.consoleText}
                          inputEnabled={
                            codeRunner.state === CodeRunnerState.AWAITING_INPUT
                          }
                        />
                      }
                      fixedInput={<FixedInputField ref={fixedInputFieldRef} />}
                      canvas={
                        <CanvasDisplay
                          ref={(c) => {
                            canvasDisplayRef.current = c;
                            if (canvasDisplayRef.current)
                              canvasMountedCallback();
                          }}
                        />
                      }
                      files={
                        props.bookNode.additionalFiles?.map((file, index) => (
                          <AdditionalFileView
                            key={index}
                            defaultValue={additionalFilesLoaded[file.filename]}
                            readonly={true}
                          />
                        )) || []
                      }
                      fileProperties={props.bookNode.additionalFiles || []}
                      fileShowAll={false}
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
                            setGuideMinimised(!guideMinimised)
                          }
                          canDebug={codeRunner.state === CodeRunnerState.READY}
                          canRunOnly={origType === "parsons" ? true : false}
                          canSubmit={
                            (!props.bookNode.isExample &&
                              ((!!props.bookNode.tests &&
                                props.bookNode.tests.length > 0) ||
                                props.typ === "parsons")) ||
                            !!props.bookNode.isAssessment
                          }
                          testResults={testResults}
                          canKill={codeRunner.state === CodeRunnerState.RUNNING}
                          isAssessment={!!props.bookNode.isAssessment}
                        />
                      </CardContent>
                    </Card>
                    {guideMinimised ? null : (
                      <Guide
                        challengeId={props.bookNode.id}
                        md={guideMd || ""}
                        turtleExampleImage={turtleExampleRendered}
                      />
                    )}
                    <BookControlFabs
                      onNavigateToPrevPage={props.onRequestPreviousChallenge}
                      onNavigateToNextPage={props.onRequestNextChallenge}
                      onOpenMenu={() => {
                        props.openBookDrawer?.(true);
                      }}
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
                      canContinue={
                        codeRunner.state === CodeRunnerState.ON_BREAKPOINT
                      }
                      canKill={
                        codeRunner.state ===
                          CodeRunnerState.RUNNING_WITH_DEBUGGER ||
                        codeRunner.state === CodeRunnerState.ON_BREAKPOINT ||
                        codeRunner.state === CodeRunnerState.AWAITING_INPUT
                      }
                      debugContext={
                        codeRunner.debugContext || emptyDebugContext
                      }
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
                      onGuideDisplayToggle={() =>
                        setGuideMinimised(!guideMinimised)
                      }
                      canDebug={codeRunner.state === CodeRunnerState.READY}
                      canRunOnly={origType === "parsons" ? true : false}
                      canSubmit={
                        (!props.bookNode.isExample &&
                          ((props.bookNode.tests !== null &&
                            props.bookNode.tests.length > 0) ||
                            props.typ === "parsons")) ||
                        !!props.bookNode.isAssessment
                      }
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
      </ChallengeContext.Provider>
    </>
  );
};

export default Challenge2;
