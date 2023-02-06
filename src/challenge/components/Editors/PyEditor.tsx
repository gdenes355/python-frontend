import React, {
  useState,
  useImperativeHandle,
  useRef,
  useEffect,
  useContext,
} from "react";
import Editor, { loader, OnMount, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "./PyEditor.css";

import DebugContext from "../../../models/DebugContext";

import ChallengeContext from "../../ChallengeContext";
import VsThemeContext from "../../../themes/VsThemeContext";

const STANDALONE_BUILD = false;
if (STANDALONE_BUILD) {
  loader.config({
    paths: { vs: "/static/cdn-mirror/monaco-editor@0.34.1/min/vs" },
  });
}
type PyEditorProps = {
  canRun: boolean;
  isOnBreakPoint: boolean;
  canPlaceBreakpoint: boolean;
  starterCode: string;
  debugContext: DebugContext;
  onToggleFullScreen: () => void;
};

type PyEditorHandle = {
  getValue: () => string;
  setValue: (value: string) => void;
  getBreakpoints: () => number[];
  revealLine: (lineno: number) => void;
  updateEditorDecorations: () => void;
  download: () => void;
};

const PyEditor = React.forwardRef<PyEditorHandle, PyEditorProps>(
  (props, ref) => {
    const propsRef = useRef<PyEditorProps | null>(null);
    useEffect(() => {
      propsRef.current = props;
    }, [props]);

    const themeContext = useContext(VsThemeContext);

    const challengeContext = useContext(ChallengeContext);

    const breakpointList = useRef<number[]>([]);
    const decorator = useRef<string[]>([]);

    const downloadEl = useRef<HTMLAnchorElement>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const canRunCondition = useRef<null | monaco.editor.IContextKey<boolean>>(
      null
    );
    const canStepCondition = useRef<null | monaco.editor.IContextKey<boolean>>(
      null
    );
    const canPlaceBreakpointCondition =
      useRef<null | monaco.editor.IContextKey<boolean>>(null);

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);

    const getValue = () => {
      return editorRef?.current?.getValue() || "";
    };

    const setValue = (value: string) => {
      editorRef.current?.setValue(value);
      breakpointList.current = [];
    };

    const getBreakpoints = () => {
      return breakpointList?.current || [];
    };

    const revealLine = (lineNo: number) => {
      editorRef.current?.revealLine(lineNo);
    };

    useImperativeHandle(ref, () => ({
      getValue,
      setValue,
      getBreakpoints,
      revealLine,
      updateEditorDecorations,
      download,
    }));

    useEffect(() => {
      canRunCondition?.current?.set(props.canRun);
    }, [props.canRun, canRunCondition]);
    useEffect(() => {
      canStepCondition?.current?.set(props.isOnBreakPoint);
    }, [props.isOnBreakPoint, canStepCondition]);
    useEffect(() => {
      canPlaceBreakpointCondition?.current?.set(props.canPlaceBreakpoint);
    }, [props.canPlaceBreakpoint, canPlaceBreakpointCondition]);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      canRunCondition.current = editor.createContextKey("canRun", false);
      canStepCondition.current = editor.createContextKey("canStep", false);
      canPlaceBreakpointCondition.current = editor.createContextKey(
        "canPlaceBreakpoint",
        false
      );

      editor.onMouseDown((event) => {
        if (event.target.type === 2) {
          let lineNum = event.target.position.lineNumber;
          toggleBreakpoint(lineNum);
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
          download();
        },
      });

      editor.addAction({
        id: "togglefullscreen",
        label: "Toggle Full Screen Editor",
        keybindings: [monaco.KeyCode.F11],
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        run: () => {
          props.onToggleFullScreen();
        },
      });

      editor.addAction({
        id: "debug",
        label: "Debug: Start Debugging",
        keybindings: [monaco.KeyCode.F5],
        precondition: "canRun",
        contextMenuGroupId: "1_debug",
        contextMenuOrder: 1.5,
        run: () => challengeContext?.actions["debug"](),
      });

      editor.addAction({
        id: "debug-continue",
        label: "Debug: Continue",
        keybindings: [monaco.KeyCode.F5],
        precondition: "canStep",
        contextMenuGroupId: "1_debug",
        contextMenuOrder: 1.5,
        run: () => challengeContext?.actions["continue"](),
      });

      editor.addAction({
        id: "debug-step-into",
        label: "Debug: Step Into",
        keybindings: [monaco.KeyCode.F10],
        precondition: "canStep",
        contextMenuGroupId: "1_debug",
        contextMenuOrder: 1.5,
        run: () => challengeContext?.actions["step"](),
      });

      editor.addAction({
        id: "debug-stop",
        label: "Debug: Stop",
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F5],
        precondition: "canStep",
        contextMenuGroupId: "1_debug",
        contextMenuOrder: 1.5,
        run: () => challengeContext?.actions["kill"](),
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
            toggleBreakpoint(pos.lineNumber);
          }
        },
      });

      monaco.languages.registerHoverProvider("python", {
        provideHover: (model, position) => {
          // Log the current word in the console, you probably want to do something else here.
          if (props.isOnBreakPoint) {
            let word = model.getWordAtPosition(position);
            if (
              word?.word !== undefined &&
              props.debugContext.env.has(word.word)
            ) {
              return {
                contents: [
                  {
                    value:
                      "```text\n" +
                      props.debugContext.env.get(word.word) +
                      "\n```",
                  },
                ],
              };
            }
          }
        },
      });
    };

    const handleEditorChange = () => {
      if ((breakpointList.current?.length || 0) > 0) {
        updateEditorDecorations();
      }
    };

    const updateEditorDecorations = () => {
      if (!monacoRef.current || !editorRef.current || !breakpointList) {
        return;
      }

      let decorations: monaco.editor.IModelDecoration[] =
        breakpointList.current.map((ln) => {
          return {
            id: "",
            ownerId: 0,
            range: new monaco.Range(ln, 1, ln, 1),
            options: {
              isWholeLine: true,
              className:
                props.isOnBreakPoint && props.debugContext.lineno === ln
                  ? "breakpoint-hit"
                  : "breakpoint-waiting",
              glyphMarginClassName: "breakpoint-margin",
            },
          };
        });
      if (
        props.isOnBreakPoint &&
        props.debugContext.lineno &&
        !breakpointList.current?.includes(props.debugContext.lineno)
      ) {
        decorations.push({
          id: "",
          ownerId: 0,
          range: new monacoRef.current.Range(
            props.debugContext.lineno,
            1,
            props.debugContext.lineno,
            1
          ),
          options: {
            isWholeLine: true,
            className: "breakpoint-hit",
          },
        });
      }
      decorator.current = editorRef.current.deltaDecorations(
        decorator.current,
        decorations
      );
    };

    const toggleBreakpoint = (lineNum: number) => {
      if (!breakpointList.current || !propsRef.current?.canPlaceBreakpoint) {
        return;
      }
      if (breakpointList.current.includes(lineNum)) {
        let index = breakpointList.current.indexOf(lineNum);
        breakpointList.current.splice(index, 1);
      } else {
        breakpointList.current.push(lineNum);
      }
      challengeContext?.actions["breakpoints-updated"]();
      updateEditorDecorations();
    };

    const download = () => {
      let code = getValue();
      const url = URL.createObjectURL(new Blob([code]));
      setDownloadUrl(url);
    };

    useEffect(() => {
      if (downloadUrl) {
        downloadEl.current?.click();
        URL.revokeObjectURL(downloadUrl); // free up storage--no longer needed.
        setDownloadUrl(null);
      }
    }, [downloadUrl]);

    if (props.starterCode == null) {
      return <p>Loading code...</p>;
    }
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <Editor
          className={"theme-" + themeContext.theme}
          width="100%"
          height="100%"
          defaultLanguage="python"
          value={props.starterCode}
          onMount={handleEditorDidMount}
          theme={themeContext.theme}
          options={{
            scrollBeyondLastLine: false,
            tabSize: 2,
            detectIndentation: false,
            glyphMargin: true,
            wordWrap: "on",
            lineNumbersMinChars: 4,
            padding: { top: 10 },
          }}
          onChange={handleEditorChange}
        />
        <a
          className="hidden"
          download="code.py"
          href={downloadUrl || undefined}
          ref={downloadEl}
        >
          download
        </a>
      </div>
    );
  }
);

export default PyEditor;
export { PyEditorHandle };
