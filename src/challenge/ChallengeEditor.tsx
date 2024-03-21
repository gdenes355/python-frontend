import React, { MutableRefObject } from "react";
import { saveAs } from "file-saver";
import { Box, Card, CardContent, TextField, Paper } from "@mui/material";

import DebugPane from "./components/Debug/DebugPane";
import PyEditor, { PyEditorHandle } from "./components/Editors/PyEditor";
import JsonEditor, { JsonEditorHandle } from "./components/Editors/JsonEditor";
import { ParsonsEditorHandle } from "./components/Editors/ParsonsEditor";
import ChallengeConsole from "./components/BottomBar/ChallengeConsole";
import CanvasDisplay, {
  CanvasDisplayHandle,
} from "./components/BottomBar/CanvasDisplay/CanvasDisplay";
import FixedInputField, {
  FixedInputFieldHandle,
} from "./components/BottomBar/FixedInputField";
import Guide from "../components/Guide";
import MainControls from "./components/Guide/MainControls";
import BookControlFabs from "../book/components/BookControlFabs";
import { Allotment } from "allotment";
import HeaderBar from "../components/HeaderBar";
import "allotment/dist/style.css";
import { throttle } from "lodash";
import ChallengeStatus from "../models/ChallengeStatus";
import BookNodeModel from "../models/BookNodeModel";
import Help from "./components/Help";
import Outputs, { OutputsHandle } from "./components/BottomBar/Outputs";

import ChallengeTypes from "../models/ChallengeTypes";

import ChallengeContext, { ChallengeContextClass } from "./ChallengeContext";

import "./Challenge.css";
import IChallenge, { IChallengeProps, IChallengeState } from "./IChallenge";
import EditableBookStore from "../book/utils/EditableBookStore";

import BookZipper from "../book/utils/BookZipper";
import HeaderButtonsEditor from "./components/Header/HeaderButtonsEditor";
import HeaderMenuEditor from "./components/Header/HeaderMenuEditor";
import InfoDialog from "../components/dialogs/InfoDialog";
import SaveDialog, { SaveDialogProps } from "../components/dialogs/SaveDialog";
import { SessionContextType } from "../auth/SessionContext";
import PaneType from "../models/PaneType";
import AdditionalFileView, {
  AdditionalFileViewRef,
} from "./components/Editors/AdditionalFileView";
import { emptyDebugContext } from "../coderunner/DebugContext";

