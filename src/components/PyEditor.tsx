import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React from "react";
import "./PyEditor.css";

import DebugContext from "../models/DebugContext";

type PyEditorProps = {
  canRun: boolean;
  isOnBreakPoint: boolean;
  canPlaceBreakpoint: boolean;
  starterCode: string;
  theme: string;
  debugContext: DebugContext;
  readOnly?: boolean;
  onToggleFullScreen: () => void;
  onDebug: () => void;
  onContinue: () => void;
  onStepInto: () => void;
  onStop: () => void;
  onBreakpointsUpdated: () => void;
};

type PyEditorState = {
  downloadurl?: string;
};

class PyEditor extends React.Component<PyEditorProps, PyEditorState> {
  breakpointList: number[] = [];
  decorator: string[] = [];

  downloadEl = React.createRef<HTMLAnchorElement>();
  state = {
    downloadurl: undefined,
  };

  private canRunCondition: null | monaco.editor.IContextKey<boolean> = null;
  private canStepCondition: null | monaco.editor.IContextKey<boolean> = null;
  private canPlaceBreakpointCondition: null | monaco.editor.IContextKey<boolean> =
    null;

  private editorRef: monaco.editor.IStandaloneCodeEditor | null = null;
  private monacoRef: Monaco | null = null;

  constructor(props: PyEditorProps) {
    super(props);
    this.handleEditorDidMount.bind(this);
    this.updateEditorDecorations.bind(this);
    this.handleEditorChange.bind(this);
    this.getValue.bind(this);
    this.getBreakpoints.bind(this);
    this.toggleBreakpoint.bind(this);
    this.revealLine.bind(this);
    this.download.bind(this);
    this.downloadEl = React.createRef();
  }

  getValue() {
    return this.editorRef ? this.editorRef.getValue() : "";
  }

  getBreakpoints() {
    return this.breakpointList;
  }

  setValue(value: string) {
    if (this.editorRef) {
      this.editorRef.setValue(value);
      this.breakpointList = [];
    }
  }

  revealLine(lineNo: number) {
    if (this.editorRef) {
      this.editorRef.revealLine(lineNo);
    }
  }

  componentDidUpdate(prevProps: PyEditorProps) {
    if (
      this.canRunCondition &&
      this.canStepCondition &&
      this.canPlaceBreakpointCondition
    ) {
      if (prevProps.canRun !== this.props.canRun) {
        this.canRunCondition.set(this.props.canRun);
      }
      if (prevProps.isOnBreakPoint !== this.props.isOnBreakPoint) {
        this.canStepCondition.set(this.props.isOnBreakPoint);
      }
      if (prevProps.canPlaceBreakpoint !== this.props.canPlaceBreakpoint) {
        this.canPlaceBreakpointCondition.set(this.props.canPlaceBreakpoint);
      }
    }
  }

  handleEditorDidMount: OnMount = (editor, monaco) => {
    this.editorRef = editor;
    this.monacoRef = monaco;

    this.canRunCondition = editor.createContextKey("canRun", false);
    this.canStepCondition = editor.createContextKey("canStep", false);
    this.canPlaceBreakpointCondition = editor.createContextKey(
      "canPlaceBreakpoint",
      false
    );

    editor.onMouseDown((event) => {
      if (!this.props.canPlaceBreakpoint) {
        return;
      }
      if (event.target.type === 2) {
        let lineNum = event.target.position.lineNumber;
        this.toggleBreakpoint(lineNum);
      }
    });

    editor.addAction({
      id: "file-download",
      label: "File: Download",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS,
      ],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1,
      run: (ed) => {
        this.download();
      },
    });

    editor.addAction({
      id: "togglefullscreen",
      label: "Toggle Full Screen Editor",
      keybindings: [monaco.KeyCode.F11],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: () => {
        this.props.onToggleFullScreen();
      },
    });

    editor.addAction({
      id: "debug",
      label: "Debug: Start Debugging",
      keybindings: [monaco.KeyCode.F5],
      precondition: "canRun",
      contextMenuGroupId: "1_debug",
      contextMenuOrder: 1.5,
      run: () => {
        this.props.onDebug();
      },
    });

    editor.addAction({
      id: "debug-continue",
      label: "Debug: Continue",
      keybindings: [monaco.KeyCode.F5],
      precondition: "canStep",
      contextMenuGroupId: "1_debug",
      contextMenuOrder: 1.5,
      run: () => {
        this.props.onContinue();
      },
    });

