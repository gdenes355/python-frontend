import * as React from 'react';
import {Button, Grid, Stack} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import "./DebugPane.css"


class DebugPane extends React.Component {
    render() {
        return (
            <Stack sx={{height: "100%", ml: 1}}>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item>
                        <Button variant="contained" color="success" 
                            disabled={ !this.props.canContinue } 
                            onClick={this.props.onContinue }>Continue</Button>
                    </Grid>
                    <Grid item><Button variant="contained" color="error" 
                        disabled={ !this.props.canKill }
                        onClick={ this.props.onKill }>Kill</Button>

                    </Grid>
                </Grid>
                <Paper sx={{ width: '100%', overflow: 'hidden', height: "100%" }}>
                { this.props.canContinue ?
                    <TableContainer sx={{ height: "100%", overflowY: "scroll" }}>
                        <Table className="vartable" size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Variable</TableCell>
                                <TableCell align="right">Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.from(this.props.debugInfo.env.keys()).map((key) => (
                                <TableRow key={key} hover>
                                    <TableCell>{key}</TableCell>
                                    <TableCell align="right">{this.props.debugInfo.env.get(key)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </TableContainer>
                    : undefined }
                </Paper>
            </Stack>
        )
    }
}

export default DebugPane;