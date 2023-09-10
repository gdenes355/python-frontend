import React, { useContext, useState } from "react";
import { Button, Grid, Stack } from "@mui/material";
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

import DebugContext from "../models/DebugContext";
import ChallengeContext from "../challenge/ChallengeContext";

type DebugPaneProps = {
  debugContext: DebugContext;
  canContinue: boolean;
  canKill: boolean;
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

const VariableRow = (props: { name: string; value?: string }) => {
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
      </TableCell>
    </TableRow>
  );
};

const DebugPane = (props: DebugPaneProps) => {
  const challengeContext = useContext(ChallengeContext);
  const hasLocals = props.debugContext.locals.size > 0;
  return (
    <Stack sx={{ height: "100%" }}>
      <Paper sx={{ width: "100%", pl: 1, pb: 1 }}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item>
            <Button
              variant="contained"
              color="success"
              disabled={!props.canContinue}
              onClick={() => challengeContext?.actions["continue"]()}
            >
              Continue
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              disabled={!props.canContinue}
              onClick={() => challengeContext?.actions["step"]()}
            >
              Step into
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="error"
              disabled={!props.canKill}
              onClick={() => challengeContext?.actions["kill"]()}
            >
              Stop
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ width: "100%", overflow: "hidden", height: "100%" }}>
        {props.canContinue ? (
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
                      {Array.from(props.debugContext.locals.keys()).map(
                        (key) => (
                          <VariableRow
                            key={`local-${key}`}
                            name={key}
                            value={props.debugContext.locals.get(key)}
                          />
                        )
                      )}
                    </>
                  ) : undefined}
                  <TableRow key="global">
                    <TableCell className="hh col-name">
                      {hasLocals ? "GLOBAL VARIABLES" : "VARIABLES"}
                    </TableCell>
                    <TableCell className="col-value" />
                  </TableRow>
                  {Array.from(props.debugContext.globals.keys()).map((key) => (
                    <VariableRow
                      key={`local-${key}`}
                      name={key}
                      value={props.debugContext.globals.get(key)}
                    />
                  ))}
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
