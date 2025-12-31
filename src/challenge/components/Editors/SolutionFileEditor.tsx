import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import EditableBookStore from "../../../book/utils/EditableBookStore";
import BookNodeModel, { Solution } from "../../../models/BookNodeModel";
import { Box, Button } from "@mui/material";
import { Editor, Monaco, OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import VsThemeContext from "../../../themes/VsThemeContext";

type SolutionFileEditorProps = {
  onChange?: () => void;
  bookNode: BookNodeModel;
  bookStore?: EditableBookStore;
  solutionFile: string | undefined;
};

type SolutionFileEditorHandle = {
  getSolutionObject: () => Solution | undefined;
  getSolutionValue: () => string | undefined;
};

const SolutionFileEditor = forwardRef<
  SolutionFileEditorHandle,
  SolutionFileEditorProps
>(({ solutionFile, bookNode, onChange }, ref) => {
  const [hasSolution, setHasSolution] = useState<boolean>(
    solutionFile ? true : false
  );

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const themeContext = useContext(VsThemeContext);
  const lastSetValue = useRef<string | null>(null);

  useEffect(() => {
    setHasSolution(solutionFile ? true : false);
  }, [bookNode, solutionFile]);

  const getSolutionPath = () => {
    if (bookNode?.sol?.file) {
      return bookNode.sol.file;
    }
    if (!hasSolution) {
      return undefined;
    }
    const pyFileName = bookNode.py?.split("/").pop() || bookNode.id + ".py";
    const pyRoot = bookNode.py?.split("/").slice(0, -1).join("/") || "";
    if (pyRoot) {
      return pyRoot + "/solutions/" + pyFileName;
    }
    return "solutions/" + pyFileName;
  };

  const setValue = useCallback(
    (value: string) => {
      lastSetValue.current = value;
      editorRef.current?.setValue(value);

      const ms = editorRef.current
        ?.getModel()
        ?.findMatches(bookNode.id, true, false, true, null, true);

      if (ms && ms.length > 0) {
        editorRef.current?.revealRangeAtTop(
          ms[0].range,
          monaco.editor.ScrollType.Smooth
        );
        ms.forEach((m) => {
          editorRef.current?.deltaDecorations(
            [],
            [
              {
                range: m.range,
                options: {
                  isWholeLine: true,
                  className: "breakpoint-hit",
                },
              },
            ]
          );
        });
      }
    },
    [bookNode.id]
  );

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monacoRef.current?.languages.json.jsonDefaults.setDiagnosticsOptions({
      enableSchemaRequest: true,
      validate: true,
    });
    setValue(lastSetValue.current || "");
  };

  useEffect(() => {
    setValue(solutionFile || "");
  }, [solutionFile, setValue]);

  useImperativeHandle(ref, () => ({
    getSolutionObject: () => {
      if (!hasSolution || !editorRef.current?.getValue()) {
        return undefined;
      }
      return {
        file: getSolutionPath() || "",
        showSolution: false,
      };
    },
    getSolutionValue: () => editorRef.current?.getValue() || undefined,
  }));

  if (!hasSolution) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            setHasSolution(true);
            setValue(
              `print('Write your solution to "${bookNode.name}" here')\n`
            );
            onChange?.();
          }}
        >
          Create a solution file
        </Button>
      </div>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box sx={{ width: "100%", height: "100%" }}>
        <Editor
          className={"theme-" + themeContext.theme}
          width="100%"
          height="95%"
          defaultLanguage="python"
          value={lastSetValue.current || "loading..."}
          onMount={handleEditorDidMount}
          theme={themeContext.theme}
          onChange={() => {}}
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
      </Box>
    </Box>
  );
});

export default SolutionFileEditor;
export type { SolutionFileEditorHandle };
