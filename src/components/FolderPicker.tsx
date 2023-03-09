import { Button, Card, CardActions, CardContent } from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";

type FolderPickerProps = {
  onFolderPicked: (folder: FileSystemDirectoryHandle) => void;
};

const FolderPicker = (props: FolderPickerProps) => {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | undefined>();

  const selectClicked = () => {
    window.showDirectoryPicker().then((v) => setFolder(v));
  };

  const openClicked = () => {
    if (!folder) {
      return;
    }
    props.onFolderPicked(folder);
  };

  return (
    <Card sx={{ maxWidth: 345, m: 5 }}>
      <Box>
        <CardContent>
          Pick a folder on your computer with a book.json file in it
        </CardContent>
      </Box>
      <CardActions>
        <Button onClick={() => selectClicked()}>Select</Button>
        <Button onClick={() => openClicked()} disabled={!folder}>
          Open
        </Button>
      </CardActions>
    </Card>
  );
};

export default FolderPicker;
