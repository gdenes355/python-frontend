import React, { MouseEvent, useMemo, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button, Card, CardContent, CardActions, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type BookUploadProps = {
  isForEditing?: boolean;
  onBookUploaded: (zip: File, forEdit: boolean) => void;
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

const BookUpload = (props: BookUploadProps) => {
  const { acceptedFiles, getRootProps, getInputProps, isFocused } = useDropzone(
    {
      accept: {
        "application/zip": [".zip"]
      },
      maxFiles: 1,
    }
  );

  const [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    if (acceptedFiles && acceptedFiles.length === 1) {
      setFile(acceptedFiles[0]);
    } else {
      setFile(null);
    }
  }, [acceptedFiles]);

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
      display: file ? "none" : "block",
      color: theme.palette.text.secondary,
      backgroundColor: theme.palette.background.paper,
    }),
    [isFocused, focusedStyle, file, theme]
  );

  const uploadClicked = (event: MouseEvent) => {
    if (file) {
      props.onBookUploaded(file, props.isForEditing || false);
    }
  };

  return (
    <Card sx={{ maxWidth: 345, m: 5 }}>
      <Box>
        <CardContent {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <p>
            Drag &#38; drop your book zip file, or click to select a zip file
            from the dialog
          </p>
        </CardContent>
      </Box>
      <CardContent>
        <p>File:{file ? file.name : undefined}</p>
      </CardContent>
      <CardActions>
        <Button onClick={uploadClicked} disabled={!file}>
          {props.isForEditing ? "Clone" : "Load"}
        </Button>
        <Button color="error" disabled={!file} onClick={() => setFile(null)}>
          Cancel
        </Button>
      </CardActions>
    </Card>
  );
};

export default BookUpload;
