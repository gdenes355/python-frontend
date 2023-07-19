import React, { MutableRefObject } from "react";
import { throttle } from "lodash";
import { Box, Card, CardContent, Grid, IconButton, Paper } from "@mui/material";
import CachedIcon from "@mui/icons-material/Cached";

import { Allotment } from "allotment";
import "allotment/dist/style.css";

import IChallenge, { IChallengeState, IChallengeProps } from "./IChallenge";
import ChallengeTypes from "../models/ChallengeTypes";
import ChallengeContext, { ChallengeContextClass } from "./ChallengeContext";

import DebugPane from "../components/DebugPane";
import PyEditor, { PyEditorHandle } from "./components/Editors/PyEditor";
import ParsonsEditor, {
  ParsonsEditorHandle,
} from "./components/Editors/ParsonsEditor";
import ChallengeConsole from "./components/ChallengeConsole";
import CanvasDisplay, {
  CanvasDisplayHandle,
} from "./components/CanvasDisplay/CanvasDisplay";
import FixedInputField, {
  FixedInputFieldHandle,
} from "./components/FixedInputField";
import Guide from "../components/Guide";
import MainControls from "./components/MainControls";
import BookControlFabs from "../book/components/BookControlFabs";
import HeaderBar from "../components/HeaderBar";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases } from "../models/Tests";
import Help from "./components/Help";
import Outputs, { OutputsHandle } from "./components/Outputs";
import BookUploadModal from "../book/components/BookUploadModal";
import HeaderButtons from "./components/HeaderButtons";

import "./Challenge.css";
import HeaderMenu from "./components/HeaderMenu";
import SessionWsStateIndicator from "../auth/components/SessionWsStateIndicator";
import PaneType from "../models/PaneType";
import AdditionalFileView from "./components/Editors/AdditionalFileView";

type ChallengeState = IChallengeState & {
  savedCode: string | null;
  editorFullScreen: boolean;
  testsPassing: boolean | undefined;
  helpOpen: boolean;
  guideMinimised: boolean;
  showBookUpload: boolean;
};

type ChallengeProps = IChallengeProps & {
  title?: string;
  tests?: TestCases | null;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
  onBookUploaded: (file: File, edit: boolean) => void;
  canReloadBook?: boolean;
  onBookReloadRequested: () => void;
};

