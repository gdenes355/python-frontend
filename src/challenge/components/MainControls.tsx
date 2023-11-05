import React, { useContext } from "react";
import { Button, Grid, Box, Stack, IconButton } from "@mui/material";
import { DevicesFoldRounded } from "@mui/icons-material";
import TestResultsIndicator from "../../components/TestResultIndicator";
import { TestResults } from "../../models/Tests";
import RunSplitButton from "./RunSplitButton";
import ChallengeContext from "../ChallengeContext";

type MainControlsProps = {
  canDebug: boolean;
  canRunOnly: boolean;
  canSubmit: boolean;
  testResults: TestResults;
  isSubmitted?: boolean;
  guideMinimised: boolean;
  canKill: boolean;
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
      {props.canRunOnly ? null : (
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
      )}
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

      <Box>
        <Button
          variant="contained"
          color="error"
          disabled={!props.canKill}
          onClick={() => challengeContext?.actions["kill"]()}
        >
          Stop
        </Button>
      </Box>

      <TestResultsIndicator
        testResults={props.testResults}
        isSubmitted={props.isSubmitted}
      />
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
            <RunSplitButton
              disabled={!props.canDebug}
              canRunOnly={props.canRunOnly}
            />
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
            isSubmitted={props.isSubmitted}
          />
        </Stack>
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="error"
          disabled={!props.canKill}
          onClick={() => challengeContext?.actions["kill"]()}
          sx={{ mr: 1 }}
        >
          Stop
        </Button>

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
