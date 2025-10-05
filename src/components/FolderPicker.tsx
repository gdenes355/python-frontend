import { Button, Card, CardActions, CardContent, Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";

type FolderPickerProps = {
  onFolderPicked: (
    folder: FileSystemDirectoryHandle,
    isForEditing: boolean
  ) => void;
  isForEditing?: boolean;
};

const FolderPicker = (props: FolderPickerProps) => {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | undefined>();
  const [selectedEditing, setSelectedEditing] = useState(
    props.isForEditing || false
  );

  const selectClicked = (isForEditing: boolean) => {
    window
      .showDirectoryPicker({
        mode: isForEditing ? "readwrite" : "read",
      })
      .then((v) => {
        setFolder(v);
        setSelectedEditing(isForEditing);
      });
  };

  const openClicked = (isForEditing: boolean) => {
    if (!folder) {
      return;
    }
    props.onFolderPicked(folder, isForEditing);
  };

  return (
    <Card sx={{ maxWidth: 345, m: 5 }}>
      <Box>
        <CardContent>
          {folder
            ? folder.name + (selectedEditing ? " (selected for editing)" : "")
            : "Pick a folder on your computer with a book.json file in it"}
        </CardContent>
      </Box>
      <CardActions>
        {folder ? (
          <>
            <Button onClick={() => openClicked(selectedEditing)}>Open</Button>
            <Button color="error" onClick={() => setFolder(undefined)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => selectClicked(false)}>
              {props.isForEditing ? "Preview" : "Open"}
            </Button>
            {props.isForEditing ? (
              <Tooltip title="Edit the uploaded book in the browser. Note that changes will not be written back to the folder yet, but you can download the modified book as a zip. Challenge Ids will be kept.">
                <Button onClick={() => selectClicked(true)}>Edit</Button>
              </Tooltip>
            ) : null}
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default FolderPicker;
