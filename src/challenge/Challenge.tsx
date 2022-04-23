import React from "react";
import { Box, Card, CardContent, TextField } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import DebugPane from "../components/DebugPane";
import PyEditor, { PyEditorHandle } from "../components/PyEditor";
import JsonEditor, { JsonEditorHandle } from "../components/JsonEditor";
import ParsonsEditor, {
  ParsonsEditorHandle,
} from "../components/ParsonsEditor";
import Console from "../components/Console";
import CanvasDisplay from "../components/CanvasDisplay/CanvasDisplay";
import Guide from "../components/Guide";
import MainControls from "./MainControls";
import BookControlFabs from "../components/BookControlFabs";
import TabbedView from "../components/TabbedView";
import { Allotment } from "allotment";
import HeaderBar from "./HeaderBar";
import "allotment/dist/style.css";

import Cookies from "js-cookie";
import { throttle } from "lodash";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestCases, TestResults } from "../models/Tests";
import DebugContext from "../models/DebugContext";
import BookNodeModel from "../models/BookNodeModel";
import IFetcher from "../utils/IFetcher";
import Help from "./Help";

import ChallengeTypes from "../models/ChallengeTypes";

import pageTheme, { darkTheme } from "../themes/pageTheme";

import ChallengeContext, { ChallengeContextClass } from "./ChallengeContext";

import "./Challenge.css";

type ChallengeState = {
  starterCode: string | null;
  savedCode: string | null;
  savedJSON: string | null;
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
  keyDownBuffer: Uint8Array | null;
  helpOpen: boolean;
  guideMinimised: boolean;
  typInferred: ChallengeTypes;
  isFixedInput: boolean;
  isEditingGuide: boolean;
  fixedUserInput: string;
};

