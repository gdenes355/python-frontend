import React from 'react'
import {Button, Grid, InputLabel,MenuItem,Select,FormControl,IconButton} from '@mui/material'
import SpinnerAdornment from '../components/SpinnerAdornment'
import ListIcon from '@mui/icons-material/List';

class MainControls extends React.Component {

    render() {
        return (
            <Grid container spacing={2}>
                <Grid item>
                    <Button variant="contained" color="success" 
                        disabled={ !this.props.canDebug } 
                        onClick={this.props.onDebug}>
                        Debug{this.props.canDebug ? null : <SpinnerAdornment/>}
                    </Button>
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