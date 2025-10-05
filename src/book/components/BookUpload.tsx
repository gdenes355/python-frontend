import { useMemo, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export type BookUploadType = "reading" | "cloning" | "editing";

type BookUploadProps = {
  isForEditing?: boolean;
  onBookUploaded: (zip: File, uploadType: BookUploadType) => void;
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
        "application/zip": [".zip"],
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

  const handleUploadForReading = () => {
    if (file) {
      props.onBookUploaded(file, "reading");
    }
  };

  const handleUploadForCloning = () => {
    if (file) {
      props.onBookUploaded(file, "cloning");
    }
  };

  const handleUploadForEditing = () => {
    if (file) {
      props.onBookUploaded(file, "editing");
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
        {!props.isForEditing ? (
          <Button onClick={handleUploadForReading} disabled={!file}>
            Load
          </Button>
        ) : (
          <>
            <Tooltip title="Edit the uploaded book in the browser. Challenge Ids will be kept.">
              <Button onClick={handleUploadForEditing} disabled={!file}>
                Edit
              </Button>
            </Tooltip>
            <Tooltip title="Clone to fork the uploaded book and edit it in the browser. Challenge Ids will be changed.">
              <Button onClick={handleUploadForCloning} disabled={!file}>
                Clone
              </Button>
            </Tooltip>
          </>
        )}
        <Button color="error" disabled={!file} onClick={() => setFile(null)}>
          Cancel
        </Button>
      </CardActions>
    </Card>
  );
};

export default BookUpload;
