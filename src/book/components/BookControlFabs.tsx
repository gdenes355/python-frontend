import {
  Box,
  Button,
  CircularProgress,
  Fab,
  Paper,
  Tooltip,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import SessionContext from "../../auth/contexts/SessionContext";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ListIcon from "@mui/icons-material/List";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AiContext from "../../ai/AiContext";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

type BookControlFabsProps = {
  hasEdited: boolean;
  onNavigateToPrevPage?: () => void;
  onNavigateToNextPage?: () => void;
  onOpenMenu?: () => void;
  onSave?: () => void;
  onAskAiForHints?: () => void;
  onUploadToServer?: () => void;
};

const BookControlFabs = (props: BookControlFabsProps) => {
  const { canUploadBook, isEditingRemote, canUseAi } =
    useContext(SessionContext);

  const [responseClosed, setResponseClosed] = useState<boolean>(false);

  const { isThinking, isOnCooldown, error, response } = useContext(AiContext);

  useEffect(() => {
    if (isOnCooldown) {
      setResponseClosed(false);
    }
  }, [response, isOnCooldown]);

  let btns = [];

  if (props.onUploadToServer && canUploadBook && isEditingRemote) {
    btns.push(
      <Tooltip
        title={
          props.hasEdited
            ? "You have unsaved changes. Save first."
            : "Upload to server"
        }
        key="upload-to-server"
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
  if (!props.onSave && canUseAi) {
    btns.push(
      <Tooltip
        title={
          isThinking
            ? "AI is thinking. Please wait..."
            : isOnCooldown
            ? "AI is on a short break. Read the task, try to solve the challenge, and ask for hints again later."
            : "Ask AI for hints"
        }
        key="ai"
      >
        <span>
          <Fab
            size="small"
            sx={{ m: 1 }}
            color="secondary"
            disabled={isOnCooldown || isThinking}
            onClick={() => props.onAskAiForHints?.()}
          >
            {isThinking ? (
              <CircularProgress size={20} color="warning" />
            ) : (
              <AutoAwesomeOutlinedIcon />
            )}
          </Fab>
        </span>
      </Tooltip>
    );
  }
  if (props.onSave) {
    btns.push(
      <Tooltip title="Save" key="save">
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
    <>
      {(response || error) && !responseClosed ? (
        <Paper
          sx={{
            margin: 1,
            padding: 1,
            position: "absolute",
            bottom: "80px",
            left: "20px",
          }}
          elevation={8}
        >
          <SmartToyOutlinedIcon />
          <p>{response || error?.message}</p>
          <Button onClick={() => setResponseClosed(true)}>Thanks</Button>
        </Paper>
      ) : null}
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
    </>
  );
};

export default BookControlFabs;
