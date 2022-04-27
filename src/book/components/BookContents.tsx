import React, { useEffect, useState } from "react";

import { TreeView, TreeItem } from "@mui/lab";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneIcon from "@mui/icons-material/Done";

import BookNodeModel, { extractIds } from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";

import "./BookContents.css";

type BookContentsProps = {
  bookRoot: BookNodeModel;
  activePageId?: string;
  allTestResults: AllTestResults;
  onNodeSelected: (node: BookNodeModel) => void;
};

type RecursiveArgs = {
  node: BookNodeModel;
  allTestResults: AllTestResults;
};

function RecursiveItem({ node, allTestResults }: RecursiveArgs) {
  const hasChildren = node.children && node.children.length;
  return (
    <TreeItem
      label={
        <div className="test-state-icon">
          {allTestResults.passed.has(node.id) ? (
            <DoneIcon color="success"></DoneIcon>
          ) : allTestResults.failed.has(node.id) ? (
            <CancelIcon color="error"></CancelIcon>
          ) : null}
          {node.name}
        </div>
      }
      nodeId={node.id}
    >
      {hasChildren &&
        node.children?.map((item) => (
          <RecursiveItem
            key={item.id}
            node={item}
            allTestResults={allTestResults}
          />
        ))}
    </TreeItem>
  );
}

const BookContents = (props: BookContentsProps) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [nodeMap, setNodeMap] = useState<Map<string, BookNodeModel>>(new Map());

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpandedIds(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeId: string) => {
    let selectedNode = nodeMap.get(nodeId);
    if (selectedNode) {
      props.onNodeSelected(selectedNode);
    }
  };

  useEffect(() => {
    setNodeMap(extractIds(props.bookRoot));
  }, [props]);

  useEffect(() => {
    setExpandedIds([...nodeMap.keys()]);
  }, [nodeMap]);

  return (
    <div className="book-contents">
      <TreeView
        aria-label="multi-select"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expandedIds}
        selected={props.activePageId}
        onNodeToggle={handleToggle}
        onNodeSelect={handleSelect}
        sx={{ maxWidth: 400 }}
      >
        <RecursiveItem
          node={props.bookRoot}
          allTestResults={props.allTestResults}
        />
      </TreeView>
    </div>
  );
};

export default BookContents;
