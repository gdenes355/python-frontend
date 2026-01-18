import { Box, Drawer, Divider, Button, Collapse } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import BookEditorContents, { EditorTestResults } from "./BookEditorContents";

import BookNodeModel, { extractFileNames } from "../../models/BookNodeModel";
import { IEditableBookStore } from "../utils/EditableBookStore";
import { v4 as uuidv4 } from "uuid";
import { useCallback, useState } from "react";

import { findParent } from "../../models/BookNodeModel";
import {
  CodeRunnerRef,
  CodeRunnerStateDisplay,
} from "../../coderunner/useCodeRunner";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

type BookEditorDrawerProps = {
  open: boolean;
  bookRoot: BookNodeModel;
  bookNode: BookNodeModel;
  store: IEditableBookStore;
  activePageId?: string;
  onRequestOpen: (open: boolean) => void;
  onNodeSelected: (node: BookNodeModel) => void;
  onBookModified: () => void;
  codeRunner?: CodeRunnerRef;
  testResults?: EditorTestResults;
  onRunTests?: () => void;
};

const BookEditorDrawer = ({
  open,
  bookRoot,
  bookNode,
  store,
  activePageId,
  onRequestOpen,
  onNodeSelected,
  onBookModified,
  codeRunner,
  testResults,
  onRunTests,
}: BookEditorDrawerProps) => {
  const [secondaryAddActionsOpen, setSecondaryAddActionsOpen] = useState(false);

  const addNode = useCallback(
    (typ: "python" | "guide" | "section") => {
      let id = uuidv4();

      const title =
        typ === "python"
          ? "New Challenge"
          : typ === "guide"
          ? "New Guide"
          : "New Section";
      let existingFileNames = extractFileNames(bookRoot);
      let maxNum = Math.max(
        ...[
          0,
          ...existingFileNames
            .map((f) => f.match(/^(?:\.\/)*c(\d+)\..*/))
            .filter((n) => !!n)
            .map((n) => parseInt(n![1])),
        ],
      );
      let newNum = maxNum + 1;
      let newNode: BookNodeModel = {
        id,
        name: title,
        tests: typ === "python" ? [] : undefined,
        additionalFiles: typ === "section" ? undefined : [],
        py:
          typ === "python"
            ? `c${newNum.toString().padStart(2, "0")}.py`
            : undefined,
        guide:
          typ === "python" || typ === "guide"
            ? `c${newNum.toString().padStart(2, "0")}.md`
            : undefined,
        children: typ === "section" ? [] : undefined,
      };

      if (newNode.py) {
        store.store.save(
          'print("Write your code here")\n',
          `edit://edit/${newNode.py}`,
        );
      }
      if (newNode.guide) {
        const text = typ === "python" ? "# New Challenge\n" : "# New Guide\n";
        store.store.save(text, `edit://edit/${newNode.guide}`);
      }

      let parent = findParent(bookRoot, bookNode) || bookRoot;
      if (!parent.children) {
        parent.children = [newNode];
      } else {
        parent.children.push(newNode);
      }

      onBookModified();
      onNodeSelected(newNode);
    },
    [bookRoot, bookNode, store, onBookModified],
  );

  return (
    <Drawer anchor="right" open={open} onClose={() => onRequestOpen(false)}>
      <Box
        sx={{
          overflow: "hidden",
          display: "flex",
          height: "100%",
          flexDirection: "column",
        }}
      >
        {codeRunner ? (
          <>
            <Box>
              Code runner: <CodeRunnerStateDisplay state={codeRunner?.state} />
            </Box>
            <Button onClick={onRunTests}>Verify all solutions</Button>
            <Divider />
          </>
        ) : null}

        <Box
          sx={{ width: 250, overflowX: "hidden", flexGrow: "1" }}
          role="presentation"
        >
          <BookEditorContents
            bookRoot={bookRoot}
            onNodeSelected={onNodeSelected}
            activePageId={activePageId}
            onBookModified={onBookModified}
            testRes={testResults}
          />
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
          }}
        >
          <Box sx={{ height: "40px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                sx={{ width: "100%", height: "100%" }}
                onClick={() => addNode("python")}
              >
                <AddIcon />
                &nbsp; Add challenge
              </Button>
              <Button
                size="small"
                aria-controls={
                  secondaryAddActionsOpen
                    ? "secondary-add-actions-menu"
                    : undefined
                }
                aria-expanded={secondaryAddActionsOpen ? "true" : undefined}
                aria-label="select secondary add action"
                aria-haspopup="menu"
                onClick={() =>
                  setSecondaryAddActionsOpen((prevOpen) => !prevOpen)
                }
              >
                {secondaryAddActionsOpen ? (
                  <ArrowDropUpIcon />
                ) : (
                  <ArrowDropDownIcon />
                )}
              </Button>
            </Box>
          </Box>
          <Collapse in={secondaryAddActionsOpen}>
            <Divider />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <Button onClick={() => addNode("guide")}>Guide-only</Button>
              <Button onClick={() => addNode("section")}>Section</Button>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BookEditorDrawer;
