import React from "react";
import { Box, Fab, Stack } from "@mui/material";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ListIcon from "@mui/icons-material/List";

type BookControlFabsProps = {
  guideMinimised: boolean;
  onNavigateToPrevPage?: () => void;
  onNavigateToNextPage?: () => void;
  onOpenMenu?: () => void;
};

const BookControlFabsStack = (props: BookControlFabsProps) => {
  return(
    <Box
      sx={{
        top: "auto",
        left: "auto",
        position: "absolute",
        right: "20px",
        bottom: "20px",
      }}
    >
      <Stack spacing={2} direction="column" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}> 
        <Box>    
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
        </Box>
        <Box>    
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
        </Box>
        <Box>    
          <Fab
            size="small"
            sx={{ m: 1 }}
            color="primary"
            onClick={() => (props.onOpenMenu ? props.onOpenMenu() : undefined)}
          >
            <ListIcon />
          </Fab>
        </Box>                  
      </Stack>
    </Box>
  );
}

const BookControlFabsGrid = (props: BookControlFabsProps) => {
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
}

const BookControlFabs = (props: BookControlFabsProps) => {
  if (
    props.onNavigateToNextPage &&
    props.onNavigateToPrevPage &&
    props.onOpenMenu
  ) {
    if(props.guideMinimised) {
      return (BookControlFabsStack(props));
    }
    else {
      return (BookControlFabsGrid(props))
    }    
  } else {
    return <div></div>;
  }
};

export default BookControlFabs;
