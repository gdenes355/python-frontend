import React, { useRef, useEffect, useState, useMemo } from "react";

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
  useTheme,
} from "@mui/material";

import InputDialog from "../../../components/dialogs/InputDialog";

import { SessionFile } from "../../../models/SessionFile";
import { useDropzone } from "react-dropzone";

import DeleteIcon from "@mui/icons-material/Delete";

type SessionFilesProps = {
  sessionFiles: SessionFile[];
  onAddSessionFile: (file: SessionFile) => void;
  onRemoveSessionFile: (fileName: string) => void;
};

type SessionFilesHandle = {};

const baseStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderStyle: "dashed",
  outline: "none",
  transition: "border .24s ease-in-out",
};

type FileUploadControlProps = {
  onUpload: (file: File) => void;
};

const FileUploadControl = (props: FileUploadControlProps) => {
  const { getRootProps, getInputProps, isFocused, isDragActive } = useDropzone({
    // accept: {
    //   should we restrict this?
    // },
    maxFiles: 1,
    onDropAccepted: (files) => {
      if (files && files.length === 1) {
        propsRef.current?.onUpload(files[0]);
      }
    },
  });

  const propsRef = useRef<FileUploadControlProps | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const theme = useTheme();

  const focusedStyle = useMemo(() => {
    return {
      borderColor: theme.palette.primary.main,
    };
  }, [theme]);

  const style = useMemo(
    () => ({
      ...baseStyle,
      borderColor: theme.palette.secondary.main,
      ...(isFocused ? focusedStyle : {}),
      color: theme.palette.text.secondary,
      backgroundColor: theme.palette.background.paper,
    }),
    [isFocused, focusedStyle, theme]
  );

  return (
    <Box sx={{ maxWidth: 345, m: 1 }}>
      <Box {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag &#38; drop or click to upload as a session file</p>
        )}
      </Box>
    </Box>
  );
};

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
                    <ListItemText>+ new text file</ListItemText>
                  </ListItemButton>
                </ListItem>
              </List>
              <FileUploadControl
                onUpload={(file) => {
                  if (file.type.startsWith("text/")) {
                    // simple text file
                    file.text().then((data) => {
                      props.onAddSessionFile({
                        filename: file.name,
                        isText: true,
                        data: data,
                      });
                    });
                  } else {
                    file.arrayBuffer().then((data) => {
                      props.onAddSessionFile({
                        filename: file.name,
                        isText: false,
                        data: new Uint8Array(data),
                      });
                    });
                  }
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
