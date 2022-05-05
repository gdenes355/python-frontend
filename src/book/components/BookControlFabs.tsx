import React from "react";
import { Box, Fab } from "@mui/material";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ListIcon from "@mui/icons-material/List";
import SaveIcon from "@mui/icons-material/Save";

type BookControlFabsProps = {
  onNavigateToPrevPage?: () => void;
  onNavigateToNextPage?: () => void;
  onOpenMenu?: () => void;
  onSave?: () => void;
};

const BookControlFabs = (props: BookControlFabsProps) => {
  let btns = [];
  if (props.onSave) {
    btns.push(
      <Fab
        key="save"
        sx={{ m: 1 }}
        size="small"
        onClick={() => props.onSave?.()}
        color="primary"
      >
        <SaveIcon />
      </Fab>
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
