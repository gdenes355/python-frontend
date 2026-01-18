import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { TestCases } from "../../../../models/Tests";
import TestCaseEditor, { TestCaseEditorHandle } from "./TestCaseEditor";
import { Box, Button, CircularProgress, Fab, Tooltip } from "@mui/material";
import useAiTeacherTests from "../../../../ai/hooks/useAiTeacherTests";
import NotificationsContext from "../../../../components/NotificationsContext";
import SessionContext from "../../../../auth/contexts/SessionContext";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddIcon from "@mui/icons-material/Add";

type TestEditorProps = {
  challengeId: string;
  tests?: TestCases;
  guideMd?: string;
  starterCode?: string;
  hasEdited?: boolean;
  onChange?: () => void;
};

type TestEditorHandle = {
  getValue: () => TestCases;
};

const TestEditor = React.forwardRef<TestEditorHandle, TestEditorProps>(
  ({ tests, guideMd, starterCode, hasEdited, onChange, challengeId }, ref) => {
    const { canUseAi } = useContext(SessionContext);
    const [testCases, setTestCases] = useState<TestCases>(tests || []);

    const testCaseRefs = useRef<(TestCaseEditorHandle | null)[]>([]);
    const notificationsContext = useContext(NotificationsContext);

    const { mutate: generateTests, isPending: isGeneratingTests } =
      useAiTeacherTests({
        onSuccess: (data) => {
          setTestCases([...testCases, ...data]);
          onChange?.();
        },
        onError: (error) => {
          notificationsContext.addMessage(error.message, "error");
        },
      });

    useEffect(() => {
      setTestCases(tests || []);
    }, [tests]);

    const getValue = () => {
      if (!testCases) return [];
      return testCases.map(
        (t, i) => testCaseRefs.current?.[i]?.getValue() || t,
      );
    };
    useImperativeHandle(ref, () => ({
      getValue,
    }));

    const generateImpediment = useMemo(() => {
      if (hasEdited) {
        return "Save your changes first to generate a solution";
      }
      if (!guideMd) {
        return "No guide found. Please save your changes first to generate a solution";
      }
      if (!starterCode) {
        return "No starter code found. Please save your changes first to generate a solution";
      }
      return undefined;
    }, [hasEdited, guideMd, starterCode]);

    const handleGenerateTests = () => {
      if (!guideMd) {
        notificationsContext.addMessage(
          "No guide found. Please save your changes first to generate a solution",
          "error",
        );
        return;
      }
      if (!starterCode) {
        notificationsContext.addMessage(
          "No starter code found. Please save your changes first to generate a solution",
          "error",
        );
        return;
      }
      generateTests({
        guideMd: guideMd || "",
        starterCode: starterCode || "",
      });
    };

    return (
      <div>
        {testCases?.map((test, i) => (
          <TestCaseEditor
            key={challengeId + i}
            testCase={test}
            onChange={onChange}
            onDel={() => {
              setTestCases((t) => t.filter((_, j) => j !== i));
              onChange?.();
            }}
            ref={(r) => (testCaseRefs.current[i] = r)}
          />
        ))}
        <Box sx={{ marginTop: "10px" }}>
          <Tooltip title="Add new test case">
            <Button
              sx={{ width: "100%", justifyContent: "left" }}
              onClick={() => {
                setTestCases([...testCases, { in: [], out: "" }]);
              }}
            >
              <AddIcon />
            </Button>
          </Tooltip>
        </Box>
        <Box sx={{ height: "100px" }} />
        {canUseAi ? (
          <Box sx={{ position: "absolute", bottom: "5px", left: "5px" }}>
            <Tooltip
              title={generateImpediment || "Ask AI to draft a solution for you"}
            >
              <span>
                <Fab
                  size="small"
                  color="secondary"
                  onClick={() => {
                    handleGenerateTests();
                  }}
                  disabled={isGeneratingTests || !!generateImpediment}
                >
                  {isGeneratingTests ? (
                    <CircularProgress size={24} color="warning" />
                  ) : (
                    <AutoAwesomeIcon />
                  )}
                </Fab>
              </span>
            </Tooltip>
          </Box>
        ) : null}
      </div>
    );
  },
);

export default TestEditor;
export type { TestEditorHandle };