    editor.addAction({
      id: "debug-step-into",
      label: "Debug: Step Into",
      keybindings: [monaco.KeyCode.F10],
      precondition: "canStep",
      contextMenuGroupId: "1_debug",
      contextMenuOrder: 1.5,
      run: () => {
        this.props.onStepInto();
      },
    });

    editor.addAction({
      id: "debug-stop",
      label: "Debug: Step Into",
      keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F5],
      precondition: "canStep",
      contextMenuGroupId: "1_debug",
      contextMenuOrder: 1.5,
      run: () => {
        this.props.onStop();
      },
    });

    editor.addAction({
      id: "breakpoint",
      label: "Debug: Toggle Breakpoint",
      keybindings: [monaco.KeyCode.F9],
      precondition: "canPlaceBreakpoint",
      contextMenuGroupId: "1_debug",
      contextMenuOrder: 1.5,
      run: (ed) => {
        let pos = ed.getPosition();
        if (pos) {
          this.toggleBreakpoint(pos.lineNumber);
        }
      },
    });

    monaco.languages.registerHoverProvider("python", {
      provideHover: (model, position) => {
        // Log the current word in the console, you probably want to do something else here.
        if (this.props.isOnBreakPoint) {
          let word = model.getWordAtPosition(position);
          if (
            word?.word !== undefined &&
            this.props.debugContext.env.has(word.word)
          ) {
            return {
              contents: [
                {
                  value:
                    "```text\n" +
                    this.props.debugContext.env.get(word.word) +
                    "\n```",
                },
              ],
            };
          }
        }
      },
    });
  };

  handleEditorChange = () => {
    if (this.breakpointList.length > 0) {
      this.updateEditorDecorations();
    }
  };

  updateEditorDecorations() {
    if (!this.monacoRef || !this.editorRef) {
      return;
    }

    let decorations: monaco.editor.IModelDecoration[] = this.breakpointList.map(
      (ln) => {
        return {
          id: "",
          ownerId: 0,
          range: new monaco.Range(ln, 1, ln, 1),
          options: {
            isWholeLine: true,
            className:
              this.props.isOnBreakPoint && this.props.debugContext.lineno === ln
                ? "breakpoint-hit"
                : "breakpoint-waiting",
            glyphMarginClassName: "breakpoint-margin",
          },
        };
      }
    );
    if (
      this.props.isOnBreakPoint &&
      this.props.debugContext.lineno &&
      !this.breakpointList.includes(this.props.debugContext.lineno)
    ) {
      decorations.push({
        id: "",
        ownerId: 0,
        range: new this.monacoRef.Range(
          this.props.debugContext.lineno,
          1,
          this.props.debugContext.lineno,
          1
        ),
        options: {
          isWholeLine: true,
          className: "breakpoint-hit",
        },
      });
    }
    this.decorator = this.editorRef.deltaDecorations(
      this.decorator,
      decorations
    );
  }

  toggleBreakpoint = (lineNum: number) => {
    if (!lineNum) {
      return;
    }
    if (this.breakpointList.includes(lineNum)) {
      let index = this.breakpointList.indexOf(lineNum);
      this.breakpointList.splice(index, 1);
    } else {
      this.breakpointList.push(lineNum);
    }
    this.props.onBreakpointsUpdated();
    this.updateEditorDecorations();
  };

  download = () => {
    console.log("downloading...");
    let code = this.getValue();
    const url = URL.createObjectURL(new Blob([code]));
    this.setState({ downloadurl: url }, () => {
      this.downloadEl.current?.click();
      URL.revokeObjectURL(url); // free up storage--no longer needed.
      this.setState({ downloadurl: undefined });
    });
  };

  render() {
    if (this.props.starterCode == null) {
      return <p>Loading code...</p>;
    }
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <Editor
          className={"theme-" + this.props.theme}
          width="100%"
          height="100%"
          defaultLanguage="python"
          value={this.props.starterCode}
          onMount={this.handleEditorDidMount}
          theme={this.props.theme}
          options={{
            scrollBeyondLastLine: false,
            tabSize: 2,
            detectIndentation: false,
            glyphMargin: true,
            wordWrap: "on",
            lineNumbersMinChars: 4,
            padding: { top: 10 },
            readOnly: this.props.readOnly,
          }}
          onChange={this.handleEditorChange}
        />
        <a
          className="hidden"
          download="code.py"
          href={this.state.downloadurl}
          ref={this.downloadEl}
        >
          download
        </a>
      </div>
    );
  }
}

export default PyEditor;
