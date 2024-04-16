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
  Grid,
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
        (props.testCase.in as (number | string)[]).map((v) => "" + v).join("\n")
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
        (r, i) => advancedOutRefs.current?.[i]?.getValue() || r
      ),
    };
  };

  useImperativeHandle(ref, () => ({
    getValue,
  }));

  const summary = useMemo(() => {
    const whole = inString.split("\n").join(", ");
    return whole.length > 30 ? whole.slice(0, 30) + "..." : whole;
  }, [inString]);

  return (
    <Accordion>
      <AccordionSummary sx={{ bgcolor: "primary.main", color: "white" }}>
        <Box sx={{ width: "100%" }}>
          <span>{summary}</span>

          <FormControlLabel
            sx={{ float: "right" }}
            label="Simple"
            control={
              <Switch
                color="default"
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSimpleOutput((x) => !x);
                  props.onChange?.();
                }}
                checked={simpleOutput}
                value={simpleOutput}
              />
            }
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <Grid container sx={{ width: "100%" }}>
          <Grid item xs={4} sx={{ paddingLeft: 1, paddingTop: 1 }}>
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
          </Grid>
          <Grid item xs={8} sx={{ paddingLeft: 1 }}>
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
          </Grid>
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
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
});

export default TestCaseEditor;
export type { TestCaseEditorHandle };
