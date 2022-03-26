import React, { useState, useEffect } from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip,Fade} from '@mui/material';
import { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneIcon from '@mui/icons-material/Done';
import {TestResults} from '../models/Tests'

type TestResultsIndicatorProps = {
    testResults: TestResults
};


const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
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


const TestResultsIndicator = (props: TestResultsIndicatorProps) => {

    const [allPassing, setAllPassing] = useState<boolean | null>(null);
    useEffect(() => setAllPassing(props.testResults.filter(x => !x.outcome).length === 0), [props.testResults]);
    
    if (props.testResults.length < 1) {
        return (<span></span>);
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
                    {props.testResults.filter(x => x.outcome).length} / {props.testResults.length} tests passed
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
                            {props.testResults.map((tr, i) => {
                                return (
                                <TableRow key={i}>
                                    <TableCell>
                                        {tr.outcome ? <DoneIcon color="success"></DoneIcon> : <CancelIcon color="error"></CancelIcon>}
                                    </TableCell>
                                    <TableCell>
                                        {tr.err}
                                    </TableCell>
                                    <TableCell>
                                        {tr.ins?.split("\n").map((x, j) => (<span key={j}>{x}<br/></span>))}
                                    </TableCell>
                                    <TableCell>
                                        {tr.expected?.split("\n").map((x, j) => (<span key={j}>{x}<br/></span>))}
                                    </TableCell>
                                    <TableCell>
                                        {tr.actual?.split("\n").map((x, j) => (<span key={j}>{x}<br/></span>))}
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

export default TestResultsIndicator;
