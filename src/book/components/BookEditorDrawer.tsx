import React from "react";
import { Box, Drawer, Divider, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import BookEditorContents from "./BookEditorContents";

import BookNodeModel from "../../models/BookNodeModel";
import EditableBookStore from "../utils/EditableBookStore";
import { v4 as uuidv4 } from "uuid";

import { findParent } from "../../models/BookNodeModel";

type BookEditorDrawerProps = {
  open: boolean;
  bookRoot: BookNodeModel;
  bookNode: BookNodeModel;
  store: EditableBookStore;
  activePageId?: string;
  onRequestOpen: (open: boolean) => void;
  onNodeSelected: (node: BookNodeModel) => void;
  onBookModified: () => void;
};

const BookEditorDrawer = (props: BookEditorDrawerProps) => {
  const addNode = () => {
    let id = uuidv4();
    let newNode: BookNodeModel = {
      id,
      name: "New page",
      tests: [],
      py: `${id}.py`,
      guide: `${id}.md`,
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
        <Box
          sx={{ width: 250, overflowX: "hidden", flexGrow: "1" }}
          role="presentation"
        >
          <BookEditorContents
            bookRoot={props.bookRoot}
            onNodeSelected={props.onNodeSelected}
            activePageId={props.activePageId}
            onBookModified={props.onBookModified}
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
