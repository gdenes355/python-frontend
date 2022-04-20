import React from "react";
import { Box, Drawer, Divider, Button } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";

import BookContents from "./BookContents";

import BookNodeModel from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";

type BookDrawerProps = {
  open: boolean;
  bookRoot: BookNodeModel;
  allTestResults: AllTestResults;
  activePageId?: string;
  onRequestOpen: (open: boolean) => void;
  onNodeSelected: (node: BookNodeModel) => void;
  onOpenReport: () => void;
};

const BookDrawer = (props: BookDrawerProps) => {
  return (
    <Drawer
      anchor="right"
      open={props.open}
      onClose={() => props.onRequestOpen(false)}
    >
      <Box
        sx={{
          overflow: "hidden",
          display: "flex",
          height: "100%",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{ width: 250, overflowX: "hidden", flexGrow: "1" }}
          role="presentation"
        >
          <BookContents
            bookRoot={props.bookRoot}
            onNodeSelected={props.onNodeSelected}
            allTestResults={props.allTestResults}
            activePageId={props.activePageId}
          />
        </Box>
        <Divider />
        <Box sx={{ height: "40px" }}>
          <Button
            sx={{ width: "100%", height: "100%" }}
            onClick={props.onOpenReport}
          >
            <AssessmentIcon />
            &nbsp; report page
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BookDrawer;
