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
import HeaderBar from "../components/HeaderBar";
import "allotment/dist/style.css";
import { throttle } from "lodash";
import ChallengeStatus from "../models/ChallengeStatus";
import { TestResults } from "../models/Tests";
import { AdditionalFiles } from "../models/AdditionalFiles";
import DebugContext from "../models/DebugContext";
import BookNodeModel from "../models/BookNodeModel";
import Help from "./components/Help";
import Outputs, { OutputsHandle } from "./components/Outputs";

import ChallengeTypes from "../models/ChallengeTypes";

import ChallengeContext, { ChallengeContextClass } from "./ChallengeContext";

import "./Challenge.css";
import IChallenge, { IChallengeProps } from "./IChallenge";
import EditableBookStore from "../book/utils/EditableBookStore";

import BookZipper from "../book/utils/BookZipper";
import HeaderButtonsEditor from "./components/HeaderButtonsEditor";
import HeaderMenuEditor from "./components/HeaderMenuEditor";
import InfoDialog from "../components/dialogs/InfoDialog";
import SaveDialog, { SaveDialogProps } from "../components/dialogs/SaveDialog";
import { SessionContextType } from "../auth/SessionContext";

type ChallengeEditorState = {
  starterCode: string | null;
  savedCode: string | null;
  guideMd: string;
  debugContext: DebugContext;
  editorFullScreen: boolean;
  consoleText: string;
  editorState: ChallengeStatus;
  testResults: TestResults;
  testsPassing: boolean | undefined;
  helpOpen: boolean;
  guideMinimised: boolean;
  typ: ChallengeTypes; // use this in favour of the props.typ
  usesFixedInput: boolean;
  isEditingGuide: boolean;
  hasEdited: boolean;
  dialogInfoText?: string;
  saveDialogProps?: SaveDialogProps;
};

type ChallengeEditorProps = IChallengeProps & {
  bookStore: EditableBookStore;
  title?: string;
  isExample?: boolean;
  authContext: SessionContextType;
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
  workerFullyInitialised: boolean = false;
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
    testsPassing: undefined,
    helpOpen: false,
    guideMinimised: false,
    typ: ChallengeTypes.TYP_PY,
    usesFixedInput: false,
    isEditingGuide: false,
    dialogInfoText: undefined,
    hasEdited: false,
    saveDialogProps: undefined,
  };

  constructor(props: ChallengeEditorProps) {
    super(props);
    this.getVisibilityWithHack.bind(this);
    this.exportAsZip.bind(this);
    this.save.bind(this);
    this.actionWithSaveCheck.bind(this);
  }

  nodeToJson(node: BookNodeModel) {
    let proxy = {
      name: node.name,
      isExample: node.isExample,
      typ: node.typ,
      tests: node.tests,
      additionalFiles: node.additionalFiles,
    };
    return JSON.stringify(proxy, null, 2);
  }

  componentDidMount() {
    console.log("crossOriginIsolated", window.crossOriginIsolated);
    this.chContext.actions["fetch-code"](); // from local storage
    this.chContext.actions["fetch-guide"](); // from local storage
    this.chContext.actions["restart-worker"]({ force: true });
    this.jsonEditorRef.current?.setValue(this.nodeToJson(this.props.bookNode));
  }

  componentDidUpdate(
    prevProps: ChallengeEditorProps,
    prevState: ChallengeEditorState
  ) {
    if (prevProps.guidePath !== this.props.guidePath) {
      this.chContext.actions["fetch-guide"](); // from local storage
      this.setState({ hasEdited: false });
    }

    if (prevProps.codePath !== this.props.codePath) {
      this.chContext.actions["fetch-code"](); // from local storage
      this.setState({
        typ: (this.props.typ as ChallengeTypes) || ChallengeTypes.TYP_PY,
      });
      this.chContext.actions["restart-worker"]({});
      this.setState({ testResults: [], testsPassing: undefined });
      this.setState({ hasEdited: false });
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

    if (this.state.testsPassing !== prevState.testsPassing) {
      if (this.props.progressStorage) {
        this.props.progressStorage.setResult(
          this.props.bookNode,
          this.state.testsPassing,
          this.chContext.actions["get-code"]()
        );
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
      .fetchBook(this.props.authContext)
      .then((bfr) =>
        new BookZipper(this.props.fetcher).zipBook(
          bfr.book,
          this.props.authContext
        )
      )
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
  };

  previewAsZip = () => {
    this.props.fetcher
      .fetchBook(undefined)
      .then((bfr) =>
        new BookZipper(this.props.fetcher).zipBook(
          bfr.book,
          this.props.authContext
        )
      )
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
        this.setState({
          dialogInfoText: `${
            window.location.href.split("?")[0]
          }?bk=book.json&zip-data=${base64data}`,
        });
      });
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
    if (editedNode.additionalFiles !== this.props.additionalFiles) {
      changed = true;
      this.props.bookNode.additionalFiles = editedNode.additionalFiles;
    }    
    if (changed) {
      this.props.bookStore.store.saveBook();
      this.props.onBookModified();
    }
    this.setState({ hasEdited: false });
  };

  actionWithSaveCheck = (action: (() => void) | undefined) => () => {
    if (!action) {
      return;
    }
    if (!this.state.hasEdited) {
      action();
      return;
    }
    this.setState({
      saveDialogProps: {
        open: true,
        onSave: () => {
          this.save();
          action();
          this.setState({ saveDialogProps: undefined });
        },
        onClose: () => {
          action();
          this.setState({ saveDialogProps: undefined });
        },
      },
    });
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
          sx={{ width: "100%", height: "100%", overflowY: "auto" }}
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
              onHelpOpen={(open) => this.setState({ helpOpen: open })}
              menuItems={
                <HeaderMenuEditor
                  onBookDownload={this.exportAsZip}
                  onBookExportAsUrl={this.previewAsZip}
                  onUsingFixedInputChange={(fixedInput) =>
                    this.setState({ usesFixedInput: fixedInput })
                  }
                  usingFixedInput={this.state.usesFixedInput}
                />
              }
            >
              <HeaderButtonsEditor
                editingGuide={this.state.isEditingGuide}
                onEditingGuideChange={(editing) =>
                  this.setState({
                    isEditingGuide: editing,
                    hasEdited: this.state.hasEdited || editing,
                  })
                }
              />
            </HeaderBar>

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
              onNavigateToPrevPage={this.actionWithSaveCheck(
                this.props.onRequestPreviousChallenge
              )}
              onNavigateToNextPage={this.actionWithSaveCheck(
                this.props.onRequestNextChallenge
              )}
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
        <InfoDialog
          title="Export as URL"
          open={this.state.dialogInfoText ? true : false}
          text={this.state.dialogInfoText}
          onClose={() => this.setState({ dialogInfoText: undefined })}
        />
        <SaveDialog
          open={this.state.saveDialogProps ? true : false}
          onSave={this.state.saveDialogProps?.onSave || (() => {})}
          onClose={this.state.saveDialogProps?.onClose || (() => {})}
          message="You might have unsaved changes on this page. Would you like to save first?"
          cancelText="Don't save"
        ></SaveDialog>
      </ChallengeContext.Provider>
    );
  }
}

export default ChallengeEditor;
