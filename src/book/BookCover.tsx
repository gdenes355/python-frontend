import React from "react";
import { Container, Box } from "@mui/material";

import BookNodeModel from "../models/BookNodeModel";
import { AllTestResults } from "../models/Tests";
import BookContents from "./components/BookContents";

type BookCoverProps = {
  bookRoot: BookNodeModel;
  allTestResults: AllTestResults;
  onNodeSelected: (node: BookNodeModel) => void;
};

const BookCover = (props: BookCoverProps) => {
  return (
    <Box sx={{ overflowY: "auto", height: "100%" }}>
      <Container>
        <BookContents
          bookRoot={props.bookRoot}
          onNodeSelected={props.onNodeSelected}
          allTestResults={props.allTestResults}
        />
      </Container>
    </Box>
  );
};

export default BookCover;
