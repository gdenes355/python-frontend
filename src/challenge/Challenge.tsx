import React from "react";
import { Box, Card, CardContent } from "@mui/material";
import DebugPane from "../components/DebugPane";
import PyEditor from "../components/PyEditor";
import Console from "../components/Console";
import Guide from "../components/Guide";
import MainControls from "./MainControls";
import BookControlFabs from "../components/BookControlFabs";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

import Cookies from "js-cookie";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases, TestResults } from "../models/Tests";
import DebugContext from "../models/DebugContext";
import Help from "./Help";

import ChallengeController from "./ChallengeController";

import "./Challenge.css";

type ChallengeState = {
  starterCode: string | null;
  savedCode: string | null;
  worker: Worker | null;
  guideMd: string;
  debugContext: DebugContext;
  theme: string;
  editorFullScreen: boolean;
  errorLoading: boolean;
  consoleText: string;
  editorState: ChallengeStatus;
  testResults: TestResults;
  breakpointsChanged: boolean;
  testsPassing: boolean | null;
  interruptBuffer: Uint8Array | null;
  helpOpen: boolean;
};

type ChallengeProps = {
  uid?: string | null;
  guidePath: string;
  codePath: string;
  hasBook: boolean;
  layout: string;
  tests?: TestCases | null;
  isExample?: boolean;
  onTestsPassingChanged?: (passing: boolean | null) => void;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
};

class Challenge extends React.Component<ChallengeProps, ChallengeState> {
  editorRef = React.createRef<PyEditor>();

  state: ChallengeState = {
    starterCode: null,
    savedCode: null,
    worker: null,
    consoleText: "Press debug to get started...",
    guideMd: "*Loading the guide... Please wait*",
    debugContext: { lineno: 0, env: new Map() },
    editorState: ChallengeStatus.LOADING,
    theme: "vs-dark",
    editorFullScreen: false,
    errorLoading: false,
    testResults: [],
    breakpointsChanged: false,
    testsPassing: null,
    interruptBuffer: null,
    helpOpen: false,
  };

  constructor(props: ChallengeProps) {
    super(props);
    this.handleThemeChange.bind(this);
    this.getVisibilityWithHack.bind(this);
    this.onBreakpointsUpdated.bind(this);
  }

  componentDidMount() {
    console.log("crossOriginIsolated", window.crossOriginIsolated);
    let previousTheme = Cookies.get("theme");
    if (previousTheme) {
      this.setState({ theme: previousTheme });
    }
    if (this.props?.uid) {
      let savedCode = localStorage.getItem(
        "code-" + encodeURIComponent(this.props.uid)
      );
      if (savedCode) {
        this.setState({ savedCode: savedCode });
      }
    }
    fetch(this.props.guidePath)
      .then((response) => {
        if (!response.ok) {
          this.setState({ errorLoading: true });
        }
        return response.text();
      })
      .then((text) => this.setState({ guideMd: text }));
    fetch(this.props.codePath)
      .then((response) => {
        if (!response.ok) {
          this.setState({ errorLoading: true });
        }
        return response.text();
      })
      .then((text) => this.setState({ starterCode: text }));

    navigator.serviceWorker.register("pysw.js").then(function (reg) {
      if (navigator.serviceWorker.controller === null || !reg.active) {
        window.location.reload();
      }
    });
    ChallengeController["restart-worker"](this, { force: true });
  }

