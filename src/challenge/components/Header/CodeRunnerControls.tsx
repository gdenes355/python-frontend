import { useContext } from "react";
import { Button, Grid2, Divider } from "@mui/material";
import TestResultsIndicator from "../../../components/TestResultIndicator";
import { TestResults } from "../../../models/Tests";
import ChallengeContext from "../../ChallengeContext";
import {
  CodeRunnerRef,
  CodeRunnerState,
} from "../../../coderunner/useCodeRunner";

import RunSplitButton from "../../../components/RunSplitButton";
import CropSquareIcon from "@mui/icons-material/CropSquare";

type CodeRunnerControlsProps = {
  canRunOnly: boolean;
  canSubmit: boolean;
  canVerifySolutions: boolean;
  codeRunner: CodeRunnerRef;
  testResults: TestResults;
  isAssessment: boolean;
};

const CodeRunnerControls = (props: CodeRunnerControlsProps) => {
  const challengeContext = useContext(ChallengeContext);
  const canDebug = props.codeRunner.state === CodeRunnerState.READY;
  const canKill =
    props.codeRunner.state === CodeRunnerState.RUNNING ||
    props.codeRunner.state === CodeRunnerState.RUNNING_WITH_DEBUGGER ||
    props.codeRunner.state === CodeRunnerState.ON_BREAKPOINT ||
    props.codeRunner.state === CodeRunnerState.AWAITING_INPUT;
  return (
    <Grid2 container spacing={2} style={{ display: "flex", height: "35px" }}>
      <RunSplitButton disabled={!canDebug} canRunOnly={props.canRunOnly} />
      <Button
        variant="contained"
        color="error"
        disabled={!canKill}
        onClick={() => challengeContext?.actions["kill"]()}
        size="small"
        startIcon={<CropSquareIcon />}
      >
        Stop
      </Button>
      {props.canSubmit ? (
        <Button
          variant="contained"
          color="primary"
          disabled={!canDebug}
          onClick={() => challengeContext?.actions["test"]()}
          size="small"
        >
          Submit
        </Button>
      ) : null}
      {props.canVerifySolutions ? (
        <Button
          variant="contained"
          color="primary"
          disabled={!canDebug}
          onClick={() => challengeContext?.actions["verify-solutions"]()}
          size="small"
        >
          Verify Solution
        </Button>
      ) : null}
      <TestResultsIndicator
        testResults={props.testResults}
        isAssessment={props.isAssessment}
      />
      <Divider orientation="vertical" variant="middle" flexItem />
    </Grid2>
  );
};

export default CodeRunnerControls;
