import React, { useRef, useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
} from "@mui/material";

import InputDialog from "../../../components/dialogs/InputDialog";

import DeleteIcon from "@mui/icons-material/Delete";
import FileUploadControl from "../../../components/FileUploadControl";
import { SessionFile } from "../../../models/SessionFile";

type SessionFilesProps = {
  sessionFiles: SessionFile[];
  onAddSessionFile: (file: SessionFile) => void;
  onRemoveSessionFile: (fileName: string) => void;
};

type SessionFilesHandle = {};

const SessionFiles = React.forwardRef<SessionFilesHandle, SessionFilesProps>(
  (props, ref) => {
    // visual state
    const [addFileDialogOpen, setAddFileDialogOpen] = useState<boolean>(false);

    const propsRef = useRef<SessionFilesProps | null>(null);
    useEffect(() => {
      propsRef.current = props;
    }, [props]);

    return (
      <>
        <Card sx={{ height: "100%", overflowY: "auto" }}>
          <CardContent sx={{ height: "100%" }}>
            <Box sx={{ width: "300px", flexGrow: 1 }}>
              <span style={{ fontFamily: "monospace" }}>session/</span>
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  bgcolor: "background.paper",
                }}
              >
                {props.sessionFiles.map((file, index) => (
                  <ListItem key={index} disablePadding>
                    <IconButton
                      onClick={() => {
                        props.onRemoveSessionFile(file.filename);
                      }}
                    >
                      <Tooltip title="Remove">
                        <DeleteIcon color="error" />
                      </Tooltip>
                    </IconButton>

                    <ListItemText primary={file.filename} />
                  </ListItem>
                ))}
                <ListItem>
                  <ListItemButton onClick={() => setAddFileDialogOpen(true)}>
                    <ListItemText>+ (add new...)</ListItemText>
                  </ListItemButton>
                </ListItem>
              </List>
              <FileUploadControl
                onUpload={() => {
                  console.log("uploading new session file");
                }}
              />
            </Box>
          </CardContent>
        </Card>
        <InputDialog
          title="Add a session file. Please enter the file name:"
          open={addFileDialogOpen}
          onClose={() => setAddFileDialogOpen(false)}
          onInputEntered={(filename) => {
            if (filename.replace(/\s/g, "").length !== 0) {
              props.onAddSessionFile({
                filename: filename,
                isText: true,
                data: "New text file. Enter your text here.",
              });
            }
            setAddFileDialogOpen(false);
          }}
        />
      </>
    );
  }
);

export default SessionFiles;
export { SessionFilesHandle };
