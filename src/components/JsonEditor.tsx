import React, { useImperativeHandle, useRef, useEffect } from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

type JsonEditorProps = {
  starterCode: string;
  theme: string;
  onToggleFullScreen: () => void;
};

type JsonEditorHandle = {
  getValue: () => string;
  setValue: (value: string) => void;
  revealLine: (lineNo: number) => void;
};

const JsonEditor = React.forwardRef<JsonEditorHandle, JsonEditorProps>(
  (props, ref) => {
    const propsRef = useRef<JsonEditorProps | null>(null);
    useEffect(() => {
      propsRef.current = props;
    }, [props]);

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);

    const getValue = () => {
      return editorRef?.current?.getValue() || "";
    };

    const setValue = (value: string) => {
      editorRef.current?.setValue(value);
    };

    const revealLine = (lineNo: number) => {
      editorRef.current?.revealLine(lineNo);
    };

    useImperativeHandle(ref, () => ({
      getValue,
      setValue,
      revealLine,
    }));

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
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
    };
    return (
      <Editor
        className={"theme-" + props.theme}
        width="100%"
        height="100%"
        defaultLanguage="json"
        value={props.starterCode}
        onMount={handleEditorDidMount}
        theme={props.theme}
        options={{
          scrollBeyondLastLine: false,
          tabSize: 2,
          detectIndentation: false,
          glyphMargin: true,
          wordWrap: "on",
          lineNumbersMinChars: 4,
          padding: { top: 10 },
        }}
      />
    );
  }
);

export default JsonEditor;
export { JsonEditorHandle };
