import React, { useEffect, useState } from "react";
import {
  Box,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  Paper,
  TableCell,
  TableHead,
  Collapse,
  IconButton,
  CircularProgress,
  Container,
} from "@mui/material";

import BookNodeModel from "../models/BookNodeModel";
import { AllTestResults } from "../models/Tests";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneIcon from "@mui/icons-material/Done";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

import "./BookReport.css";

type BookReportProps = {
  bookRoot: BookNodeModel;
  allTestResults: AllTestResults;
  onCloseReport: () => void;
};

type ResultsDecorator = {
  passCount: number;
  failCount: number;
  unknownCount: number;
  isLeafNode: boolean;
  isDummy: boolean;

  children?: ResultsDecorator[];

  node: BookNodeModel; // link to original node
};

const decorateWithResults: (
  node: BookNodeModel,
  results: AllTestResults
) => ResultsDecorator = (node, results) => {
  let passCount = 0;
  let failCount = 0;
  let unknownCount = 0;
  let isLeafNode = false;
  let children: ResultsDecorator[] = [];

  if (!node.children || node.children.length === 0) {
    // leaf node
    passCount = results.passed.has(node.id) ? 1 : 0;
    failCount = results.failed.has(node.id) ? 1 : 0;
    if (node.tests || node.isExample) {
      unknownCount = 1 - passCount - failCount;
    } else {
      unknownCount = 0;
    }
    isLeafNode = true;
  } else {
    // section
    for (const child of node.children) {
      let decoratedChild = decorateWithResults(child, results);
      passCount += decoratedChild.passCount;
      failCount += decoratedChild.failCount;
      unknownCount += decoratedChild.unknownCount;
      children.push(decoratedChild);
    }
  }
  let isDummy = passCount + failCount + unknownCount === 0;
  return {
    passCount,
    failCount,
    unknownCount,
    isLeafNode,
    node,
    children,
    isDummy,
  };
};

const StatusIndicator = (props: { node: ResultsDecorator }) => {
  const { node } = props;
  const resSumCount = node.passCount + node.failCount + node.unknownCount;
  const passPerc = (node.passCount * 100) / resSumCount;
  const failPerc = (node.failCount * 100) / resSumCount;

  if (node.passCount > 0 && node.failCount === 0 && node.unknownCount === 0)
    return <DoneIcon color="success" />;

  if (node.failCount > 0 && node.passCount === 0 && node.unknownCount === 0)
    return <CancelIcon color="error" />;

  if (node.isDummy) return <span />;

  return (
    <div className="progress-container">
      <CircularProgress
        className="progress progress-fail"
        variant="determinate"
        value={passPerc + failPerc}
        color="error"
        size="20px"
        thickness={8}
      />
      <CircularProgress
        className="progress progress-pass"
        variant="determinate"
        value={passPerc}
        color="success"
        size="20px"
        thickness={8}
      />
    </div>
  );
};

const ResultRow = (props: { node: ResultsDecorator }) => {
  const { node } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow className="content-row" onClick={() => setOpen(!open)}>
        <TableCell>
          {node.isLeafNode ? (
            <div>&nbsp;</div>
          ) : (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>{node.node.name}</TableCell>
        <TableCell>
          <StatusIndicator node={node} />
        </TableCell>
        <TableCell>{!node.isDummy ? node.passCount : undefined}</TableCell>
        <TableCell>{!node.isDummy ? node.failCount : undefined}</TableCell>
        <TableCell>{!node.isDummy ? node.unknownCount : undefined}</TableCell>
      </TableRow>
      {node.isLeafNode ? undefined : (
        <TableRow className="children-row">
          <TableCell colSpan={6} className="children-cell">
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Table size="small">
                <TableBody>
                  {node.children?.map((child) => (
                    <ResultRow key={child.node.id} node={child} />
                  ))}
                </TableBody>
              </Table>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};

const BookReport = (props: BookReportProps) => {
  const [decoratedRoot, setDcrtdRoot] = useState<ResultsDecorator | null>(null);
  useEffect(() => {
    setDcrtdRoot(decorateWithResults(props.bookRoot, props.allTestResults));
  }, [props]);

  if (!decoratedRoot) {
    return <p>Generating report...</p>;
  }
  return (
    <Box sx={{ overflowY: "auto", height: "100%" }}>
      <Container className="report">
        <IconButton onClick={props.onCloseReport}>
          <NavigateBeforeIcon />
        </IconButton>

        <p>Report generated {new Date().toLocaleString()}</p>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Name</TableCell>
                <TableCell className="theader" />
                <TableCell className="theader">
                  <DoneIcon color="success" />
                </TableCell>
                <TableCell className="theader">
                  <CancelIcon color="error" />
                </TableCell>
                <TableCell className="theader">
                  <QuestionMarkIcon color="warning" />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <ResultRow node={decoratedRoot} />
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default BookReport;
