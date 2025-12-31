import { Box, Fab, Tooltip } from "@mui/material";
import { useContext } from "react";
import SessionContext from "../../auth/contexts/SessionContext";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ListIcon from "@mui/icons-material/List";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";

type BookControlFabsProps = {
  hasEdited: boolean;
  onNavigateToPrevPage?: () => void;
  onNavigateToNextPage?: () => void;
  onOpenMenu?: () => void;
  onSave?: () => void;
  onUploadToServer?: () => void;
};

const BookControlFabs = (props: BookControlFabsProps) => {
  const { canUploadBook, isEditingRemote } = useContext(SessionContext);
  let btns = [];
  if (props.onUploadToServer && canUploadBook && isEditingRemote) {
    btns.push(
      <Tooltip
        title={
          props.hasEdited
            ? "You have unsaved changes. Save first."
            : "Upload to server"
        }
      >
        <span>
          <Fab
            key="upload-to-server"
            sx={{ m: 1 }}
            size="small"
            color="secondary"
            onClick={() => props.onUploadToServer?.()}
            disabled={props.hasEdited}
          >
            <UploadIcon />
          </Fab>
        </span>
      </Tooltip>
    );
  }
  if (props.onSave) {
    btns.push(
      <Tooltip title="Save">
        <Fab
          key="save"
          sx={{ m: 1 }}
          size="small"
          onClick={() => props.onSave?.()}
          color="primary"
        >
          <SaveIcon />
        </Fab>
      </Tooltip>
    );
  }

  if (props.onNavigateToPrevPage) {
    btns.push(
      <Fab
        key="prev"
        size="small"
        sx={{ m: 1 }}
        onClick={() => props.onNavigateToPrevPage?.()}
      >
        <NavigateBeforeIcon />
      </Fab>
    );
  }

  if (props.onNavigateToNextPage) {
    btns.push(
      <Fab
        key="next"
        size="small"
        sx={{ m: 1 }}
        onClick={() => props.onNavigateToNextPage?.()}
      >
        <NavigateNextIcon />
      </Fab>
    );
  }

  if (props.onOpenMenu) {
    btns.push(
      <Fab
        key="menu"
        size="small"
        sx={{ m: 1 }}
        color="primary"
        onClick={() => props.onOpenMenu?.()}
      >
        <ListIcon />
      </Fab>
    );
  }

  return (
    <Box
      sx={{
        top: "auto",
        left: "auto",
        position: "absolute",
        right: "20px",
        bottom: "20px",
      }}
    >
      {btns}
    </Box>
  );
};

export default BookControlFabs;
