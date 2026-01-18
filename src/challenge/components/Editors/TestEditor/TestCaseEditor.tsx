import React, {
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
  useMemo,
} from "react";

import { AdvancedOutRequirement, TestCase } from "../../../../models/Tests";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControlLabel,
  Grid2,
  Switch,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import AdvancedOutItemEditor, {
  AdvancedOutItemEditorHandle,
} from "./AdvancedOutItemEditor";

import VeryDenseTableCell from "../../../../components/VeryDenseTableCell";

type TestCaseEditorProps = {
  testCase: TestCase;
  onChange?: () => void;
  onDel?: () => void;
};

type TestCaseEditorHandle = {
  getValue: () => TestCase;
};

const TestCaseEditor = React.forwardRef<
  TestCaseEditorHandle,
  TestCaseEditorProps
>((props, ref) => {
  const [inString, setInString] = useState<string>("");
  const [simpleOutString, setSimpleOutString] = useState<string>("");
  const [advancedOut, setAdvancedOut] = useState<AdvancedOutRequirement[]>([]);
  const advancedOutRefs = useRef<(AdvancedOutItemEditorHandle | null)[]>([]);
  const [simpleOutput, setSimpleOutput] = useState<boolean>(false);

  useEffect(() => {
    if (props.testCase.in instanceof Array) {
      setInString(
        (props.testCase.in as (number | string)[])
          .map((v) => "" + v)
          .join("\n"),
      );
    } else {
      setInString(props.testCase.in + "");
    }

    if (props.testCase.out instanceof Array) {
      setSimpleOutput(false);
      setSimpleOutString("");
      setAdvancedOut((props.testCase.out || []) as AdvancedOutRequirement[]);
    } else {
      setSimpleOutput(true);
      setSimpleOutString(props.testCase.out);
      setAdvancedOut([]);
    }
  }, [props.testCase]);

  const getValue = () => {
    if (simpleOutput) {
      return {
        in: inString.split("\n"),
        out: simpleOutString,
      };
    }
    if (!advancedOut) return { in: inString.split("\n"), out: [] };

    return {
      in: inString.split("\n"),
      out: advancedOut.map(
        (r, i) => advancedOutRefs.current?.[i]?.getValue() || r,
      ),
    };
  };

  useImperativeHandle(ref, () => ({
    getValue,
  }));

  const summary = useMemo(() => {
    let whole = inString.split("\n").join(", ");
    if (simpleOutput) {
      if (simpleOutString) {
        whole += " -> " + simpleOutString.split("\n").join(", ");
      } else {
        return "Blank test case; expand to edit";
      }
    } else {
      whole += " -> ...";
    }
    return whole.length > 30 ? whole.slice(0, 30) + "..." : whole;
  }, [inString, simpleOutput, simpleOutString]);

  return (
    <Accordion
      defaultExpanded
      disableGutters
      sx={{
        border: "1px solid",
        borderRadius: 1,
        borderColor: (theme) => theme.palette.primary.main,
        boxShadow: "3px 3px 3px 0 rgba(0, 0, 0, 0.2)",
        marginBottom: 1,
        padding: 1,
        marginRight: 2,
      }}
    >
      <AccordionSummary>
        <Box sx={{ width: "100%" }}>
          <span>{summary}</span>

          <FormControlLabel
            sx={{ float: "right" }}
            label={simpleOutput ? "Simple" : "Advanced"}
            control={
              <Switch
                color={simpleOutput ? "default" : "primary"}
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSimpleOutput((x) => !x);
                  props.onChange?.();
                }}
                checked={!simpleOutput}
                value={!simpleOutput}
              />
            }
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <Grid2 container sx={{ width: "100%" }}>
          <Grid2 size={{ xs: 4 }} sx={{ paddingLeft: 1, paddingTop: 1 }}>
            <TextField
              multiline
              placeholder="Input"
              size="small"
              sx={{ width: "100%", resize: "none" }}
              inputProps={{ style: { fontFamily: "monospace" } }}
              minRows={2}
              maxRows={8}
              value={inString}
              onChange={(e) => {
                setInString(e.target.value);
                props.onChange?.();
              }}
              variant="standard"
            />
          </Grid2>
          <Grid2 size={{ xs: 8 }} sx={{ paddingLeft: 1 }}>
            {simpleOutput ? (
              <Tooltip title="Simple output. Allowed wildcard: .* to match rest of the line">
                <TextField
                  multiline
                  placeholder="Output"
                  size="small"
                  sx={{ width: "100%", resize: "none" }}
                  inputProps={{ style: { fontFamily: "monospace" } }}
                  minRows={2}
                  maxRows={8}
                  value={simpleOutString}
                  onChange={(e) => {
                    setSimpleOutString(e.target.value);
                    props.onChange?.();
                  }}
                />
              </Tooltip>
            ) : (
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <VeryDenseTableCell>Pattern</VeryDenseTableCell>
                    <VeryDenseTableCell>
                      <Tooltip title="Regex: interpret pattern as a regular expression when button is highlighted">
                        <span>Re</span>
                      </Tooltip>
                    </VeryDenseTableCell>
                    <VeryDenseTableCell>
                      <Tooltip
                        title={
                          <div>
                            Type, with +/- for "contained" or "not contained"
                            in...
                            <p>o:output (default)</p>
                            <p>c:code</p>
                            <p>f:file</p>
                            <p>s:statement</p>
                            <p>t:turtle</p>
                          </div>
                        }
                      >
                        <span>Type</span>
                      </Tooltip>
                    </VeryDenseTableCell>
                    <VeryDenseTableCell>
                      <Tooltip title="Ignore whitespace, capitalisation, punctuation when corresponding button is highlighted">
                        <span>ignore</span>
                      </Tooltip>
                    </VeryDenseTableCell>
                    <VeryDenseTableCell>
                      <Tooltip title="Count; blank means any number of times">
                        <span>#</span>
                      </Tooltip>
                    </VeryDenseTableCell>
                    <VeryDenseTableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {advancedOut.map((req, i) => (
                    <AdvancedOutItemEditor
                      key={i}
                      req={req}
                      ref={(r) => (advancedOutRefs.current[i] = r)}
                      onChange={props.onChange}
                      onDel={() => {
                        setAdvancedOut(advancedOut.filter((_, j) => i !== j));
                        props.onChange?.();
                      }}
                    />
                  ))}
                  <TableRow>
                    <VeryDenseTableCell>
                      <Tooltip title="Add new pattern">
                        <Button
                          sx={{ width: "100%", justifyContent: "left" }}
                          onClick={() => {
                            setAdvancedOut([...advancedOut, { pattern: "" }]);
                            props.onChange?.();
                          }}
                        >
                          +
                        </Button>
                      </Tooltip>
                    </VeryDenseTableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </Grid2>
          <Button
            onClick={() => {
              props.onDel?.();
            }}
            color="error"
            variant="contained"
            sx={{ margin: 1 }}
          >
            Delete
          </Button>
        </Grid2>
      </AccordionDetails>
    </Accordion>
  );
});

export default TestCaseEditor;
export type { TestCaseEditorHandle };
