import React from 'react'
import {Button, Grid, Box, Stack, InputLabel,MenuItem,Select,FormControl,IconButton,} from '@mui/material';
import ListIcon from '@mui/icons-material/List';

import TestResultsIndicator from './TestResultIndicator';

import {TestResults} from '../models/Tests'

type MainControlsProps = {
    canDebug: boolean,
    canSubmit: boolean,
    canReset: boolean,
    testResults: TestResults,
    hasBook: boolean,
    theme: string,
    onDebug: () => void,
    onSubmit: () => void,
    onResetCode: () => void,
    openBookDrawer?: (open: boolean) => void,
    onThemeChange: (theme: string) => void
};


const MainControls = (props: MainControlsProps) => (
    <Grid container spacing={2} style={{ display: 'flex' }}>
        <Grid item style={{ flexGrow: 1 }}>
            <Stack spacing={2} direction="row">
            <Box>
                <Button variant="contained" color="primary" 
                    disabled={ !props.canDebug } 
                    onClick={props.onDebug}>
                    Debug
                </Button>
            </Box>
            {props.canSubmit ? (
                <Box>
                    <Button variant="contained" color="primary" 
                    disabled={ !props.canDebug } 
                    onClick={props.onSubmit}>
                    Submit
                </Button>
                </Box>) : null 
            } 
            <TestResultsIndicator testResults={props.testResults}></TestResultsIndicator>
            </Stack>     
        </Grid>         
        <Grid item><Button variant="contained" color="error" 
            disabled={ !props.canReset } 
            onClick={props.onResetCode}>Reset</Button>
        </Grid>
        <Grid item>
            <FormControl size="small">
                <InputLabel id="theme-label">Theme</InputLabel>
                <Select
                    labelId="theme-label"
                    id="demo-simple-select"
                    value={props.theme ?? "vs-dark"}
                    onChange={(evt) => props.onThemeChange(evt.target.value)}
                    label="Theme">
                        <MenuItem value="vs-dark">Dark</MenuItem>
                        <MenuItem value="vs-light">Light</MenuItem>
                </Select>
            </FormControl>
        </Grid>
        {props.hasBook ? 
            <Grid item><IconButton color="primary" onClick={() => props.openBookDrawer ? props.openBookDrawer(true) : undefined }><ListIcon></ListIcon></IconButton></Grid>
            : null }
    </Grid>
)

export default MainControls
