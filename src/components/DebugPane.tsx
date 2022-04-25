import React, { useContext } from "react";
import { Button, Grid, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
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
    margin-top: 10px;
    & th {
        background-color: rgb(212, 211, 211) !important;
        border: 1px solid black !important;
    }
`
);

const DebugPane = (props: DebugPaneProps) => {
  const challengeContext = useContext(ChallengeContext);
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
                <TableHead>
                  <TableRow>
                    <TableCell>Variable</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(props.debugContext.env.keys()).map((key) => (
                    <TableRow key={key} hover>
                      <TableCell>{key}</TableCell>
                      <TableCell align="right">
                        {props.debugContext.env.get(key)}
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
