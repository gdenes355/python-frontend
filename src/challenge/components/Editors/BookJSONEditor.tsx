import React, {
  useImperativeHandle,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useState,
} from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import VsThemeContext from "../../../themes/VsThemeContext";
import IBookFetcher, { clearBook } from "../../../book/utils/IBookFetcher";
import BookNodeModel from "../../../models/BookNodeModel";
import { Box, Button } from "@mui/material";
import ChallengeContext from "../../ChallengeContext";

type BookJsonEditorProps = {
  bookFetcher: IBookFetcher;
  onChange?: () => void;
  bookNode: BookNodeModel;
};

type BookJsonEditorHandle = {
  getValue: () => string;
};

const BookJsonEditor = React.forwardRef<
  BookJsonEditorHandle,
  BookJsonEditorProps
>((props, ref) => {
  const challengeContext = useContext(ChallengeContext);

  const themeContext = useContext(VsThemeContext);
  const propsRef = useRef<BookJsonEditorProps | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const [canBeSaved, setCanBeSaved] = useState<boolean>(false);
  const [hasValidationError, setHasValidationError] = useState<boolean>(false);

  const lastSetValue = useRef<string | null>(null);

  const getValue = () => {
    return editorRef?.current?.getValue() || "";
  };

  const setValue = useCallback(
    (value: string) => {
      lastSetValue.current = value;
      editorRef.current?.setValue(value);

      const ms = editorRef.current
        ?.getModel()
        ?.findMatches(props.bookNode.id, true, false, true, null, true);

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
    [props.bookNode.id]
  );

  useImperativeHandle(ref, () => ({
    getValue,
  }));

  useEffect(() => {
    if (props.bookFetcher) {
      props.bookFetcher.fetchBook().then((res) => {
        const book = clearBook(JSON.parse(JSON.stringify(res.book)));
        setValue(JSON.stringify(book, null, 2));
      });
    }
    setCanBeSaved(false);
    setHasValidationError(false);
  }, [props.bookFetcher, props.bookNode, setValue]);

  const onValidate = () => {
    const markers = monacoRef.current?.editor.getModelMarkers({});
    if (!markers || markers.length === 0) {
      setCanBeSaved(lastSetValue.current !== editorRef.current?.getValue());
      setHasValidationError(false);
    } else {
      setCanBeSaved(false);
      setHasValidationError(true);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monacoRef.current?.languages.json.jsonDefaults.setDiagnosticsOptions({
      enableSchemaRequest: true,
      validate: true,
    });
    setValue(lastSetValue.current || "");
  };
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box sx={{ height: "5%" }}>
        Edit book.json manually (advanced users)
        {hasValidationError ? (
          <span style={{ color: "red", marginLeft: "10px" }}>
            JSON has errors
          </span>
        ) : null}
        <Button
          variant="contained"
          sx={{ float: "right" }}
          onClick={() => {
            const v = editorRef.current?.getValue();
            if (v) {
              challengeContext?.actions["save-book"](v);
            }
          }}
          disabled={!canBeSaved}
        >
          Save json
        </Button>
      </Box>

      <Editor
        className={"theme-" + themeContext.theme}
        width="100%"
        height="95%"
        defaultLanguage="json"
        value={lastSetValue.current || "loading..."}
        onMount={handleEditorDidMount}
        onValidate={onValidate}
        theme={themeContext.theme}
        onChange={(e) => {
          if (lastSetValue.current !== e) {
            props.onChange?.();
            setCanBeSaved(true);
          } else {
            setCanBeSaved(false);
          }
        }}
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
  );
});

export default BookJsonEditor;
export { BookJsonEditorHandle };