type ChallengeEditorState = IChallengeState & {
  savedCode: string | null;
  editorFullScreen: boolean;
  testsPassing: boolean | undefined;
  helpOpen: boolean;
  guideMinimised: boolean;
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
  canvasDisplayRef: MutableRefObject<CanvasDisplayHandle | null> =
    React.createRef<CanvasDisplayHandle | null>();
  fixedInputFieldRef = React.createRef<FixedInputFieldHandle>();
  outputsRef = React.createRef<OutputsHandle>();

  currentConsoleText: string = "";
  currentFixedUserInput: string[] = [];
  bookExports: string[][] = [];
  fileEditorRefs: Map<string, AdditionalFileViewRef> = new Map();

  chContext: ChallengeContextClass = new ChallengeContextClass(this);

  // non-UI (non-React) internal state
  breakpointsChanged: boolean = false;
  worker: Worker | null = null;
  workerFullyInitialised: boolean = false;
  interruptBuffer: Uint8Array | null = null;
  keyDownBuffer: Uint8Array | null = null;
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

  canvasPromiseResolve?: (value: any) => void;

  state: ChallengeEditorState = {
    starterCode: null,
    savedCode: null,
    consoleText: "Press debug to get started...",
    guideMd: "*Loading the guide... Please wait*",
    debugContext: emptyDebugContext,
    editorState: ChallengeStatus.LOADING,
    editorFullScreen: false,
    testResults: [],
    testsPassing: undefined,
    helpOpen: false,
    guideMinimised: false,
    typ: ChallengeTypes.py,
    origTyp: ChallengeTypes.py,
    usesFixedInput: false,
    isEditingGuide: false,
    dialogInfoText: undefined,
    hasEdited: false,
    saveDialogProps: undefined,
    additionalFilesLoaded: {},
    turtleExampleRendered: undefined,
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
      isAssessment: node.isAssessment,
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

      const challengeTyp =
        (this.props.typ as ChallengeTypes) || ChallengeTypes.py;

      this.setState({
        typ: challengeTyp,
        origTyp: challengeTyp,
      });

      this.chContext.actions["restart-worker"]({});
      this.setState({ testResults: [], testsPassing: undefined });
      this.setState({ hasEdited: false });
    }

    const files = (this.props.bookNode.additionalFiles || []).map(
      (file) => file.filename
    );

    this.props.bookNode.tests?.forEach((test) => {
      if (test.out instanceof Array) {
        test.out.forEach((out) => {
          if (out.filename && !files.includes(out.filename)) {
            files.push(out.filename);
          }
        });
      }
    });

    files.forEach((file) => {
      if (!(file in this.state.additionalFilesLoaded)) {
        this.chContext.actions["fetch-file"](file, this.props.bookStore).then(
          (text) =>
            this.setState({
              additionalFilesLoaded: {
                ...this.state.additionalFilesLoaded,
                [file]: text,
              },
            })
        );
      }
    });

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

    // saving the additional files or solution files
    let updatedFiles = new Map(
      this.getDisplayFiles().map((file, index) => {
        return [
          file,
          this.fileEditorRefs.get(file)?.getValue() ||
            this.state.additionalFilesLoaded[file],
        ];
      })
    );
    this.setState({ additionalFilesLoaded: Object.fromEntries(updatedFiles) });
    updatedFiles.forEach((text, file) => {
      if (text) {
        this.props.bookStore.store.save(text, file);
      }
    });

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
    if (editedNode.isAssessment !== this.props.bookNode.isAssessment) {
      changed = true;
      this.props.bookNode.isAssessment = editedNode.isAssessment;
    }
    if (editedNode.typ !== this.props.bookNode.typ) {
      changed = true;
      this.props.bookNode.typ = editedNode.typ;
    }
    if (editedNode.tests !== this.props.tests) {
      changed = true;
      this.props.bookNode.tests = editedNode.tests;
    }
    if (editedNode.additionalFiles !== this.props.bookNode.additionalFiles) {
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

  getDisplayFiles = () => {
    const files = (this.props.bookNode.additionalFiles || []).map(
      (file) => file.filename
    );

    this.props.bookNode.tests?.forEach((test) => {
      if (test.out instanceof Array) {
        test.out.forEach((out) => {
          if (out.filename && !files.includes(out.filename)) {
            files.push(out.filename);
          }
        });
      }
    });
    return files;
  };

  getDisplayFilesProperties = () => {
    const filesProperties = this.props.bookNode.additionalFiles || [];
    const files = (this.props.bookNode.additionalFiles || []).map(
      (file) => file.filename
    );

    this.props.bookNode.tests?.forEach((test) => {
      if (test.out instanceof Array) {
        test.out.forEach((out) => {
          if (out.filename && !files.includes(out.filename)) {
            filesProperties.push({
              filename: out.filename,
              visible: false,
            });
            files.push(out.filename);
          }
        });
      }
    });

    return filesProperties;
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
            canRunOnly={this.props.typ === "parsons"}
            canSubmit={false}
            testResults={[]}
            canKill={this.state.editorState === ChallengeStatus.RUNNING}
            isAssessment={!!this.props.isAssessment}
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
                hasUnsavedChanges={this.state.hasEdited}
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
                      this.state.typ === ChallengeTypes.canvas ? 450 : 150
                    }
                  >
                    <Outputs
                      ref={this.outputsRef}
                      visiblePanes={[
                        "console",
                        "json",
                        ...(this.state.typ === ChallengeTypes.canvas
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
                          onChange={() =>
                            this.state.hasEdited
                              ? undefined
                              : this.setState({
                                  hasEdited: this.state.hasEdited || true,
                                })
                          }
                        />
                      }
                      files={
                        this.getDisplayFiles().map((file, index) => (
                          <AdditionalFileView
                            key={index}
                            defaultValue={
                              this.state.additionalFilesLoaded[file]
                            }
                            readonly={false}
                            ref={(r) => {
                              if (r) {
                                this.fileEditorRefs.set(file, r);
                              } else {
                                this.fileEditorRefs.delete(file);
                              }
                            }}
                            onChange={() =>
                              this.state.hasEdited
                                ? undefined
                                : this.setState({
                                    hasEdited: this.state.hasEdited || true,
                                  })
                            }
                          />
                        )) || []
                      }
                      fileProperties={this.getDisplayFilesProperties()}
                      fileShowAll={true}
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
                      this.state.editorState ===
                        ChallengeStatus.RUNNING_WITH_DEBUGGER ||
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