  componentDidUpdate(prevProps: ChallengeProps, prevState: ChallengeState) {
    if (prevProps.guidePath !== this.props.guidePath) {
      fetch(this.props.guidePath)
        .then((response) => response.text())
        .then((text) => this.setState({ guideMd: text }));
    }

    if (prevProps.codePath !== this.props.codePath) {
      fetch(this.props.codePath)
        .then((response) => response.text())
        .then((text) => this.setState({ starterCode: text }));
      ChallengeController["restart-worker"](this, {});
      if (this.props?.uid) {
        let savedCode = localStorage.getItem(
          "code-" + encodeURIComponent(this.props.uid)
        );
        if (savedCode) {
          this.setState({ savedCode: savedCode });
        } else {
          this.setState({ savedCode: null });
        }
      } else {
        this.setState({ savedCode: null });
      }
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

  handleThemeChange = (theme: string) => {
    this.setState({ theme });
    Cookies.set("theme", theme);
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
      this.setState({ breakpointsChanged: true });
    }
  };

  renderEditor() {
    return (
      <PyEditor
        ref={this.editorRef}
        readOnly={this.props.isExample}
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
        starterCode={
          this.state.savedCode
            ? this.state.savedCode
            : this.state.starterCode
            ? this.state.starterCode
            : ""
        }
        theme={this.state.theme}
        onToggleFullScreen={() => {
          this.setState((state, props) => {
            return { editorFullScreen: !state.editorFullScreen };
          });
        }}
        onDebug={() => {
          ChallengeController["debug"](this, {
            code: this.editorRef.current?.getValue(),
            breakpoints: this.editorRef.current
              ? this.editorRef.current.getBreakpoints()
              : [],
          });
        }}
        onContinue={() => ChallengeController["continue"](this, {})}
        onStepInto={() => ChallengeController["step"](this)}
        onStop={() => {
          ChallengeController["restart-worker"](this, {
            msg: "Interrupted...",
            force: true,
          });
        }}
      />
    );
  }

  renderConsole = () => {
    return (
      <Console
        content={this.state.consoleText}
        isInputEnabled={
          this.state.editorState === ChallengeStatus.AWAITING_INPUT
        }
        onInput={(input) => {
          ChallengeController["input-entered"](this, { input });
        }}
        onInterrupt={() => {
          ChallengeController["restart-worker"](this, {
            msg: "Interrupted...",
            force: true,
          });
        }}
      />
    );
  };

  renderMainControls = () => {
    if (this.state.helpOpen) {
      return;
    }
    return (
      <Card sx={{ overflow: "visible" }}>
        <CardContent>
          <MainControls
            theme={this.state.theme}
            onThemeChange={this.handleThemeChange}
            onDebug={() => {
              ChallengeController["debug"](this, {
                code: this.editorRef.current?.getValue(),
                breakpoints: this.editorRef.current
                  ? this.editorRef.current.getBreakpoints()
                  : [],
              });
            }}
            onSubmit={() => {
              ChallengeController["test"](this, {
                code: this.editorRef.current?.getValue(),
                tests: this.props.tests,
              });
            }}
            onResetCode={() => ChallengeController["reset-code"](this)}
            canDebug={this.state.editorState === ChallengeStatus.READY}
            canReset={this.state.editorState === ChallengeStatus.READY}
            canSubmit={this.props.tests !== null}
            testResults={this.state.testResults}
            onHelpOpen={(open) => this.setState({ helpOpen: open })}
          />
        </CardContent>
      </Card>
    );
  };

  renderGuide = () => {
    if (this.state.helpOpen) {
      return <Help onClose={() => this.setState({ helpOpen: false })} />;
    }
    return <Guide md={this.state.guideMd} />;
  };

  renderDebugPane = () => {
    return (
      <DebugPane
        canContinue={this.state.editorState === ChallengeStatus.ON_BREAKPOINT}
        onContinue={() => ChallengeController["continue"](this, {})}
        onStep={() => ChallengeController["step"](this)}
        canKill={
          this.state.editorState === ChallengeStatus.RUNNING ||
          this.state.editorState === ChallengeStatus.ON_BREAKPOINT ||
          this.state.editorState === ChallengeStatus.AWAITING_INPUT
        }
        onKill={() => {
          ChallengeController["restart-worker"](this, {
            msg: "Interrupted...",
            force: true,
          });
        }}
        debugContext={this.state.debugContext}
      />
    );
  };

  render() {
    if (this.state.errorLoading) {
      return <p>The challenges files cannot be found. Have they been moved?</p>;
    } else if (this.props.layout === "fullscreen") {
      return (
        <Box sx={{ width: "100%", height: "100%" }}>
          <Allotment className="h-100" defaultSizes={[65, 35]}>
            <Allotment.Pane>
              <Allotment vertical>
                <Allotment.Pane>{this.renderEditor()}</Allotment.Pane>
                <Allotment.Pane
                  visible={this.getVisibilityWithHack(
                    !this.state.editorFullScreen
                  )}
                  maxSize={350}
                  minSize={150}
                >
                  {this.renderConsole()}
                </Allotment.Pane>
              </Allotment>
            </Allotment.Pane>
            <Allotment.Pane
              visible={this.getVisibilityWithHack(!this.state.editorFullScreen)}
            >
              <Allotment vertical className="challenge__right-pane">
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {this.renderMainControls()}
                  {this.renderGuide()}
                  <BookControlFabs
                    onNavigateToPrevPage={this.props.onRequestPreviousChallenge}
                    onNavigateToNextPage={this.props.onRequestNextChallenge}
                    onOpenMenu={() =>
                      this.props.openBookDrawer
                        ? this.props.openBookDrawer(true)
                        : undefined
                    }
                  ></BookControlFabs>
                </Box>
                <Allotment.Pane
                  maxSize={350}
                  minSize={150}
                  snap={true}
                  visible={
                    this.state.editorState === ChallengeStatus.RUNNING ||
                    this.state.editorState === ChallengeStatus.ON_BREAKPOINT ||
                    this.state.editorState === ChallengeStatus.AWAITING_INPUT
                  }
                  className="debug-pane"
                >
                  {this.renderDebugPane()}
                </Allotment.Pane>
              </Allotment>
            </Allotment.Pane>
          </Allotment>
        </Box>
      );
    } else {
      return (
        <Box sx={{ width: "100%", height: "100%" }}>
          <Box sx={{ p: 2 }}>{this.renderGuide()}</Box>
          <Box sx={{ height: "600px" }}>{this.renderEditor()}</Box>
          {this.renderMainControls()}
          <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
            {this.renderConsole()}
          </Box>
          <Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
            {this.renderDebugPane()}
          </Box>
        </Box>
      );
    }
  }
}

export default Challenge;
export { ChallengeState };
