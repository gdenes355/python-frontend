import React, { useImperativeHandle, useRef, useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Divider,
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
import type BookNodeEditorHandle from "../../refs/BookNodeEditorHandle";
import AddIcon from "@mui/icons-material/Add";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

type BookNodeEditorProps = {
  onChange?: () => void;
  onToggleFullScreen: () => void;
  bookNode: BookNodeModel;
  hasEdited?: boolean;
  guideMd?: string;
  starterCode?: string;
};

const BookNodeEditor = React.forwardRef<
  BookNodeEditorHandle,
  BookNodeEditorProps
>((props, ref) => {
  // node model state
  const [name, setName] = useState<string>(props.bookNode.name);
  const [typ, setTyp] = useState<"py" | "parsons" | "canvas">(
    props.bookNode.typ || "py",
  );
  const [isExample, setIsExample] = useState<boolean>(
    props.bookNode.isExample || false,
  );
  const [isAssessment, setIsAssessment] = useState<boolean>(
    props.bookNode.isAssessment || false,
  );
  const [isSessionFilesAllowed, setisSessionFilesAllowed] = useState<boolean>(
    props.bookNode.isSessionFilesAllowed || false,
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
    setisSessionFilesAllowed(props.bookNode.isSessionFilesAllowed || false);
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
      isSessionFilesAllowed,
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
                <MenuItem value="parsons">
                  <Tooltip title="Python code turned into a Parsons challenge">
                    <span>Parsons</span>
                  </Tooltip>
                </MenuItem>
                <MenuItem value="canvas">
                  <Tooltip title="Python code with canvas functionality">
                    <span>Canvas</span>
                  </Tooltip>
                </MenuItem>
              </Select>
              <Tooltip title="Example: just running this code will tick off the challenge as completed">
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
              </Tooltip>
              <Tooltip title="Assessment: students can submit but will get no test feedback">
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
              </Tooltip>
              <Tooltip title="Allow session files: students can upload files to a local mock file system to read from their Python code.">
                <FormControlLabel
                  control={
                    <Checkbox
                      style={{ padding: 0 }}
                      checked={isSessionFilesAllowed}
                      value={isSessionFilesAllowed}
                      onChange={(e) => {
                        setisSessionFilesAllowed(e.target.checked);
                        props.onChange?.();
                      }}
                    />
                  }
                  label="Allow session files"
                />
              </Tooltip>
            </Stack>
            <Stack
              direction={"row"}
              spacing={1}
              sx={{
                flexGrow: 1,
                height: "calc(100% - 40px)",
              }}
            >
              <Box sx={{ width: "300px", height: "100%" }}>
                <Tooltip title="Additional files: Files mapped to the students' local file system before code execution. These could be hidden Python library files to import, or visible csv files to parse.">
                  <h4 style={{ margin: 0 }}>Additional files</h4>
                </Tooltip>
                <Box sx={{ height: "calc(100% - 40px)", overflowY: "auto" }}>
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
                              additionalFiles.filter((f) => f !== file),
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
                          (f) => f.filename === file.filename,
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
                      <Tooltip title="Add a new additional file">
                        <ListItemButton
                          onClick={() => setAddFileDialogOpen(true)}
                        >
                          <ListItemText>
                            <AddIcon sx={{ fontSize: 16 }} />
                          </ListItemText>
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  </List>
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem />
              <div
                style={{
                  flexGrow: 2,
                  height: "100%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TaskAltIcon />
                  <h4 style={{ margin: 0 }}>Test cases</h4>
                </Box>
                <Box sx={{ height: "calc(100% - 40px)", overflowY: "auto" }}>
                  <TestEditor
                    challengeId={props.bookNode.id || ("" as string)}
                    ref={testEditor}
                    tests={props.bookNode.tests}
                    onChange={props.onChange}
                    guideMd={props.guideMd}
                    starterCode={props.starterCode}
                    hasEdited={props.hasEdited}
                  />
                </Box>
              </div>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <InputDialog
        title="New additional file"
        message="Please enter the file name:"
        placeholder="e.g. data.csv"
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
