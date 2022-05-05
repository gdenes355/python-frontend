import React from "react";
import { saveAs } from "file-saver";
import { Box, Card, CardContent, TextField, Paper } from "@mui/material";

import DebugPane from "../components/DebugPane";
import PyEditor, { PyEditorHandle } from "./components/Editors/PyEditor";
import JsonEditor, { JsonEditorHandle } from "./components/Editors/JsonEditor";
import { ParsonsEditorHandle } from "./components/Editors/ParsonsEditor";
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
import Help from "./components/Help";
import Outputs, { OutputsHandle } from "./components/Outputs";

import ChallengeTypes from "../models/ChallengeTypes";

import ChallengeContext, { ChallengeContextClass } from "./ChallengeContext";

import "./Challenge.css";
import IChallenge from "./IChallenge";
import IBookFetcher from "../book/utils/IBookFetcher";
import EditableBookStore from "../book/utils/EditableBookStore";

import BookZipper from "../book/utils/BookZipper";

type ChallengeEditorState = {
  starterCode: string | null;
  savedCode: string | null;
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

type ChallengeEditorProps = {
  uid: string;
  bookStore: EditableBookStore;
  guidePath: string;
  codePath: string;
  bookNode: BookNodeModel;
  title?: string;
  typ?: "py" | "parsons" | "canvas";
  tests?: TestCases | null;
  isExample?: boolean;
  fetcher: IBookFetcher;
  onTestsPassingChanged?: (passing: boolean | null) => void;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
  onBookModified: () => void;
};

class ChallengeEditor
  extends React.Component<ChallengeEditorProps, ChallengeEditorState>
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

  printCallback = throttle(
    () => this.setState({ consoleText: this.currentConsoleText }),
    100
  );

  state: ChallengeEditorState = {
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
    isEditingGuide: false,
  };

  constructor(props: ChallengeEditorProps) {
    super(props);
    this.getVisibilityWithHack.bind(this);
    this.exportAsZip.bind(this);
    this.save.bind(this);
  }

  nodeToJson(node: BookNodeModel) {
    let proxy = {
      name: node.name,
      isExample: node.isExample,
      typ: node.typ,
      tests: node.tests,
    };
    return JSON.stringify(proxy, null, 2);
  }

  componentDidMount() {
    console.log("crossOriginIsolated", window.crossOriginIsolated);
    this.chContext.actions["fetch-code"](); // from local storage
    this.chContext.actions["fetch-guide"](); // from local storage
    navigator.serviceWorker.register("pysw.js").then(function (reg) {
      if (navigator.serviceWorker.controller === null || !reg.active) {
        window.location.reload();
      }
    });
    this.chContext.actions["restart-worker"]({ force: true });
    this.jsonEditorRef.current?.setValue(this.nodeToJson(this.props.bookNode));
  }

  componentDidUpdate(
    prevProps: ChallengeEditorProps,
    prevState: ChallengeEditorState
  ) {
    if (prevProps.guidePath !== this.props.guidePath) {
      this.chContext.actions["fetch-guide"](); // from local storage
    }

    if (prevProps.codePath !== this.props.codePath) {
      this.chContext.actions["fetch-code"](); // from local storage
      this.setState({
        typ: (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY,
      });
      this.chContext.actions["restart-worker"]({});
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

    if (this.props.bookNode !== prevProps.bookNode) {
      this.jsonEditorRef.current?.setValue(
        this.nodeToJson(this.props.bookNode)
      );
    }
  }

  exportAsZip = () => {
    this.props.fetcher
      .fetchBook()
      .then((bfr) => new BookZipper(this.props.fetcher).zipBook(bfr.book))
      .then((zip) =>
        zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 9,
          },
        })
      )
      .then((blob) => saveAs(blob, "challenges.zip"));
    //.then((d) => console.log(encodeURIComponent(d)));
  };

  previewAsZip = () => {
    this.props.fetcher
      .fetchBook()
      .then((bfr) => new BookZipper(this.props.fetcher).zipBook(bfr.book))
      .then((zip) =>
        zip.generateAsync({
          type: "base64",
          compression: "DEFLATE",
          compressionOptions: {
            level: 9,
          },
        })
      )
      .then((result) => {
        const base64data = encodeURIComponent(result);
        window.open(
          `${
            window.location.href.split("?")[0]
          }?book=book.json&zip-data=${base64data}`
        );
      });
    //.then((d) => console.log(encodeURIComponent(d)));
  };

  save = () => {
    // saving the code
    this.props.bookStore.store.save(
      this.editorRef.current?.getValue() || "",
      this.props.codePath
    );

    // saving the guide is easy
    this.props.bookStore.store.save(this.state.guideMd, this.props.guidePath);

    // update the book from json
    let changed = false;
    let editedNode = JSON.parse(
      this.jsonEditorRef.current?.getValue() || ""
    ) as BookNodeModel;
    if (editedNode.name && editedNode.name !== this.props.bookNode.name) {
      changed = true;
      this.props.bookNode.name = editedNode.name;
    }
    if (editedNode.isExample !== this.props.bookNode.isExample) {
      changed = true;
      this.props.bookNode.isExample = editedNode.isExample;
    }
    if (editedNode.typ !== this.props.bookNode.typ) {
      changed = true;
      this.props.bookNode.typ = editedNode.typ;
    }
    if (editedNode.tests !== this.props.tests) {
      changed = true;
      this.props.bookNode.tests = editedNode.tests;
    }
    if (changed) {
      this.props.bookStore.store.saveBook();
      this.props.onBookModified();
    }
  };

  getVisibilityWithHack = (visible: boolean) => {
    // allotment seems to dislike visibility=true during load time
    return this.state.editorState === ChallengeStatus.LOADING
      ? undefined
      : visible;
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
            canSubmit={false}
            testResults={[]}
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
              showEditTools={true}
              showUploadBookZip={false}
              editingGuide={this.state.isEditingGuide}
              onHelpOpen={(open) => this.setState({ helpOpen: open })}
              canDebug={this.state.editorState === ChallengeStatus.READY}
              canReset={this.state.editorState === ChallengeStatus.READY}
              onBookDownload={this.exportAsZip}
              onBookExportAsUrl={this.previewAsZip}
              onUsingFixedInputChange={(fixedInput) =>
                this.setState({ usesFixedInput: fixedInput })
              }
              onEditingGuideChange={(editing) =>
                this.setState({ isEditingGuide: editing })
              }
            />

            <Allotment className="h-100" defaultSizes={[650, 350]}>
              <Allotment.Pane>
                <Allotment vertical defaultSizes={[650, 350]}>
                  <Allotment.Pane>
                    <PyEditor
                      ref={this.editorRef}
                      canRun={this.state.editorState === ChallengeStatus.READY}
                      canPlaceBreakpoint={
                        this.state.editorState === ChallengeStatus.READY ||
                        this.state.editorState ===
                          ChallengeStatus.AWAITING_INPUT ||
                        this.state.editorState === ChallengeStatus.ON_BREAKPOINT
                      }
                      isOnBreakPoint={
                        this.state.editorState === ChallengeStatus.ON_BREAKPOINT
                      }
                      debugContext={this.state.debugContext}
                      starterCode={this.state.starterCode || ""}
                      onToggleFullScreen={() => {
                        this.setState((state) => {
                          return { editorFullScreen: !state.editorFullScreen };
                        });
                      }}
                    />
                  </Allotment.Pane>
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
                      json={
                        <JsonEditor
                          ref={this.jsonEditorRef}
                          starterCode={this.nodeToJson(this.props.bookNode)}
                          onToggleFullScreen={() => {
                            this.setState((state) => {
                              return {
                                editorFullScreen: !state.editorFullScreen,
                              };
                            });
                          }}
                        />
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
              onSave={this.save}
            />
          </Box>
          <Box>
            {!this.state.guideMinimised ? undefined : (
              <div>{this.renderMainControls()}</div>
            )}
          </Box>
        </Paper>
      </ChallengeContext.Provider>
    );
  }
}

export default ChallengeEditor;
