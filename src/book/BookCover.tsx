import React from "react";
import { Paper } from "@mui/material";

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
    <Paper style={{ height: "100%" }}>
      <h1>{props.bookRoot.name}</h1>
      <BookContents
        bookRoot={props.bookRoot}
        onNodeSelected={props.onNodeSelected}
        allTestResults={props.allTestResults}
      />
    </Paper>
  );
};

export default BookCover;
