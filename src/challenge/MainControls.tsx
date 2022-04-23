import React from "react";

import { Button, Grid, Box, Stack, IconButton } from "@mui/material";

import { DevicesFoldRounded } from "@mui/icons-material";

import TestResultsIndicator from "../components/TestResultIndicator";

import { TestResults } from "../models/Tests";

type MainControlsProps = {
  canDebug: boolean;
  canSubmit: boolean;
  testResults: TestResults;
  guideMinimised: boolean;
  showRun: boolean;
  onDebug: () => void;
  onRun: () => void;
  onSubmit: () => void;
  onGuideDisplayToggle: () => void;
};

const MainControlsStack = (props: MainControlsProps) => {
  return (
    <Stack
      spacing={2}
      direction="column"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <IconButton
        onClick={() => {
          props.onGuideDisplayToggle();
        }}
      >
        <DevicesFoldRounded />
      </IconButton>
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
      {props.showRun && (
      <Box>
        <Button
          variant="contained"
          color="primary"
          disabled={!props.canDebug}
          onClick={props.onRun}
        >
          Run
        </Button>
      </Box>
      )}       
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
  );
};

const MainControlsGrid = (props: MainControlsProps) => {
  return (
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
          {props.showRun && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              disabled={!props.canDebug}
              onClick={props.onRun}
            >
              Run (No Breaks)
            </Button>
          </Box>
          )}           
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
        <IconButton
          onClick={() => {
            props.onGuideDisplayToggle();
          }}
        >
          <DevicesFoldRounded />
        </IconButton>
      </Grid>
    </Grid>
  );
};

const MainControls = (props: MainControlsProps) => {
  if (props.guideMinimised) {
    return MainControlsStack(props);
  } else {
    return MainControlsGrid(props);
  }
};

export default MainControls;