class Challenge
  extends React.Component<ChallengeProps, ChallengeState>
  implements IChallenge
{
  editorRef = React.createRef<PyEditorHandle>();
  parsonsEditorRef = React.createRef<ParsonsEditorHandle>();
  canvasDisplayRef: MutableRefObject<CanvasDisplayHandle | null> =
    React.createRef<CanvasDisplayHandle | null>();
  fixedInputFieldRef = React.createRef<FixedInputFieldHandle>();
  outputsRef = React.createRef<OutputsHandle>();
  fileReader = new FileReader();
  canvasPromiseResolve?: (value: any) => void;

  currentConsoleText: string = "";
  currentFixedUserInput: string[] = [];

  chContext: ChallengeContextClass = new ChallengeContextClass(this);

  // non-UI (non-React) internal state
  breakpointsChanged: boolean = false;
  worker: Worker | null = null;
  interruptBuffer: Uint8Array | null = null;
  keyDownBuffer: Uint8Array | null = null;
  workerFullyInitialised: boolean = false;

  forceStopping: boolean = false;

  printCallback = throttle(
    () => this.setState({ consoleText: this.currentConsoleText }),
    100
  );

  canvasMountedCallback = () => {
    if (this.canvasPromiseResolve) {
      const local = this.canvasPromiseResolve;
      this.canvasPromiseResolve = undefined;
      if (local) {
        local(true);
      }
    }
  };

  state: ChallengeState = {
    starterCode: null,
    savedCode: null,
    consoleText: "Press debug to get started...",
    guideMd: "*Loading the guide... Please wait*",
    debugContext: { lineno: 0, locals: new Map(), globals: new Map() },
    editorState: ChallengeStatus.LOADING,
    editorFullScreen: false,
    testResults: [],
    testsPassing: undefined,
    helpOpen: false,
    guideMinimised: false,
    typ: ChallengeTypes.TYP_PY,
    origTyp: ChallengeTypes.TYP_PY,
    usesFixedInput: false,
    showBookUpload: false,
    additionalFilesLoaded: {},
    turtleExampleRendered: undefined,
  };

  constructor(props: ChallengeProps) {
    super(props);
    this.getVisibilityWithHack.bind(this);
  }

  componentDidMount() {
    console.log("crossOriginIsolated", window.crossOriginIsolated);
    this.chContext.actions["load-saved-code"]();
    this.chContext.actions["fetch-code"]();
    this.chContext.actions["fetch-guide"]();

    this.chContext.actions["restart-worker"]({ force: true });

    const challengeTyp =
      (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY;

    this.setState({
      typ: challengeTyp,
      origTyp: challengeTyp,
    });
  }

  componentDidUpdate(prevProps: ChallengeProps, prevState: ChallengeState) {
    if (prevProps.guidePath !== this.props.guidePath) {
      this.chContext.actions["fetch-guide"]();
    }

    const files = (this.props.bookNode.additionalFiles || []).map(
      (file) => file.filename
    );

    this.props.bookNode.tests?.forEach((test) => {
      if (test.out instanceof Array) {
        test.out.forEach((out) => {
          if (out.filename && out.typ?.[0] !== "f") {
            files.push(out.filename);
          }
        });
      }
    });

    files.forEach((file) => {
      if (!(file in this.state.additionalFilesLoaded)) {
        this.chContext.actions["fetch-file"](file).then((text) =>
          this.setState({
            additionalFilesLoaded: {
              ...this.state.additionalFilesLoaded,
              [file]: text,
            },
          })
        );
      }
    });

    if (prevProps.codePath !== this.props.codePath) {
      this.chContext.actions["fetch-code"]();

      const challengeTyp =
        (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY;

      this.setState({
        typ: challengeTyp,
        origTyp: challengeTyp,
      });

      this.chContext.actions["restart-worker"]({});
      this.chContext.actions["load-saved-code"]();
      let testRes = this.props.bookNode
        ? this.props.progressStorage.getResult(this.props.bookNode)
        : undefined;
      this.setState({
        testResults: testRes === undefined ? [] : [{ outcome: testRes }],
        testsPassing: testRes,
      });
    }
    if (prevProps.typ !== this.props.typ) {
      const challengeTyp =
        (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY;

      // this is a live typ change so we don't change the origTyp
      this.setState({
        typ: challengeTyp,
      });
    }
    if (
      this.editorRef.current &&
      this.state.editorState !== prevState.editorState &&
      (prevState.editorState === ChallengeStatus.ON_BREAKPOINT ||
        this.state.editorState === ChallengeStatus.ON_BREAKPOINT)
    ) {
      this.editorRef.current.updateEditorDecorations();
    }

    if (this.state.testResults !== prevState.testResults) {
      let newTestResult =
        this.state.testResults.length === 0
          ? undefined
          : this.state.testResults.filter((x) => x.outcome !== true).length ===
            0;
      this.setState({ testsPassing: newTestResult });
    }
  }

  getVisibilityWithHack = (visible: boolean) => {
    // allotment seems to dislike visibility=true during load time
    return this.state.editorState === ChallengeStatus.LOADING
      ? undefined
      : visible;
  };

  renderEditor() {
    if (this.props.typ === "parsons") {
      return (
        <ParsonsEditor
          ref={this.parsonsEditorRef}
          starterCode={this.state.savedCode || this.state.starterCode || ""}
        />
      );
    }

    return (
      <PyEditor
        ref={this.editorRef}
        canRun={this.state.editorState === ChallengeStatus.READY}
        canPlaceBreakpoint={
          this.state.editorState === ChallengeStatus.READY ||
          this.state.editorState === ChallengeStatus.AWAITING_INPUT ||
          this.state.editorState === ChallengeStatus.ON_BREAKPOINT
        }
        isOnBreakPoint={
          this.state.editorState === ChallengeStatus.ON_BREAKPOINT
        }
        debugContext={this.state.debugContext}
        starterCode={this.state.savedCode || this.state.starterCode || ""}
        onToggleFullScreen={() => {
          this.setState((state) => {
            return { editorFullScreen: !state.editorFullScreen };
          });
        }}
      />
    );
  }

  renderMainControls = () => {
    if (this.state.helpOpen && !this.state.guideMinimised) {
      return;
    }
    return (
      <Card sx={{ overflow: "visible" }}>
        <CardContent>
          <MainControls
            guideMinimised={this.state.guideMinimised}
            onGuideDisplayToggle={() =>
              this.setState((prevState) => {
                return { guideMinimised: !prevState.guideMinimised };
              })
            }
            canDebug={this.state.editorState === ChallengeStatus.READY}
            canSubmit={
              !this.props.isExample &&
              (this.props.tests !== null || this.props.typ === "parsons")
            }
            testResults={this.state.testResults}
            canKill={this.state.editorState === ChallengeStatus.RUNNING}
          />
        </CardContent>
      </Card>
    );
  };

  renderGuide = () => {
    if (this.state.guideMinimised) {
      return;
    }
    if (this.state.helpOpen) {
      return <Help onClose={() => this.setState({ helpOpen: false })} />;
    }
    return (
      <Guide
        challengeId={this.props.bookNode.id}
        md={this.state.guideMd}
        turtleExampleImage={this.state.turtleExampleRendered}
      />
    );
  };

  render() {
    return (
      <>
        {this.state.showBookUpload ? (
          <BookUploadModal
            visible={true}
            onClose={() => this.setState({ showBookUpload: false })}
            onBookUploaded={this.props.onBookUploaded}
          />
        ) : null}
        <ChallengeContext.Provider value={this.chContext}>
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
              <HeaderBar
                title={`${
                  this.props.title ? this.props.title + " \u203A " : ""
                }  ${this.props.bookNode?.name}`}
                onHelpOpen={(open) => this.setState({ helpOpen: open })}
                menuItems={
                  <HeaderMenu
                    onUsingFixedInputChange={(fixedInput) =>
                      this.setState({ usesFixedInput: fixedInput })
                    }
                    usingFixedInput={this.state.usesFixedInput}
                    onBookUpload={() => {
                      this.setState({ showBookUpload: true });
                    }}
                  />
                }
              >
                {this.props.canReloadBook ? (
                  <Grid item>
                    <IconButton
                      onClick={() => {
                        this.chContext.actions["fetch-code"](true);
                        this.chContext.actions["fetch-guide"]();
                        this.props.onBookReloadRequested();
                      }}
                    >
                      <CachedIcon />
                    </IconButton>
                  </Grid>
                ) : undefined}
                {this.props.authContext.token ? (
                  <Grid item>
                    <SessionWsStateIndicator />
                  </Grid>
                ) : undefined}

                <HeaderButtons
                  canReset={this.state.editorState === ChallengeStatus.READY}
                />
              </HeaderBar>

              <Allotment className="h-100" defaultSizes={[650, 350]}>
                <Allotment.Pane>
                  <Allotment vertical defaultSizes={[650, 350]}>
                    <Allotment.Pane>{this.renderEditor()}</Allotment.Pane>
                    <Allotment.Pane
                      visible={this.getVisibilityWithHack(
                        !this.state.editorFullScreen
                      )}
                      maxSize={550}
                      minSize={150}
                    >
                      <Outputs
                        ref={this.outputsRef}
                        visiblePanes={[
                          "console",
                          ...(this.state.typ === ChallengeTypes.TYP_CANVAS
                            ? ["canvas" as PaneType]
                            : []),
                          ...(this.state.usesFixedInput
                            ? ["fixed-input" as PaneType]
                            : []),
                        ]}
                        console={
                          <ChallengeConsole
                            content={this.state.consoleText}
                            inputEnabled={
                              this.state.editorState ===
                              ChallengeStatus.AWAITING_INPUT
                            }
                          />
                        }
                        fixedInput={
                          <FixedInputField ref={this.fixedInputFieldRef} />
                        }
                        canvas={
                          <CanvasDisplay
                            ref={(c) => {
                              this.canvasDisplayRef.current = c;
                              if (this.canvasDisplayRef.current)
                                this.canvasMountedCallback();
                            }}
                          />
                        }
                        files={
                          this.props.bookNode.additionalFiles?.map(
                            (file, index) => (
                              <AdditionalFileView
                                key={index}
                                defaultValue={
                                  this.state.additionalFilesLoaded[
                                    file.filename
                                  ]
                                }
                                readonly={true}
                              />
                            )
                          ) || []
                        }
                        fileProperties={
                          this.props.bookNode.additionalFiles || []
                        }
                        fileShowAll={false}
                      />
                    </Allotment.Pane>
                  </Allotment>
                </Allotment.Pane>
                <Allotment.Pane
                  visible={this.getVisibilityWithHack(
                    !this.state.editorFullScreen && !this.state.guideMinimised
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
                      {this.renderMainControls()}
                      {this.renderGuide()}
                      <BookControlFabs
                        onNavigateToPrevPage={
                          this.props.onRequestPreviousChallenge
                        }
                        onNavigateToNextPage={this.props.onRequestNextChallenge}
                        onOpenMenu={() => {
                          this.props.openBookDrawer?.(true);
                        }}
                      />
                    </Box>
                    <Allotment.Pane
                      maxSize={350}
                      minSize={150}
                      snap={true}
                      visible={
                        this.state.editorState ===
                          ChallengeStatus.RUNNING_WITH_DEBUGGER ||
                        this.state.editorState ===
                          ChallengeStatus.ON_BREAKPOINT ||
                        this.state.editorState ===
                          ChallengeStatus.AWAITING_INPUT
                      }
                      className="debug-pane"
                    >
                      <DebugPane
                        canContinue={
                          this.state.editorState ===
                          ChallengeStatus.ON_BREAKPOINT
                        }
                        canKill={
                          this.state.editorState ===
                            ChallengeStatus.RUNNING_WITH_DEBUGGER ||
                          this.state.editorState ===
                            ChallengeStatus.ON_BREAKPOINT ||
                          this.state.editorState ===
                            ChallengeStatus.AWAITING_INPUT
                        }
                        debugContext={this.state.debugContext}
                      />
                    </Allotment.Pane>
                  </Allotment>
                </Allotment.Pane>
              </Allotment>
            </Box>
            <Box>
              {!this.state.guideMinimised ? undefined : (
                <div>{this.renderMainControls()}</div>
              )}
            </Box>
          </Paper>
        </ChallengeContext.Provider>
      </>
    );
  }
}

export default Challenge;
