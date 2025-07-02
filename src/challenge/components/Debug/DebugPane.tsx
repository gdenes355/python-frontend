import { useContext, useRef, useState } from "react";
import { Button, Grid2, Stack, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ClearIcon from "@mui/icons-material/Clear";

import { emptyDebugContext } from "../../../coderunner/DebugContext";
import ChallengeContext from "../../ChallengeContext";
import {
  CodeRunnerRef,
  CodeRunnerState,
} from "../../../coderunner/useCodeRunner";

type DebugPaneProps = {
  codeRunner: CodeRunnerRef;

  OnWatchAdd: (name: string) => void;
  OnWatchRemove: (name: string) => void;
};

const StyledTable = styled("div")(
  () => `
    width: 100%;
    height: 100%;
    margin-top: 5px;
    & table {
      margin-bottom: 20px;
      width: 100%;
      table-layout: fixed;
    }
    
    & td {
      padding-top: 1px;
      padding-bottom: 1px;
      padding-left: 3em;
      font-family: monospace;
      vertical-align: top;
    }
    & input {
      padding-top: 1px;
      padding-bottom: 1px;
      font-family: monospace;
      vertical-align: top;
    }
    & .hh {
      background-color: transparent !important;
      padding-left: 1em;
      font-weight: bold;
    }

    & .expand-button {
      padding: 0px;
      margin-left: -1em;
    }

    & .val-collapsed {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      display: inline-block;
      width: 100%;
      margin-top: -1px;
      margin-bottom: -4px;
    }

    & svg {
      font-size: 0.8em;
    }

    & .col-name {
      width: 33%;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    & .col-value {
      width 100%;
    }
`
);

type VariableRowProps = {
  name: string;
  value?: string;
  removable?: boolean;
  OnRemove?: () => void;
};

const VariableRow = (props: VariableRowProps) => {
  const short = (props.value?.length || 0) < 50;
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <TableRow hover>
      <TableCell className="col-name">
        {short ? undefined : (
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setExpanded(!expanded)}
            className="expand-button"
          >
            {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        )}
        {props.name}
      </TableCell>
      <TableCell align="left" className="col-value">
        {short ? (
          props.value
        ) : expanded ? (
          props.value
        ) : (
          <span className="val-collapsed">{props.value}</span>
        )}
        {props.removable ? (
          <IconButton
            aria-label="remove watch"
            size="small"
            onClick={props.OnRemove}
            style={{ float: "right" }}
          >
            <ClearIcon />
          </IconButton>
        ) : undefined}
      </TableCell>
    </TableRow>
  );
};

const DebugPane = (props: DebugPaneProps) => {
  const { codeRunner } = props;
  const challengeContext = useContext(ChallengeContext);

  const debugContext = codeRunner.debugContext || emptyDebugContext;
  const hasLocals = debugContext.locals.size > 0;

  const canKill =
    codeRunner.state === CodeRunnerState.RUNNING_WITH_DEBUGGER ||
    codeRunner.state === CodeRunnerState.ON_BREAKPOINT ||
    codeRunner.state === CodeRunnerState.AWAITING_INPUT;

  const canContinue = codeRunner.state === CodeRunnerState.ON_BREAKPOINT;

  const inputRef = useRef<HTMLInputElement>();

  return (
    <Stack sx={{ height: "100%" }}>
      <Paper sx={{ width: "100%", pl: 1, pb: 1 }}>
        <Grid2 container spacing={2} sx={{ mt: 0.5 }}>
          <Grid2>
            <Button
              variant="contained"
              color="success"
              disabled={!canContinue}
              onClick={() => challengeContext?.actions["continue"]()}
            >
              Continue
            </Button>
          </Grid2>
          <Grid2>
            <Button
              variant="contained"
              color="primary"
              disabled={!canContinue}
              onClick={() => challengeContext?.actions["step"]()}
            >
              Step into
            </Button>
          </Grid2>
          <Grid2>
            <Button
              variant="contained"
              color="error"
              disabled={!canKill}
              onClick={() => challengeContext?.actions["kill"]()}
            >
              Stop
            </Button>
          </Grid2>
        </Grid2>
      </Paper>
      <Paper sx={{ width: "100%", overflow: "hidden", height: "100%" }}>
        {canContinue ? (
          <StyledTable>
            <TableContainer sx={{ height: "100%", overflowY: "scroll" }}>
              <Table
                className="vartable"
                size="small"
                stickyHeader
                style={{ marginTop: 0 }}
              >
                <TableBody>
                  {hasLocals ? (
                    <>
                      <TableRow key="local">
                        <TableCell className="hh col-name">
                          LOCAL VARIABLES
                        </TableCell>
                        <TableCell className="col-value" />
                      </TableRow>
                      {Array.from(debugContext.locals.keys()).map((key) => (
                        <VariableRow
                          key={`local-${key}`}
                          name={key}
                          value={debugContext.locals.get(key)}
                        />
                      ))}
                    </>
                  ) : undefined}
                  <TableRow key="global">
                    <TableCell className="hh col-name">
                      {hasLocals ? "GLOBAL VARIABLES" : "VARIABLES"}
                    </TableCell>
                    <TableCell className="col-value" />
                  </TableRow>
                  {Array.from(debugContext.globals.keys()).map((key) => (
                    <VariableRow
                      key={`local-${key}`}
                      name={key}
                      value={debugContext.globals.get(key)}
                    />
                  ))}
                  <TableRow key="watches">
                    <TableCell className="hh col-name">WATCHES</TableCell>
                    <TableCell className="col-value" />
                  </TableRow>
                  {Array.from(debugContext.watches.keys()).map((key) => (
                    <VariableRow
                      key={`watch-${key}`}
                      name={key}
                      value={debugContext.watches.get(key)}
                      removable={true}
                      OnRemove={() => props.OnWatchRemove(key)}
                    />
                  ))}

                  <TableRow>
                    <TableCell colSpan={2}>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        inputRef={inputRef}
                        onKeyDown={(e) => {
                          const value = inputRef.current?.value?.trim();

                          if (e.key === "Enter" && value) {
                            props.OnWatchAdd(value);
                            if (inputRef.current) {
                              inputRef.current.value = "";
                            }
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </StyledTable>
        ) : undefined}
      </Paper>
    </Stack>
  );
};

export default DebugPane;
