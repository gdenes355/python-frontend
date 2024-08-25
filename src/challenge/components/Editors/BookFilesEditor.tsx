import React, { useImperativeHandle, useRef, useEffect, useState } from "react";

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

import {
  AdditionalFile,
  AdditionalFiles,
} from "../../../models/AdditionalFiles";

import InputDialog from "../../../components/dialogs/InputDialog";

import DeleteIcon from "@mui/icons-material/Delete";
import FileUploadControl from "../../../components/FileUploadControl";

type BookFilesModel = {
  id: string;
  additionalFiles?: AdditionalFiles;
};

type BookFilesEditorProps = {
  onChange?: () => void;
  onToggleFullScreen: () => void;
  bookNode: BookFilesModel;
};

type BookFilesEditorHandle = {
  getValue: () => BookFilesModel;
};

const BookFilesEditor = React.forwardRef<
  BookFilesEditorHandle,
  BookFilesEditorProps
>((props, ref) => {
  const [additionalFiles, setAdditionalFiles] = useState<AdditionalFile[]>([]);

  // visual state
  const [addFileDialogOpen, setAddFileDialogOpen] = useState<boolean>(false);

  const propsRef = useRef<BookFilesEditorProps | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const getValue = () => {
    return {
      id: props.bookNode.id,
      additionalFiles,
    };
  };

  useImperativeHandle(ref, () => ({
    getValue,
  }));

  return (
    <>
      <Card sx={{ height: "100%", overflowY: "auto" }}>
        <CardContent sx={{ height: "100%" }}>
          <Box sx={{ width: "300px", flexGrow: 1 }}>
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

export default BookFilesEditor;
export { BookFilesEditorHandle };
