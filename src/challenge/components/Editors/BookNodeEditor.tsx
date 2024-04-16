import React, { useImperativeHandle, useRef, useEffect, useState } from "react";

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
import TestEditor, { TestEditorHandle } from "./TestEditor/TestEditor";

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

  // visual state
  const [addFileDialogOpen, setAddFileDialogOpen] = useState<boolean>(false);

  const testEditor = useRef<TestEditorHandle>(null);

  useEffect(() => {
    setName(props.bookNode.name);
    setTyp(props.bookNode.typ || "py");
    setIsExample(props.bookNode.isExample || false);
    setIsAssessment(props.bookNode.isAssessment || false);
    setAdditionalFiles(props.bookNode.additionalFiles || []);
  }, [props.bookNode]);

  const propsRef = useRef<BookNodeEditorProps | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const getValue = () => {
    return {
      id: props.bookNode.id,
      name,
      typ,
      isExample: isExample && typ !== "parsons",
      isAssessment: isAssessment && typ !== "parsons",
      additionalFiles,
      tests: testEditor.current
        ? testEditor.current.getValue()
        : props.bookNode.tests,
    };
  };

  useImperativeHandle(ref, () => ({
    getValue,
  }));

  return (
    <>
      <Card sx={{ height: "100%", overflowY: "auto" }}>
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

                      {!props.bookNode?.additionalFiles ||
                      props.bookNode?.additionalFiles?.filter(
                        (f) => f.filename === file.filename
                      ).length === 0 ? (
                        <Tooltip title="You must first save the book to edit this file.">
                          <ListItemText
                            primary={`${file.filename} (draft, unsaved)`}
                          />
                        </Tooltip>
                      ) : (
                        <ListItemText primary={file.filename} />
                      )}
                    </ListItem>
                  ))}
                  <ListItem>
                    <ListItemButton onClick={() => setAddFileDialogOpen(true)}>
                      <ListItemText>+</ListItemText>
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>
              <div style={{ flexGrow: 2, height: "100%" }}>
                <h4 style={{ margin: 0 }}>Test cases</h4>
                <TestEditor
                  ref={testEditor}
                  tests={props.bookNode.tests}
                  onChange={props.onChange}
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
