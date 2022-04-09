import React from "react";
import {
  Button,
  Grid,
  Box,
  Stack,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  ListItemIcon,
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { DevicesFoldRounded } from "@mui/icons-material";

import TestResultsIndicator from "../components/TestResultIndicator";
import Menu from "../components/Menu";

import { TestResults } from "../models/Tests";

type MainControlsProps = {
  canDebug: boolean;
  canSubmit: boolean;
  canReset: boolean;
  testResults: TestResults;
  theme: string;
  guideMinimised: boolean;
  onDebug: () => void;
  onSubmit: () => void;
  onResetCode: () => void;
  onThemeChange: (theme: string) => void;
  onGuideDisplayToggle: () => void;
  onHelpOpen: (open: boolean) => void;
};

const MainControlsStack = (props: MainControlsProps) => {
  return(
        <Stack spacing={2} direction="column" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
            <IconButton onClick={() => {props.onGuideDisplayToggle()}}>
                <DevicesFoldRounded/>
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
            <Box>
              <Button
              variant="contained"
              color="error"
              disabled={!props.canReset}
              onClick={props.onResetCode}
              >
                Reset
              </Button>
            </Box>
            <Box>
                <Menu
                  button={
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                    <MenuItem>
                      <FormControlLabel
                          control={
                            <Switch
                              checked={props.theme === "vs-dark"}
                              onChange={() => {
                                props.onThemeChange(
                                  props.theme === "vs-dark" ? "vs-light" : "vs-dark"
                                );
                              }}
                            ></Switch>
                          }
                          label="Dark mode"
                      />
                    </MenuItem>
                    <MenuItem onClick={() => props.onHelpOpen(true)}>
                        <ListItemIcon>
                          <QuestionMarkIcon />
                        </ListItemIcon>
                        Help
                      </MenuItem>
                </Menu>
            </Box>                                  
        </Stack>
);
}

const MainControlsGrid = (props: MainControlsProps) => {
  return(
        <Grid container spacing={2} style={{ display: "flex" }}>
          <Grid item>
              <IconButton onClick={() => {props.onGuideDisplayToggle()}}>
                  <DevicesFoldRounded/>
              </IconButton>
          </Grid>    
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
          <Grid item>
            <Menu
              button={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            >
              <MenuItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={props.theme === "vs-dark"}
                      onChange={() => {
                        props.onThemeChange(
                          props.theme === "vs-dark" ? "vs-light" : "vs-dark"
                        );
                      }}
                    ></Switch>
                  }
                  label="Dark mode"
                />
              </MenuItem>
              <MenuItem onClick={() => props.onHelpOpen(true)}>
                <ListItemIcon>
                  <QuestionMarkIcon />
                </ListItemIcon>
                Help
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
  );

}

const MainControls = (props: MainControlsProps) => {
  if(props.guideMinimised) {
    return(MainControlsStack(props));
  }
  else {
    return(MainControlsGrid(props));
  }
}

export default MainControls;
