import React, { useContext } from "react";
import { Button, Grid, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
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
    
    & td {
      padding-top: 1px;
      padding-bottom: 1px;
      padding-left: 3em;
      font-family: monospace;
    }
    & .hh {
      background-color: transparent !important;
      padding-left: 1em;
      font-weight: bold;

    }
`
);

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
                        <TableCell className="hh" colSpan={2}>
                          LOCAL VARIABLES
                        </TableCell>
                      </TableRow>
                      {Array.from(props.debugContext.locals.keys()).map(
                        (key) => (
                          <TableRow key={`local-${key}`} hover>
                            <TableCell>{key}</TableCell>
                            <TableCell align="right">
                              {props.debugContext.locals.get(key)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </>
                  ) : undefined}
                  <TableRow key="global">
                    <TableCell className="hh" colSpan={2}>
                      {hasLocals ? "GLOBAL VARIABLES" : "VARIABLES"}
                    </TableCell>
                  </TableRow>
                  {Array.from(props.debugContext.globals.keys()).map((key) => (
                    <TableRow key={`global-${key}`} hover>
                      <TableCell>{key}</TableCell>
                      <TableCell align="right">
                        {props.debugContext.globals.get(key)}
                      </TableCell>
                    </TableRow>
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
