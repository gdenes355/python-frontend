import React, { ReactElement, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Fade,
} from "@mui/material";
import { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneIcon from "@mui/icons-material/Done";
import GradingIcon from "@mui/icons-material/Grading";
import { TestResults, TestResult } from "../models/Tests";

type TestResultsIndicatorProps = {
  testResults: TestResults;
  isAssessment: boolean;
};

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.default,
    color: "rgba(0, 0, 0, 0.87)",
    maxWidth: 800,
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #dadde9",
  },
}));

const InputDisplay = (props: TestResult) => {
  const { ins } = props;
  if (!ins) {
    return <span></span>;
  }

  // string with \n in it
  if (typeof ins === "string") {
    return (
      <span>
        {ins.split("\n").map((x, j) => (
          <span key={j}>
            {x}
            <br />
          </span>
        ))}
      </span>
    );
  }

  // must be an array now
  return (
    <span>
      {ins.map((x, j) => (
        <span key={j}>
          {x}
          <br />
        </span>
      ))}
    </span>
  );
};

type OptionalSpanProps = {
  children: React.ReactNode;
  visible: boolean;
};
const OptionalSpan = (props: OptionalSpanProps) => {
  if (!props.visible) {
    return <span></span>;
  }

  return <span>{props.children}</span>;
};

const ExpectedDisplay = (props: TestResult) => {
  const { expected, criteriaOutcomes } = props;
  if (!expected) {
    return <span></span>;
  }

  // string with \n in it
  if (typeof expected === "string") {
    return (
      <span>
        {expected.split("\n").map((x, j) => (
          <span key={j}>
            {x}
            <br />
          </span>
        ))}
      </span>
    );
  }

  // must be an array now
  return (
    <span>
      {expected.map((x, j) => (
        <span key={j}>
          <span>
            {criteriaOutcomes?.at(j) ? (
              <DoneIcon color="success" sx={{ fontSize: "0.8em" }} />
            ) : (
              <CancelIcon color="error" sx={{ fontSize: "0.8em" }} />
            )}
          </span>{" "}
          <OptionalSpan visible={x.typ?.includes("s") === true}>
            eval <code>{x.statement}</code>
            <br />
          </OptionalSpan>
          <OptionalSpan visible={x.typ?.includes("c") === true}>
            code{" "}
          </OptionalSpan>
          must{" "}
          <OptionalSpan visible={x.typ?.includes("-") === true}>
            not{" "}
          </OptionalSpan>
          contain: <code>{x.pattern}</code>
          <OptionalSpan visible={x.count !== undefined && x.count !== -1}>
            {" "}
            {x.count} time{x.count !== undefined && x.count > 1 ? "s" : ""}
          </OptionalSpan>
          <OptionalSpan visible={!!x.ignore}> ({x.ignore})</OptionalSpan>
          <br />
        </span>
      ))}
    </span>
  );
};

const ResultsTooltip = (
  props: TestResultsIndicatorProps & { children: ReactElement }
) => {
  return (
    <HtmlTooltip
      slots={{
        transition: Fade,
      }}
      slotProps={{
        transition: { timeout: 600 },
      }}
      title={
        <React.Fragment>
          {props.testResults.filter((x) => x.outcome).length} /{" "}
          {props.testResults.length} tests passed
          <TableContainer>
            <Table sx={{}} aria-label="test table" size="small">
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
                        {tr.outcome ? (
                          <DoneIcon color="success"></DoneIcon>
                        ) : (
                          <CancelIcon color="error"></CancelIcon>
                        )}
                      </TableCell>
                      <TableCell>{tr.err}</TableCell>
                      <TableCell>
                        <InputDisplay {...tr} />
                      </TableCell>
                      <TableCell>
                        <ExpectedDisplay {...tr} />
                      </TableCell>
                      <TableCell>
                        {tr.actual?.split("\n").map((x, j) => (
                          <span key={j}>
                            {x}
                            <br />
                          </span>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </React.Fragment>
      }
      arrow
    >
      {props.children}
    </HtmlTooltip>
  );
};

const TestResultsIndicator = (props: TestResultsIndicatorProps) => {
  const allPassing = useMemo(
    () => props.testResults.filter((x) => !x.outcome).length === 0,
    [props.testResults]
  );

  if (props.testResults.length < 1) {
    return <span style={{ width: "35px" }}></span>;
  }

  if (allPassing) {
    if (props.isAssessment) {
      return (
        <HtmlTooltip title="Submitted for manual marking">
          <GradingIcon
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              height: "100%",
            }}
            color="success"
            fontSize="large"
          />
        </HtmlTooltip>
      );
    }
    return (
      <DoneIcon
        style={{
          display: "inline-block",
          verticalAlign: "middle",
          height: "100%",
        }}
        color="success"
        fontSize="large"
      />
    );
  } else {
    return (
      <ResultsTooltip {...props}>
        <CancelIcon
          style={{
            display: "inline-block",
            verticalAlign: "middle",
            height: "100%",
          }}
          color="error"
          fontSize="large"
        />
      </ResultsTooltip>
    );
  }
};

export default TestResultsIndicator;
