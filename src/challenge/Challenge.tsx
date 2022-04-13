import React from "react";
import { Box, Card, CardContent, Tabs, Tab } from "@mui/material";
import DebugPane from "../components/DebugPane";
import PyEditor from "../components/PyEditor";
import ParsonsEditor from "../components/ParsonsEditor";
import Console from "../components/Console";
import CanvasDisplay from "../components/CanvasDisplay";
import Guide from "../components/Guide";
import MainControls from "./MainControls";
import BookControlFabs from "../components/BookControlFabs";
import { Allotment, AllotmentHandle } from "allotment";
import HeaderBar from "./HeaderBar";
import "allotment/dist/style.css";

import Cookies from "js-cookie";
import { throttle } from "lodash";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases, TestResults } from "../models/Tests";
import DebugContext from "../models/DebugContext";
import Help from "./Help";

import ChallengeController from "./ChallengeController";
import ChallengeTypes from "../models/ChallengeTypes";

import "./Challenge.css";
import BookNodeModel from "../models/BookNodeModel";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: "100%" }}
      {...other}
    >
      <Box sx={{ p: 3, width: "100%", height: "100%", padding: "0px" }}>
        {children}
      </Box>
    </div>
  );
}

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
  guideMinimised: boolean;
  currentTab: number;
  typInferred: ChallengeTypes;
};

type ChallengeProps = {
  uid?: string | null;
  guidePath: string;
  codePath: string;
  bookNode?: BookNodeModel;
  title?: string;
  layout: string;
  typ?: "py" | "parsons" | "canvas";
  tests?: TestCases | null;
  isExample?: boolean;
  onTestsPassingChanged?: (passing: boolean | null) => void;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
};

class Challenge extends React.Component<ChallengeProps, ChallengeState> {
  editorRef = React.createRef<PyEditor>();
  parsonsEditorRef = React.createRef<ParsonsEditor>();
  canvasDisplayRef = React.createRef<CanvasDisplay>();
  allotmentGuideRef = React.createRef<AllotmentHandle>();
  fileReader = new FileReader();

  currentConsoleText: string = "";

  printCallback = throttle(
    () => this.setState({ consoleText: this.currentConsoleText }),
    100
  );

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
    guideMinimised: false,
    currentTab: 0,
    typInferred: ChallengeTypes.TYP_PY,
  };

  constructor(props: ChallengeProps) {
    super(props);
    this.getVisibilityWithHack.bind(this);
    this.onBreakpointsUpdated.bind(this);
    this.print.bind(this);
    this.draw.bind(this);
    this.turtle.bind(this);
    this.cls.bind(this);
  }

  print(text: string) {
    this.currentConsoleText += text;
    this.printCallback();
  }

  draw(msg: string) {
    this.setState({ typInferred: ChallengeTypes.TYP_CANVAS });
    this.canvasDisplayRef?.current?.runCommand(msg);
  }

  turtle(msg: string) {
    this.setState({ typInferred: ChallengeTypes.TYP_CANVAS });
    this.canvasDisplayRef?.current?.runTurtleCommand(msg);
  }

  cls() {
    this.currentConsoleText = "";
    this.printCallback();
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
      this.setState({ typInferred: ChallengeTypes.TYP_PY });
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

  handleFileRead = (e: any) => {
    if (this.fileReader.result) {
      this.editorRef.current?.setValue(this.fileReader.result.toString());
    }
  };

  handleUpload = (file: File) => {
    this.fileReader = new FileReader();
    this.fileReader.onloadend = this.handleFileRead;
    this.fileReader.readAsText(file);
  };

  handleGuideDisplayToggle = () => {
    // detect before reversing to avoid redraw until complete
    if (!this.state.guideMinimised) {
      this.allotmentGuideRef?.current?.resize([90, 10]);
    } else {
      this.allotmentGuideRef?.current?.resize([65, 35]);
    }
    this.setState({ guideMinimised: !this.state.guideMinimised });
  };

  handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    this.setState({ currentTab: newValue });
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
        readOnly={false}
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

  renderOutput = () => {
    if (
      this.props.typ === "canvas" ||
      this.state.typInferred === ChallengeTypes.TYP_CANVAS
    ) {
      return (
        <Box
          className={"theme-" + this.state.theme}
          sx={{ width: "100%", height: "100%" }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={this.state.currentTab}
              onChange={this.handleTabChange}
              aria-label="Output tabs"
            >
              <Tab
                label="Canvas"
                id="simple-tab-0"
                aria-controls="simple-tabpanel-0"
              />
              <Tab
                label="Console"
                id="simple-tab-1"
                aria-controls="simple-tabpanel-1"
              />
            </Tabs>
          </Box>
          <TabPanel value={this.state.currentTab} index={0}>
            <CanvasDisplay ref={this.canvasDisplayRef}></CanvasDisplay>
          </TabPanel>
          <TabPanel value={this.state.currentTab} index={1}>
            <Box sx={{ width: "100%", height: "100%" }}>
              {this.renderConsole()}
            </Box>
          </TabPanel>
        </Box>
      );
    }
    return this.renderConsole();
  };

  renderMainControls = () => {
    if (this.state.helpOpen) {
      return;
    }
    return (
      <Card sx={{ overflow: "visible" }}>
        <CardContent>
          <MainControls
            guideMinimised={this.state.guideMinimised}
            onGuideDisplayToggle={this.handleGuideDisplayToggle}
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

  renderHeader() {
    return (
      <HeaderBar
        title={this.props.title || this.props.bookNode?.name || ""}
        theme={this.state.theme}
        onThemeChange={this.handleThemeChange}
        onHelpOpen={(open) => this.setState({ helpOpen: open })}
        onResetCode={() => ChallengeController["reset-code"](this)}
        canDebug={this.state.editorState === ChallengeStatus.READY}
        canReset={this.state.editorState === ChallengeStatus.READY}
        onUpload={this.handleUpload}
      />
    );
  }

  render() {
    if (this.state.errorLoading) {
      return <p>The challenges files cannot be found. Have they been moved?</p>;
    } else if (this.props.layout === "fullscreen") {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
            flexDirection: "column",
          }}
        >
          {this.renderHeader()}
          <Allotment
            className="h-100"
            defaultSizes={[65, 35]}
            ref={this.allotmentGuideRef}
          >
            <Allotment.Pane>
              <Allotment vertical>
                <Allotment.Pane>{this.renderEditor()}</Allotment.Pane>
                <Allotment.Pane
                  visible={this.getVisibilityWithHack(
                    !this.state.editorFullScreen
                  )}
                  maxSize={550}
                  minSize={450}
                >
                  {this.renderOutput()}
                </Allotment.Pane>
              </Allotment>
            </Allotment.Pane>
            <Allotment.Pane
              visible={this.getVisibilityWithHack(!this.state.editorFullScreen)}
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
          <BookControlFabs
            onNavigateToPrevPage={this.props.onRequestPreviousChallenge}
            onNavigateToNextPage={this.props.onRequestNextChallenge}
            onOpenMenu={() =>
              this.props.openBookDrawer
                ? this.props.openBookDrawer(true)
                : undefined
            }
          />
        </Box>
      );
    } else {
      return (
        <Box sx={{ width: "100%", height: "100%" }}>
          <Box sx={{ p: 2 }}>{this.renderGuide()}</Box>
          <Box sx={{ height: "600px" }}>{this.renderEditor()}</Box>
          {this.renderMainControls()}
          <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
            {this.renderOutput()}
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
