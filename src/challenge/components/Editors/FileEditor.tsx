import React, {
  useImperativeHandle,
  useRef,
  useEffect,
  useContext,
} from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import VsThemeContext from "../../../themes/VsThemeContext";

import { Button, Grid } from "@mui/material";
import DropDownList, { DropDownListHandle } from "../DropDownList";

import ChallengeContext from "../../ChallengeContext";
import { AdditionalFile } from "../../../models/AdditionalFiles";

type FileEditorProps = {
  starterContent: string;
  onToggleFullScreen: () => void;
  files: Array<AdditionalFile>;
  enforceVisibility: boolean;
};

type FileEditorHandle = {
  getValue: () => string;
  setValue: (value: string) => void;
  revealLine: (lineNo: number) => void;
};

const FileEditor = React.forwardRef<FileEditorHandle, FileEditorProps>(
  (props, ref) => {
    const themeContext = useContext(VsThemeContext);
    const dropdownRef = useRef<DropDownListHandle | null>(null);
    const propsRef = useRef<FileEditorProps | null>(null);
    useEffect(() => {
      propsRef.current = props;
    }, [props]);

    const challengeContext = useContext(ChallengeContext);

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

    const loadFile = () => {
      if (dropdownRef?.current?.getValue() != null) {
        const isVis = props.files[dropdownRef.current.getIndex()].visible;
        if (!isVis && props.enforceVisibility) {
          setValue(
            "FILE HIDDEN - YOU CAN STILL ACTIVATE IT & READ IT VIA PYTHON."
          );
        } else {
          challengeContext?.actions["fetch-file"](
            dropdownRef.current.getValue()
          );
        }
      }
    };

    const activateFile = (activate: boolean = true) => {
      if (dropdownRef?.current?.getValue() != null) {
        challengeContext?.actions["activate-file"](
          dropdownRef.current.getValue(),
          activate
        );
      }
      const msg = activate
        ? "ACTIVATED & NOW AVAILABLE IN PYTHON"
        : "DEACTIVATED FROM PYTHON";
      setValue(msg);
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
      <Grid container height="100%">
        <Grid item xs={10}>
          <Editor
            className={"theme-" + themeContext.theme}
            width="100%"
            height="100%"
            defaultLanguage="txt"
            value={props.starterContent}
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
              readOnly: true,
            }}
          />
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            onClick={(
              event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null
            ) => loadFile()}
            fullWidth={true}
          >
            VIEW FILE
          </Button>
          <Button
            variant="contained"
            onClick={(
              event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null
            ) => activateFile()}
            fullWidth={true}
          >
            ACTIVATE
          </Button>
          <Button
            variant="contained"
            onClick={(
              event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null
            ) => activateFile(false)}
            fullWidth={true}
          >
            DEACTIVATE
          </Button>
          <DropDownList
            ref={dropdownRef}
            disabled={false}
            options={props.files.map((file: AdditionalFile) => file.filename)}
          />
        </Grid>
      </Grid>
    );
  }
);

export default FileEditor;
export { FileEditorHandle };