import React from "react";
import { Box, Card, CardContent, TextField } from "@mui/material";

import DebugPane from "../components/DebugPane";
import PyEditor, { PyEditorHandle } from "./components/Editors/PyEditor";
import JsonEditor, { JsonEditorHandle } from "./components/Editors/JsonEditor";
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
import { Allotment } from "allotment";
import HeaderBar from "./components/HeaderBar";
import "allotment/dist/style.css";
import { throttle } from "lodash";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases, TestResults } from "../models/Tests";
import DebugContext from "../models/DebugContext";
import BookNodeModel from "../models/BookNodeModel";
import IFetcher from "../utils/IFetcher";
import Help from "./components/Help";
import Outputs, { OutputsHandle } from "./components/Outputs";

import ChallengeTypes from "../models/ChallengeTypes";

import ChallengeContext, { ChallengeContextClass } from "./ChallengeContext";

import "./Challenge.css";
import IChallenge from "./IChallenge";

type ChallengeState = {
  starterCode: string | null;
  savedCode: string | null;
  savedJSON: string | null;
  guideMd: string;
  debugContext: DebugContext;
  editorFullScreen: boolean;
  consoleText: string;
  editorState: ChallengeStatus;
  testResults: TestResults;
  testsPassing: boolean | null;
  helpOpen: boolean;
  guideMinimised: boolean;
  typ: ChallengeTypes; // use this in favour of the props.typ
  usesFixedInput: boolean;
  isEditingGuide: boolean;
};

type ChallengeProps = {
  uid: string;
  guidePath: string;
  codePath: string;
  bookNode?: BookNodeModel;
  title?: string;
  typ?: "py" | "parsons" | "canvas";
  tests?: TestCases | null;
  isExample?: boolean;
  showEditTools: boolean;
  fetcher: IFetcher;
  onTestsPassingChanged?: (passing: boolean | null) => void;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
};

