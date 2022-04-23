import React from "react";
import { Box, Fab } from "@mui/material";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ListIcon from "@mui/icons-material/List";

type BookControlFabsProps = {
  onNavigateToPrevPage?: () => void;
  onNavigateToNextPage?: () => void;
  onOpenMenu?: () => void;
};

const BookControlFabs = (props: BookControlFabsProps) => {
  if (
    props.onNavigateToNextPage &&
    props.onNavigateToPrevPage &&
    props.onOpenMenu
  ) {
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
        <Fab
          size="small"
          sx={{ m: 1 }}
          onClick={() =>
            props.onNavigateToPrevPage
              ? props.onNavigateToPrevPage()
              : undefined
          }
        >
          <NavigateBeforeIcon />
        </Fab>
        <Fab
          size="small"
          sx={{ m: 1 }}
          onClick={() =>
            props.onNavigateToNextPage
              ? props.onNavigateToNextPage()
              : undefined
          }
        >
          <NavigateNextIcon />
        </Fab>
        <Fab
          size="small"
          sx={{ m: 1 }}
          color="primary"
          onClick={() => (props.onOpenMenu ? props.onOpenMenu() : undefined)}
        >
          <ListIcon />
        </Fab>
      </Box>
    );
  } else {
    return <div></div>;
  }
};

export default BookControlFabs;
