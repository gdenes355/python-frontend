import React from 'react'
import {Button, Grid, Box, Stack, InputLabel,MenuItem,Select,FormControl,IconButton,Tooltip,Fade} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel';
import DoneIcon from '@mui/icons-material/Done';
import SpinnerAdornment from '../components/SpinnerAdornment'
import ListIcon from '@mui/icons-material/List';


function TestResults(props) {
    if (props.testTick === null) {
        return (<span></span>)
    }

    if (props.testTick) {
        return (<DoneIcon style={{display: "inline-block", verticalAlign: "middle", height: "100%"}} color="success" fontSize="large" />)
    } else {
        return (
            <Tooltip 
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
                title={
                <React.Fragment>
                    {props.testResults.filter(Boolean).length} / {props.testResults.length} tests passed
                    
                    <div>{props.testResults.map((tr, i) => { return (<span key={i}>{tr ? 
                        <DoneIcon></DoneIcon> :
                        <CancelIcon></CancelIcon>
                }</span>);})}</div>
                </React.Fragment>
              } arrow>
                <CancelIcon style={{display: "inline-block",  verticalAlign: "middle", height: "100%"}} color="error" fontSize="large" />
            </Tooltip>
        )
    }

}

class MainControls extends React.Component {

    constructor(props) {
        super(props);
        this.state = {testTick: null};
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.testResults !== this.props.testResults) {
            let tick = this.props.testResults.length> 0 ? true : null
            for (let i = 0; i < this.props.testResults.length; i++) {
                if (!this.props.testResults[i]) {
                    tick = false;
                    break;
                }
            }
            this.setState({testTick: tick})
        }
    }

    render() {
        return (
            <Grid container spacing={2} style={{ display: 'flex' }}>
                <Grid item style={{ flexGrow: 1 }}>
                    <Stack spacing={2} direction="row">
                    <Box>
                        <Button variant="contained" color="primary" 
                            disabled={ !this.props.canDebug } 
                            onClick={this.props.onDebug}>
                            Debug{this.props.canDebug ? null : <SpinnerAdornment/>}
                        </Button>
                    </Box>
                    {this.props.canSubmit ? (
                        <Box item>
                            <Button variant="contained" color="primary" 
                            disabled={ !this.props.canDebug } 
                            onClick={this.props.onSubmit}>
                            Submit
                        </Button>
                        </Box>) : null 
                    } 
                    <TestResults testTick={this.state.testTick} testResults={this.props.testResults}></TestResults>
                    </Stack>     
                </Grid>         
                <Grid item><Button variant="contained" color="error" 
                    disabled={ !this.props.canReset } 
                    onClick={this.props.onResetCode}>Reset</Button>
                </Grid>
                <Grid item>
                    <FormControl size="small">
                        <InputLabel id="theme-label">Theme</InputLabel>
                        <Select
                            labelId="theme-label"
                            id="demo-simple-select"
                            value={this.props.theme ?? "vs-dark"}
                            onChange={this.props.onThemeChange}
                            label="Theme">
                                <MenuItem value="vs-dark">Dark</MenuItem>
                                <MenuItem value="vs-light">Light</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {this.props.hasBook ? 
                    <Grid item><IconButton color="primary" onClick={(evt) => this.props.toggleBookDrawer(true)}><ListIcon></ListIcon></IconButton></Grid>
                    : null }
            </Grid>
        )
    }
}

export default MainControls