class Challenge
  extends React.Component<ChallengeProps, ChallengeState>
  implements IChallenge
{
  editorRef = React.createRef<PyEditorHandle>();
  jsonEditorRef = React.createRef<JsonEditorHandle>();
  parsonsEditorRef = React.createRef<ParsonsEditorHandle>();
  canvasDisplayRef = React.createRef<CanvasDisplayHandle>();
  fixedInputFieldRef = React.createRef<FixedInputFieldHandle>();
  outputsRef = React.createRef<OutputsHandle>();
  fileReader = new FileReader();

  currentConsoleText: string = "";
  currentFixedUserInput: string[] = [];
  bookExports: string[][] = [];

  chContext: ChallengeContextClass = new ChallengeContextClass(this);

  // non-UI (non-React) internal state
  breakpointsChanged: boolean = false;
  worker: Worker | null = null;
  interruptBuffer: Uint8Array | null = null;
  keyDownBuffer: Uint8Array | null = null;

  JSON_DEFAULT: string = `
{
  "name": "Challenge Name",
  "isExample": true,
  "comment1": "tests will be ignored if isExample is true or you can delete the tests block if so",
  "tests": [
    {
        "in": "world",
        "out": ".*hello\\nworld",
        "comment2": "the output would match any input prompt followed by hello on one line and world on the next"
    }
  ],
  "comment3": "you can add multiple tests inside the square brackets",
  "typ": "py",
  "comment4": "typ can be py or parsons or canvas"
}
`;

  printCallback = throttle(
    () => this.setState({ consoleText: this.currentConsoleText }),
    100
  );

  state: ChallengeState = {
    starterCode: null,
    savedCode: null,
    savedJSON: null,
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
    isEditingGuide: false,
  };

  constructor(props: ChallengeProps) {
    super(props);
    this.getVisibilityWithHack.bind(this);
    this.onBreakpointsUpdated.bind(this);
    this.handleEditingChange.bind(this);
  }

  componentDidMount() {
    console.log("crossOriginIsolated", window.crossOriginIsolated);
    this.chContext.actions["load-saved-code"]();
    let savedJSON = localStorage.getItem(
      "json-" + encodeURIComponent(this.props.uid)
    );
    if (savedJSON) {
      this.setState({ savedJSON: savedJSON });
    }
    this.chContext.actions["fetch-code"]();
    this.chContext.actions["fetch-guide"]();
    navigator.serviceWorker.register("pysw.js").then(function (reg) {
      if (navigator.serviceWorker.controller === null || !reg.active) {
        window.location.reload();
      }
    });
    this.chContext.actions["restart-worker"]({ force: true });
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

  handleEditingChange = (editingGuide: boolean) => {
    if (editingGuide) {
      this.chContext.actions["save-code"]({
        code: this.editorRef.current?.getValue() || "",
      });
    } else {
      this.chContext.actions["save-json"]({
        code: this.editorRef.current?.getValue() || "",
      });
      this.setState({ savedJSON: this.editorRef.current?.getValue() || "" });
    }
    this.setState({ isEditingGuide: editingGuide });
  };

  handleAddToExport = () => {
    this.handleEditingChange(false);
    this.bookExports.push([
      this.state.guideMd,
      this.editorRef.current?.getValue() || "",
      this.state.savedJSON || this.JSON_DEFAULT,
    ]);
  };

  getVisibilityWithHack = (visible: boolean) => {
    // allotment seems to dislike visibility=true during load time
    return this.state.editorState === ChallengeStatus.LOADING
      ? undefined
      : visible;
  };

  onBreakpointsUpdated = () => {
    if (
      this.editorRef.current &&
      this.state.editorState !== ChallengeStatus.READY
    ) {
      this.breakpointsChanged = true;
    }
  };

  renderEditor() {
    if (this.state.isEditingGuide) {
      return (
        <JsonEditor
          ref={this.jsonEditorRef}
          starterCode={this.state.savedJSON || this.JSON_DEFAULT}
          onToggleFullScreen={() => {
            this.setState((state) => {
              return { editorFullScreen: !state.editorFullScreen };
            });
          }}
        />
      );
    }

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
        onBreakpointsUpdated={this.onBreakpointsUpdated}
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
    if (this.state.isEditingGuide) {
      return (
        <TextField
          multiline
          margin="dense"
          value={this.state.guideMd}
          onChange={(e) => {
            this.setState({ guideMd: e.target.value });
          }}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{ width: "100%", height: "100%" }}
        />
      );
    }
    return <Guide md={this.state.guideMd} />;
  };

  render() {
    return (
      <ChallengeContext.Provider value={this.chContext}>
        <Box
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
              showEditTools={this.props.showEditTools}
              editingGuide={this.state.isEditingGuide}
              onHelpOpen={(open) => this.setState({ helpOpen: open })}
              canDebug={this.state.editorState === ChallengeStatus.READY}
              canReset={this.state.editorState === ChallengeStatus.READY}
              onBookDownload={() =>
                this.chContext.actions["export-book"]({
                  contents: this.bookExports,
                })
              }
              onAddToExport={this.handleAddToExport}
              onUsingFixedInputChange={(fixedInput) =>
                this.setState({ usesFixedInput: fixedInput })
              }
              onEditingGuideChange={this.handleEditingChange}
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
                      canvas={<CanvasDisplay ref={this.canvasDisplayRef} />}
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
              onNavigateToPrevPage={() => {
                if (this.state.isEditingGuide) {
                  this.handleEditingChange(false);
                }
                this.props.onRequestPreviousChallenge?.();
              }}
              onNavigateToNextPage={() => {
                if (this.state.isEditingGuide) {
                  this.handleEditingChange(false);
                }
                if (this.props.onRequestNextChallenge) {
                  this.props.onRequestNextChallenge();
                }
              }}
              onOpenMenu={() => {
                if (this.state.isEditingGuide) {
                  this.handleEditingChange(false);
                }
                this.props.openBookDrawer?.(true);
              }}
            />
          </Box>
          <Box>
            {!this.state.guideMinimised ? undefined : (
              <div>{this.renderMainControls()}</div>
            )}
          </Box>
        </Box>
      </ChallengeContext.Provider>
    );
  }
}

export default Challenge;
export { ChallengeState };