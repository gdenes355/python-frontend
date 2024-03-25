import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

import { TestCases } from "../../../../models/Tests";
import TestCaseEditor, { TestCaseEditorHandle } from "./TestCaseEditor";
import { Box, Button, Tooltip } from "@mui/material";

type TestEditorProps = {
  tests?: TestCases;
  onChange?: () => void;
};

type TestEditorHandle = {
  getValue: () => TestCases;
};

const TestEditor = React.forwardRef<TestEditorHandle, TestEditorProps>(
  (props, ref) => {
    const [testCases, setTestCases] = useState<TestCases>(props.tests || []);

    const testCaseRefs = useRef<(TestCaseEditorHandle | null)[]>([]);

    useEffect(() => {
      setTestCases(props.tests || []);
    }, [props.tests]);

    const getValue = () => {
      if (!testCases) return [];
      return testCases.map(
        (t, i) => testCaseRefs.current?.[i]?.getValue() || t
      );
    };
    useImperativeHandle(ref, () => ({
      getValue,
    }));

    return (
      <div>
        {testCases?.map((test, i) => (
          <TestCaseEditor
            key={i}
            testCase={test}
            onChange={props.onChange}
            onDel={() => {
              setTestCases((t) => t.filter((_, j) => j !== i));
              props.onChange?.();
            }}
            ref={(r) => (testCaseRefs.current[i] = r)}
          />
        ))}
        <Box sx={{ marginTop: "10px" }}>
          <Tooltip title="Add new test case">
            <Button
              onClick={() => {
                setTestCases([...testCases, { in: [], out: "" }]);
              }}
            >
              +
            </Button>
          </Tooltip>
        </Box>
        <Box sx={{ height: "100px" }} />
      </div>
    );
  }
);

export default TestEditor;
export type { TestEditorHandle };