type ChallengeProps = {
  uid?: string | null;
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

class Challenge extends React.Component<ChallengeProps, ChallengeState> {
  editorRef = React.createRef<PyEditorHandle>();
  jsonEditorRef = React.createRef<JsonEditorHandle>();
  parsonsEditorRef = React.createRef<ParsonsEditorHandle>();
  canvasDisplayRef = React.createRef<CanvasDisplay>();
  tabbedViewRef = React.createRef<TabbedView>();
  fileReader = new FileReader();

  currentConsoleText: string = "";
  currentFixedUserInput: string[] = [];
  bookExports: string[][] = [];

  chContext: ChallengeContextClass = new ChallengeContextClass(this);

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
    keyDownBuffer: null,
    helpOpen: false,
    guideMinimised: false,
    typInferred: ChallengeTypes.TYP_PY,
    isFixedInput: false,
    isEditingGuide: false,
    fixedUserInput: "",
  };

  constructor(props: ChallengeProps) {
    super(props);
    this.getVisibilityWithHack.bind(this);
    this.onBreakpointsUpdated.bind(this);
    this.print.bind(this);
    this.cls.bind(this);
    this.handleUpload.bind(this);
    this.handleEditingChange.bind(this);
    this.handleFileRead.bind(this);
    this.handleThemeChange.bind(this);
  }

  print(text: string) {
    this.currentConsoleText += text;
    this.printCallback();
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
      if (this.props.typ !== "parsons" && savedCode) {
        this.setState({ savedCode: savedCode });
      }
      let savedJSON = localStorage.getItem(
        "json-" + encodeURIComponent(this.props.uid)
      );
      if (savedJSON) {
        this.setState({ savedJSON: savedJSON });
      }
    }
    this.props.fetcher
      .fetch(this.props.guidePath)
      .then((response) => {
        if (!response.ok) {
          this.setState({ errorLoading: true });
        }
        return response.text();
      })
      .then((text) => this.setState({ guideMd: text }));
    this.props.fetcher
      .fetch(this.props.codePath)
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
    this.chContext.actions["restart-worker"]({ force: true });
  }

  componentDidUpdate(prevProps: ChallengeProps, prevState: ChallengeState) {
    if (prevProps.guidePath !== this.props.guidePath) {
      this.props.fetcher
        .fetch(this.props.guidePath)
        .then((response) => response.text())
        .then((text) => this.setState({ guideMd: text }));
    }

    if (prevProps.codePath !== this.props.codePath) {
      this.props.fetcher
        .fetch(this.props.codePath)
        .then((response) => response.text())
        .then((text) => this.setState({ starterCode: text }));
      this.setState({ typInferred: ChallengeTypes.TYP_PY });
      this.chContext.actions["restart-worker"]({});
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

  handleFileRead = (e: ProgressEvent<FileReader>) => {
    if (this.fileReader.result) {
      this.editorRef.current?.setValue(this.fileReader.result.toString());
    }
  };

  handleUpload = (file: File) => {
    this.fileReader = new FileReader();
    this.fileReader.onloadend = this.handleFileRead;
    this.fileReader.readAsText(file);
  };

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

  handleBookDownload = () => {
    this.chContext.actions["export-book"]({ contents: this.bookExports });
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
      this.setState({ breakpointsChanged: true });
    }
  };

  renderEditor() {
    if (this.state.isEditingGuide) {
      return (
        <JsonEditor
          ref={this.jsonEditorRef}
          starterCode={this.state.savedJSON || this.JSON_DEFAULT}
          theme={this.state.theme}
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
        theme={this.state.theme}
        onToggleFullScreen={() => {
          this.setState((state) => {
            return { editorFullScreen: !state.editorFullScreen };
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
          this.chContext.actions["input-entered"]({ input });
        }}
        onInterrupt={() => {
          this.chContext.actions["restart-worker"]({
            msg: "Interrupted...",
            force: true,
          });
        }}
      />
    );
  };

  renderFixedInput = () => {
    return (
      <Box sx={{ paddingLeft: 1, paddingRight: 1 }}>
        <Box sx={{ width: "100%", height: "100%" }}>
          <TextField
            placeholder="add fixed inputs here..."
            multiline
            margin="dense"
            value={this.state.fixedUserInput}
            onChange={(e) => {
              this.setState({ fixedUserInput: e.target.value });
            }}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{ width: "100%", height: "100%" }}
          />
        </Box>
      </Box>
    );
  };

  renderOutput = () => {
    let panes = [
      {
        label: "Console",
        content: this.renderConsole(),
        show: true,
      },
    ];

    if (this.state.isFixedInput) {
      panes.push({
        label: "Fixed input",
        content: this.renderFixedInput(),
        show: this.state.isFixedInput,
      });
    }

    if (
      this.props.typ === "canvas" ||
      this.state.typInferred === ChallengeTypes.TYP_CANVAS
    ) {
      panes.push({
        label: "Canvas",
        content: (
          <CanvasDisplay
            ref={this.canvasDisplayRef}
            onKeyDown={(e) => this.chContext.actions["canvas-keydown"](e)}
            onKeyUp={(e) => this.chContext.actions["canvas-keyup"](e)}
          />
        ),
        show: true,
      });
    }

    return (
      <ThemeProvider
        theme={this.state.theme === "vs-dark" ? darkTheme : pageTheme}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "background.default",
          }}
        >
          {panes.length > 1 ? (
            <TabbedView ref={this.tabbedViewRef} panes={panes} />
          ) : (
            this.renderConsole()
          )}
        </Box>
      </ThemeProvider>
    );
  };

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
    return <Guide md={this.state.guideMd} theme={this.state.theme} />;
  };

  renderHeader() {
    return (
      <HeaderBar
        title={this.props.title || this.props.bookNode?.name || ""}
        theme={this.state.theme}
        usingFixedInput={this.state.isFixedInput}
        showEditTools={this.props.showEditTools}
        editingGuide={this.state.isEditingGuide}
        onThemeChange={this.handleThemeChange}
        onHelpOpen={(open) => this.setState({ helpOpen: open })}
        onResetCode={() => {
          if (this.state.isEditingGuide) {
            this.chContext.actions["reset-json"]();
          } else {
            this.chContext.actions["reset-code"]();
          }
        }}
        canDebug={this.state.editorState === ChallengeStatus.READY}
        canReset={this.state.editorState === ChallengeStatus.READY}
        onUpload={this.handleUpload}
        onDownload={() => this.editorRef.current?.download()}
        onBookDownload={this.handleBookDownload}
        onAddToExport={this.handleAddToExport}
        onUsingFixedInputChange={(fixedInput) =>
          this.setState({ isFixedInput: fixedInput })
        }
        onEditingGuideChange={this.handleEditingChange}
      />
    );
  }

  render() {
    if (this.state.errorLoading) {
      return <p>The challenges files cannot be found. Have they been moved?</p>;
    } else {
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
              {this.renderHeader()}
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
                        this.props.typ === "canvas" ||
                        this.state.typInferred === ChallengeTypes.TYP_CANVAS
                          ? 450
                          : 150
                      }
                    >
                      {this.renderOutput()}
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
                  if (this.props.onRequestPreviousChallenge) {
                    this.props.onRequestPreviousChallenge();
                  }
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
                  if (this.props.openBookDrawer) {
                    this.props.openBookDrawer(true);
                  }
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
}

export default Challenge;
export { ChallengeState };
