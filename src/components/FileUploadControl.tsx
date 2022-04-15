import React, { useRef } from "react";
import { Box, IconButton } from "@mui/material";
import { FileUpload } from "@mui/icons-material";

type FileUploadControlProps = {
  onUpload: (file: File) => void;
};

const FileUploadControl = (props: FileUploadControlProps) => {
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    console.log("File upload input clicked...");
    if (uploadRef.current?.files) {
      props.onUpload(uploadRef.current?.files[0]);
    }
  };

  return (
    <Box>
      <IconButton
        onClick={() => {
          uploadRef.current?.click();
        }}
      >
        <FileUpload />
      </IconButton>

      <input
        type="file"
        ref={uploadRef}
        onChange={handleUpload}
        style={{ display: "none" }}
      />
    </Box>
  );
};

export default FileUploadControl;
