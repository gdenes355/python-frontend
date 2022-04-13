import React from "react";
import { Button, Grid, Box, Stack } from "@mui/material";

import TestResultsIndicator from "../components/TestResultIndicator";

import { TestResults } from "../models/Tests";

type MainControlsProps = {
  canDebug: boolean;
  canSubmit: boolean;
  canReset: boolean;
  testResults: TestResults;
  onDebug: () => void;
  onSubmit: () => void;
  onResetCode: () => void;
};

const MainControls = (props: MainControlsProps) => (
  <Grid container spacing={2} style={{ display: "flex" }}>
    <Grid item style={{ flexGrow: 1 }}>
      <Stack spacing={2} direction="row">
        <Box>
          <Button
            variant="contained"
            color="primary"
            disabled={!props.canDebug}
            onClick={props.onDebug}
          >
            Debug
          </Button>
        </Box>
        {props.canSubmit ? (
          <Box>
            <Button
              variant="contained"
              color="primary"
              disabled={!props.canDebug}
              onClick={props.onSubmit}
            >
              Submit
            </Button>
          </Box>
        ) : null}
        <TestResultsIndicator
          testResults={props.testResults}
        ></TestResultsIndicator>
      </Stack>
    </Grid>
    <Grid item>
      <Button
        variant="contained"
        color="error"
        disabled={!props.canReset}
        onClick={props.onResetCode}
      >
        Reset
      </Button>
    </Grid>
  </Grid>
);

export default MainControls;
