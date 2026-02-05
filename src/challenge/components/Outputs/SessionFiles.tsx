import { useRef, useEffect, useState, useMemo, useContext } from "react";

import {
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";

import InputDialog from "../../../components/dialogs/InputDialog";

import { SessionFile } from "../../../models/SessionFile";
import { useDropzone } from "react-dropzone";

import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsContext from "../../../components/NotificationsContext";

type SessionFilesProps = {
  sessionFiles: SessionFile[];
  onAddSessionFile: (file: SessionFile) => void;
  onRemoveSessionFile: (fileName: string) => void;
};

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
  const notifications = useContext(NotificationsContext);
  const { getRootProps, getInputProps, isFocused, isDragActive } = useDropzone({
    // accept: {
    //   should we restrict this?
    // },
    maxFiles: 5,
    onDropAccepted: (files) => {
      if (files && files.length === 1) {
        propsRef.current?.onUpload(files[0]);
        notifications.addMessage("File uploaded", "success");
      } else if (files && files.length < 5) {
        for (const file of files) {
          props.onUpload(file);
        }
        notifications.addMessage("Files uploaded", "success");
      } else {
        notifications.addMessage("Too many files to upload", "error");
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

const SessionFiles = (props: SessionFilesProps) => {
  // visual state
  const [addFileDialogOpen, setAddFileDialogOpen] = useState<boolean>(false);

  const propsRef = useRef<SessionFilesProps | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  return (
    <>
      <Card sx={{ height: "100%", overflowY: "auto" }}>
        <CardContent sx={{ height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ flexGrow: 1 }}>
              <span style={{ fontFamily: "monospace" }}>session/</span>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mt: 0.5,
                  alignItems: "center",
                }}
              >
                {props.sessionFiles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => {
                        props.onRemoveSessionFile(file.filename);
                      }}
                      sx={{ px: 0.5 }}
                    >
                      <Tooltip title="Remove">
                        <DeleteIcon color="error" fontSize="small" />
                      </Tooltip>
                    </IconButton>
                    <Box
                      component="span"
                      sx={{
                        pr: 1,
                        pl: 0,
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 180,
                      }}
                    >
                      {file.filename}
                    </Box>
                  </Box>
                ))}
                <Box
                  component="button"
                  onClick={() => setAddFileDialogOpen(true)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: 1,
                    borderColor: "divider",
                    borderStyle: "dashed",
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    fontSize: "0.875rem",
                    color: "text.secondary",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "primary.main",
                      color: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  + new text file
                </Box>
              </Box>
            </Box>
            <Box sx={{ width: "400px" }}>
              <FileUploadControl
                onUpload={(file) => {
                  if (file.type.startsWith("text/")) {
                    // simple text file
                    file.text().then((data) => {
                      props.onAddSessionFile({
                        filename: file.name,
                        isText: true,
                        data: data,
                        mimeType: file.type,
                      });
                    });
                  } else {
                    file.arrayBuffer().then((data) => {
                      props.onAddSessionFile({
                        filename: file.name,
                        isText: false,
                        data: new Uint8Array(data),
                        mimeType: file.type,
                      });
                    });
                  }
                }}
              />
            </Box>
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
              mimeType: "text/plain",
            });
          }
          setAddFileDialogOpen(false);
        }}
      />
    </>
  );
};

export default SessionFiles;
