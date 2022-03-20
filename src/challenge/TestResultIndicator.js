import React, { useState, useEffect } from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip,Fade} from '@mui/material';
import { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneIcon from '@mui/icons-material/Done';


const HtmlTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.white,
      color: 'rgba(0, 0, 0, 0.87)',
      maxWidth: 800,
      fontSize: theme.typography.pxToRem(12),
      border: '1px solid #dadde9',
    },
}));


export default function TestResultsIndicator(props) {

    const [allPassing, setAllPassing] = useState(null);

    useEffect(() => {
        setAllPassing(props.testResults.filter(x => x!==true).length === 0)
    }, [props.testResults])

    
    if (props?.testResults.length < 1) {
        return (<span></span>)
    }

    if (allPassing) {
        return (<DoneIcon style={{display: "inline-block", verticalAlign: "middle", height: "100%"}} color="success" fontSize="large" />)
    } else {
        return (
            <HtmlTooltip 
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
                title={
                <React.Fragment>
                    {props.testResults.filter(x => x===true).length} / {props.testResults.length} tests passed
                    <TableContainer>
                        <Table sx={{ }} aria-label="test table" size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell></TableCell>
                                    <TableCell>Error</TableCell>
                                    <TableCell>Input</TableCell>
                                    <TableCell>Expected</TableCell>
                                    <TableCell>Actual</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                            {props.testResults.map((tr, i) => { return (
                                <TableRow key={i}>
                                    <TableCell>
                                        {tr===true ? <DoneIcon></DoneIcon> : <CancelIcon></CancelIcon>}
                                    </TableCell>
                                    <TableCell>
                                        {tr.err}
                                    </TableCell>
                                    <TableCell>
                                        {tr.ins?.split("\n").map(x => (<span>{x}<br/></span>))}
                                    </TableCell>
                                    <TableCell>
                                        {tr.expected?.split("\n").map(x => (<span>{x}<br/></span>))}
                                    </TableCell>
                                    <TableCell>
                                        {tr.actual?.split("\n").map(x => (<span>{x}<br/></span>))}
                                    </TableCell>
                                </TableRow>);})}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </React.Fragment>
              } arrow>
                <CancelIcon style={{display: "inline-block",  verticalAlign: "middle", height: "100%"}} color="error" fontSize="large" />
            </HtmlTooltip>
        )
    }
}