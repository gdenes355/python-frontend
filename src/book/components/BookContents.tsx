import React, { useEffect, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneIcon from "@mui/icons-material/Done";
import GradingIcon from "@mui/icons-material/Grading";

import BookNodeModel, { extractIds } from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";

import "./BookContents.css";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";

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
  const hasChildren = node.children && node.children.length > 0;
  return (
    <TreeItem
      label={
        <div className="test-state-icon">
          {allTestResults.passed.has(node.id) ? (
            node.isAssessment ? (
              <GradingIcon color="success"></GradingIcon>
            ) : (
              <DoneIcon color="success"></DoneIcon>
            )
          ) : allTestResults.failed.has(node.id) ? (
            <CancelIcon color="error"></CancelIcon>
          ) : null}
          {node.name}
        </div>
      }
      itemId={node.id}
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

  const handleSelect = (event: React.SyntheticEvent, nodeId: string | null) => {
    if (!nodeId) return;
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
      <SimpleTreeView
        aria-label="multi-select"
        slots={{
          collapseIcon: ExpandMoreIcon,
          expandIcon: ChevronRightIcon,
        }}
        expandedItems={expandedIds}
        selectedItems={props.activePageId}
        onExpandedItemsChange={handleToggle}
        onSelectedItemsChange={handleSelect}
        sx={{ maxWidth: 400 }}
      >
        <RecursiveItem
          node={props.bookRoot}
          allTestResults={props.allTestResults}
        />
      </SimpleTreeView>
    </div>
  );
};

export default BookContents;
