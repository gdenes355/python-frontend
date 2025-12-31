import { Box, Drawer, Divider, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import BookEditorContents, { EditorTestResults } from "./BookEditorContents";

import BookNodeModel, { extractFileNames } from "../../models/BookNodeModel";
import { IEditableBookStore } from "../utils/EditableBookStore";
import { v4 as uuidv4 } from "uuid";

import { findParent } from "../../models/BookNodeModel";
import {
  CodeRunnerRef,
  CodeRunnerStateDisplay,
} from "../../coderunner/useCodeRunner";

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

const BookEditorDrawer = (props: BookEditorDrawerProps) => {
  const addNode = () => {
    let id = uuidv4();
    let existingFileNames = extractFileNames(props.bookRoot);
    console.log(existingFileNames);
    let maxNum = Math.max(
      ...[
        0,
        ...existingFileNames
          .map((f) => f.match(/^(?:\.\/)*c(\d+)\..*/))
          .filter((n) => !!n)
          .map((n) => parseInt(n![1])),
      ]
    );
    let newNum = maxNum + 1;
    let newNode: BookNodeModel = {
      id,
      name: "New page",
      tests: [],
      additionalFiles: [],
      py: `c${newNum.toString().padStart(2, "0")}.py`,
      guide: `c${newNum.toString().padStart(2, "0")}.md`,
    };

    if (newNode.py) {
      props.store.store.save(
        'print("Write your code here")\n',
        `edit://edit/${newNode.py}`
      );
    }
    if (newNode.guide) {
      props.store.store.save("# New page\n", `edit://edit/${newNode.guide}`);
    }

    let parent = findParent(props.bookRoot, props.bookNode) || props.bookRoot;
    if (!parent.children) {
      parent.children = [newNode];
    } else {
      parent.children.push(newNode);
    }

    props.onBookModified();
  };

  return (
    <Drawer
      anchor="right"
      open={props.open}
      onClose={() => props.onRequestOpen(false)}
    >
      <Box
        sx={{
          overflow: "hidden",
          display: "flex",
          height: "100%",
          flexDirection: "column",
        }}
      >
        {props.codeRunner ? (
          <>
            <Box>
              Code runner:{" "}
              <CodeRunnerStateDisplay state={props.codeRunner?.state} />
            </Box>
            <Button onClick={props.onRunTests}>Verify all solutions</Button>
            <Divider />
          </>
        ) : null}

        <Box
          sx={{ width: 250, overflowX: "hidden", flexGrow: "1" }}
          role="presentation"
        >
          <BookEditorContents
            bookRoot={props.bookRoot}
            onNodeSelected={props.onNodeSelected}
            activePageId={props.activePageId}
            onBookModified={props.onBookModified}
            testRes={props.testResults}
          />
        </Box>
        <Divider />
        <Box sx={{ height: "40px" }}>
          <Button
            sx={{ width: "100%", height: "100%" }}
            onClick={() => addNode()}
          >
            <AddIcon />
            &nbsp; Add page
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BookEditorDrawer;
