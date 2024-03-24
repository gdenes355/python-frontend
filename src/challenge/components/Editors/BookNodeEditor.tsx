import React, {
  useImperativeHandle,
  useRef,
  useEffect,
  useContext,
  useState,
  useMemo,
} from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import VsThemeContext from "../../../themes/VsThemeContext";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import BookNodeModel from "../../../models/BookNodeModel";
import ChallengeTypes from "../../../models/ChallengeTypes";
import { AdditionalFile } from "../../../models/AdditionalFiles";

import InputDialog from "../../../components/dialogs/InputDialog";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";

type BookNodeEditorProps = {
  onChange?: () => void;
  onToggleFullScreen: () => void;
  bookNode: BookNodeModel;
};

type BookNodeEditorHandle = {
  getValue: () => BookNodeModel;
};

const BookNodeEditor = React.forwardRef<
  BookNodeEditorHandle,
  BookNodeEditorProps
>((props, ref) => {
  // node model state
  const [name, setName] = useState<string>(props.bookNode.name);
  const [typ, setTyp] = useState<"py" | "parsons" | "canvas">(
    props.bookNode.typ || "py"
  );
  const [isExample, setIsExample] = useState<boolean>(
    props.bookNode.isExample || false
  );
  const [isAssessment, setIsAssessment] = useState<boolean>(
    props.bookNode.isAssessment || false
  );
  const [additionalFiles, setAdditionalFiles] = useState<AdditionalFile[]>([]);

  const jsonCode = useMemo(() => {
    return JSON.stringify({ tests: props.bookNode.tests }, null, 2);
  }, [props.bookNode]);

  // visual state
  const [addFileDialogOpen, setAddFileDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    setName(props.bookNode.name);
    setTyp(props.bookNode.typ || "py");
    setIsExample(props.bookNode.isExample || false);
    setIsAssessment(props.bookNode.isAssessment || false);
    setAdditionalFiles(props.bookNode.additionalFiles || []);
  }, [props.bookNode]);

  const themeContext = useContext(VsThemeContext);
  const propsRef = useRef<BookNodeEditorProps | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const getValue = () => {
    const json = editorRef?.current?.getValue() || "";
    let node = JSON.parse(json) as BookNodeModel;
    node.name = name;
    node.typ = typ;
    node.isExample = isExample && typ !== "parsons";
    node.isAssessment = isAssessment && typ !== "parsons";
    node.additionalFiles = additionalFiles;
    return node;
  };

  useImperativeHandle(ref, () => ({
    getValue,
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
    <>
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ height: "100%" }}>
          <Stack direction="column" spacing={3} sx={{ height: "100%" }}>
            <Stack direction="row" spacing={3}>
              <TextField
                variant="standard"
                size="small"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  props.onChange?.();
                }}
                placeholder="Name"
              />
              <Select
                variant="standard"
                label="type"
                size="small"
                value={typ}
                onChange={(e) => {
                  setTyp(e.target.value as ChallengeTypes);
                  props.onChange?.();
                }}
              >
                <MenuItem value="py">Python</MenuItem>
                <MenuItem value="parsons">Parsons</MenuItem>
                <MenuItem value="canvas">Canvas</MenuItem>
              </Select>
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={typ === "parsons"}
                    style={{ padding: 0 }}
                    checked={isExample}
                    value={isExample}
                    onChange={(e) => {
                      setIsExample(e.target.checked);
                      props.onChange?.();
                    }}
                  />
                }
                label="Example"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={typ === "parsons"}
                    style={{ padding: 0 }}
                    checked={isAssessment}
                    value={isAssessment}
                    onChange={(e) => {
                      setIsAssessment(e.target.checked);
                      props.onChange?.();
                    }}
                  />
                }
                label="Assessment"
              />
            </Stack>
            <Stack
              direction={"row"}
              spacing={3}
              sx={{
                flexGrow: 1,
              }}
            >
              <Box sx={{ width: "300px", flexGrow: 1 }}>
                <h4 style={{ margin: 0 }}>Additional files</h4>
                <List
                  sx={{
                    width: "100%",
                    maxWidth: 360,
                    bgcolor: "background.paper",
                  }}
                >
                  {additionalFiles.map((file, index) => (
                    <ListItem key={index} disablePadding>
                      <IconButton
                        onClick={() => {
                          setAdditionalFiles(
                            additionalFiles.filter((f) => f !== file)
                          );
                          props.onChange?.();
                        }}
                      >
                        <Tooltip title="Remove">
                          <DeleteIcon color="error" />
                        </Tooltip>
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          file.visible = !file.visible;
                          setAdditionalFiles([...additionalFiles]);
                          props.onChange?.();
                        }}
                      >
                        {file.visible ? (
                          <Tooltip title="Visible; click to hide">
                            <VisibilityIcon />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Hidden; click to unhide">
                            <VisibilityOffIcon />
                          </Tooltip>
                        )}
                      </IconButton>

                      <ListItemText primary={file.filename} />
                    </ListItem>
                  ))}
                  <ListItem>
                    <ListItemButton onClick={() => setAddFileDialogOpen(true)}>
                      <ListItemText>Add</ListItemText>
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>
              <div style={{ flexGrow: 2, height: "100%" }}>
                <Editor
                  className={"theme-" + themeContext.theme}
                  height="100%"
                  defaultLanguage="json"
                  value={jsonCode}
                  onMount={handleEditorDidMount}
                  theme={themeContext.theme}
                  onChange={(e) => {
                    if (jsonCode !== e) {
                      props.onChange?.();
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
              </div>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <InputDialog
        title="Add an additional file. Please enter the file name:"
        open={addFileDialogOpen}
        onClose={() => setAddFileDialogOpen(false)}
        onInputEntered={(filename) => {
          if (filename.replace(/\s/g, "").length !== 0) {
            setAdditionalFiles([
              ...additionalFiles,
              { filename, visible: true },
            ]);
            props.onChange?.();
          }
          setAddFileDialogOpen(false);
        }}
      />
    </>
  );
});

export default BookNodeEditor;
export { BookNodeEditorHandle };
