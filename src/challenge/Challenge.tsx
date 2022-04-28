import React from "react";
import { throttle } from "lodash";
import { Box, Card, CardContent, Paper } from "@mui/material";
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
import HeaderBar from "./components/HeaderBar";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases } from "../models/Tests";
import BookNodeModel from "../models/BookNodeModel";
import Help from "./components/Help";
import Outputs, { OutputsHandle } from "./components/Outputs";
import BookUploadModal from "./components/BookUploadModal";


import "./Challenge.css";

type ChallengeState = IChallengeState & {
  savedCode: string | null;
  editorFullScreen: boolean;
  testsPassing: boolean | null;
  helpOpen: boolean;
  guideMinimised: boolean;
  showBookUpload: boolean;
};

type ChallengeProps = IChallengeProps & {
  bookNode?: BookNodeModel;
  title?: string;
  tests?: TestCases | null;
  onTestsPassingChanged?: (passing: boolean | null) => void;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
  onBookUploaded: (file:File) => void;
};

class Challenge
  extends React.Component<ChallengeProps, ChallengeState>
  implements IChallenge
{
  editorRef = React.createRef<PyEditorHandle>();
  parsonsEditorRef = React.createRef<ParsonsEditorHandle>();
  canvasDisplayRef = React.createRef<CanvasDisplayHandle>();
  fixedInputFieldRef = React.createRef<FixedInputFieldHandle>();
  outputsRef = React.createRef<OutputsHandle>();
  fileReader = new FileReader();

  currentConsoleText: string = "";
  currentFixedUserInput: string[] = [];

  chContext: ChallengeContextClass = new ChallengeContextClass(this);

  // non-UI (non-React) internal state
  breakpointsChanged: boolean = false;
  worker: Worker | null = null;
  interruptBuffer: Uint8Array | null = null;
  keyDownBuffer: Uint8Array | null = null;

  printCallback = throttle(
    () => this.setState({ consoleText: this.currentConsoleText }),
    100
  );

  state: ChallengeState = {
    starterCode: null,
    savedCode: null,
    consoleText: "Press debug to get started...",
    guideMd: "*Loading the guide... Please wait*",
    debugContext: { lineno: 0, env: new Map() },
    editorState: ChallengeStatus.LOADING,
    editorFullScreen: false,
    testResults: [],
    testsPassing: null,
    helpOpen: false,
    guideMinimised: false,
    typ: ChallengeTypes.TYP_PY,
    usesFixedInput: false,
    showBookUpload:false,
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
    navigator.serviceWorker.register("pysw.js").then(function (reg) {
      if (navigator.serviceWorker.controller === null || !reg.active) {
        window.location.reload();
      }
    });
    this.chContext.actions["restart-worker"]({ force: true });
    this.setState({
      typ: (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY,
    });
  }

  componentDidUpdate(prevProps: ChallengeProps, prevState: ChallengeState) {
    if (prevProps.guidePath !== this.props.guidePath) {
      this.chContext.actions["fetch-guide"]();
    }

    if (prevProps.codePath !== this.props.codePath) {
      this.chContext.actions["fetch-code"]();
      this.setState({
        typ: (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY,
      });
      this.chContext.actions["restart-worker"]({});
      this.chContext.actions["load-saved-code"]();
      this.setState({ testResults: [], testsPassing: null });
    }
    if (prevProps.typ !== this.props.typ) {
      this.setState({
        typ: (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY,
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
          ? null
          : this.state.testResults.filter((x) => x.outcome !== true).length ===
            0;
      this.setState({ testsPassing: newTestResult });
    }

    if (this.state.testsPassing !== prevState.testsPassing) {
      if (this.props.onTestsPassingChanged) {
        this.props.onTestsPassingChanged(this.state.testsPassing);
      }
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
              this.props.tests !== null || this.props.typ === "parsons"
            }
            testResults={this.state.testResults}
            canPreview={false}
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
    return <Guide md={this.state.guideMd} />;
  };

  render() {
    return (
      <>
      {this.state.showBookUpload ? 
        <BookUploadModal visible={true} onClose={() => this.setState({showBookUpload: false})} onBookUploaded={(file) => this.props.onBookUploaded(file)}/>
        : null
      }
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
              title={this.props.title || this.props.bookNode?.name || ""}
              usingFixedInput={this.state.usesFixedInput}
              showEditTools={false}
              showUploadBookZip={true}
              onHelpOpen={(open) => this.setState({ helpOpen: open })}
              canDebug={this.state.editorState === ChallengeStatus.READY}
              canReset={this.state.editorState === ChallengeStatus.READY}
              onUsingFixedInputChange={(fixedInput) =>
                this.setState({ usesFixedInput: fixedInput })
              }
              onBookUpload={() => {console.log("here");this.setState({showBookUpload:true})}}
            />

            <Allotment className="h-100" defaultSizes={[650, 350]}>
              <Allotment.Pane>
                <Allotment vertical defaultSizes={[650, 350]}>
                  <Allotment.Pane>{this.renderEditor()}</Allotment.Pane>
                  <Allotment.Pane
                    visible={this.getVisibilityWithHack(
                      !this.state.editorFullScreen
                    )}
                    maxSize={550}
                    minSize={
                      this.state.typ === ChallengeTypes.TYP_CANVAS ? 450 : 150
                    }
                  >
                    <Outputs
                      ref={this.outputsRef}
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
                        this.state.usesFixedInput ? (
                          <FixedInputField ref={this.fixedInputFieldRef} />
                        ) : undefined
                      }
                      canvas={
                        this.state.typ === ChallengeTypes.TYP_CANVAS ? (
                          <CanvasDisplay ref={this.canvasDisplayRef} />
                        ) : undefined
                      }
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
                  </Box>
                  <Allotment.Pane
                    maxSize={350}
                    minSize={150}
                    snap={true}
                    visible={
                      this.state.editorState === ChallengeStatus.RUNNING ||
                      this.state.editorState ===
                        ChallengeStatus.ON_BREAKPOINT ||
                      this.state.editorState === ChallengeStatus.AWAITING_INPUT
                    }
                    className="debug-pane"
                  >
                    <DebugPane
                      canContinue={
                        this.state.editorState === ChallengeStatus.ON_BREAKPOINT
                      }
                      canKill={
                        this.state.editorState === ChallengeStatus.RUNNING ||
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
            <BookControlFabs
              onNavigateToPrevPage={this.props.onRequestPreviousChallenge}
              onNavigateToNextPage={this.props.onRequestNextChallenge}
              onOpenMenu={() => {
                this.props.openBookDrawer?.(true);
              }}
            />
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
