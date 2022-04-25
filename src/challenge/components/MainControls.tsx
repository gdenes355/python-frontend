import React, { useContext } from "react";
import { Button, Grid, Box, Stack, IconButton } from "@mui/material";
import { DevicesFoldRounded } from "@mui/icons-material";
import TestResultsIndicator from "../../components/TestResultIndicator";
import { TestResults } from "../../models/Tests";
import RunSplitButton from "./RunSplitButton";
import ChallengeContext from "../ChallengeContext";

type MainControlsProps = {
  canDebug: boolean;
  canSubmit: boolean;
  testResults: TestResults;
  guideMinimised: boolean;
  onGuideDisplayToggle: () => void;
};

const MainControlsStack = (props: MainControlsProps) => {
  const challengeContext = useContext(ChallengeContext);
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
          onClick={() => challengeContext?.actions["debug"]()}
        >
          DEBUG
        </Button>
      </Box>
      <Box>
        <Button
          variant="contained"
          color="primary"
          disabled={!props.canDebug}
          onClick={() => challengeContext?.actions["debug"]("run")}
        >
          RUN
        </Button>
      </Box>
      {props.canSubmit ? (
        <Box>
          <Button
            variant="contained"
            color="primary"
            disabled={!props.canDebug}
            onClick={() => challengeContext?.actions["test"]()}
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
  const challengeContext = useContext(ChallengeContext);
  return (
    <Grid container spacing={2} style={{ display: "flex" }}>
      <Grid item style={{ flexGrow: 1 }}>
        <Stack spacing={2} direction="row">
          <Box>
            <RunSplitButton disabled={!props.canDebug} />
          </Box>
          {props.canSubmit ? (
            <Box>
              <Button
                variant="contained"
                color="primary"
                disabled={!props.canDebug}
                onClick={() => challengeContext?.actions["test"]()}
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
