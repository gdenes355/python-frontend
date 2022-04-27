import React, { useEffect, useState, useImperativeHandle, useRef } from "react";

import { Menu, MenuItem, MenuList, Divider } from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import InputDialog from "../../components/dialogs/InputDialog";
import DeleteDialog from "../../components/dialogs/DeleteDialog";

import BookNodeModel, {
  extractIds,
  deleteBookNode,
  promoteBookNode,
  demoteBookNode,
} from "../../models/BookNodeModel";

import "./BookContents.css";

type BookEditorContentsProps = {
  bookRoot: BookNodeModel;
  activePageId?: string;
  onNodeSelected: (node: BookNodeModel) => void;
  onBookModified: () => void;
};

type PopupMenuProps = {
  onOpenNode: (node: BookNodeModel) => void;
  onRenameNode: (node: BookNodeModel) => void;
  onDeleteNode: (node: BookNodeModel) => void;
  onPromoteNode: (node: BookNodeModel) => void;
  onDemote: (node: BookNodeModel) => void;
};
type PopupMenuHandle = {
  handleContextMenu: (e: React.MouseEvent, node: BookNodeModel) => void;
};

const PopupMenu = React.forwardRef<PopupMenuHandle, PopupMenuProps>(
  (props, ref) => {
    const [contextMenu, setContextMenu] = React.useState<{
      mouseX: number;
      mouseY: number;
      node: BookNodeModel;
    } | null>(null);
    const handleContextMenu = (
      event: React.MouseEvent,
      node: BookNodeModel
    ) => {
      setContextMenu(
        contextMenu === null
          ? {
              mouseX: event.clientX - 2,
              mouseY: event.clientY - 4,
              node,
            }
          : null
      );
      event.preventDefault();
      event.stopPropagation();
    };

    const close = () => {
      setContextMenu(null);
    };
    const hasChildren = () => {
      return (
        contextMenu?.node?.children && contextMenu?.node?.children.length > 0
      );
    };

    useImperativeHandle(ref, () => ({ handleContextMenu }));

    const dispatchCommand = (cmd: (node: BookNodeModel) => void) => {
      if (contextMenu?.node) {
        cmd(contextMenu.node);
      }
      close();
    };

    return (
      <Menu
        open={contextMenu !== null}
        onClose={close}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuList dense>
          <MenuItem
            disabled={hasChildren()}
            onClick={() => dispatchCommand(props.onOpenNode)}
          >
            Open
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => dispatchCommand(props.onRenameNode)}>
            Rename
          </MenuItem>
          <MenuItem onClick={() => dispatchCommand(props.onPromoteNode)}>
            Promote subpage
          </MenuItem>
          <MenuItem onClick={() => dispatchCommand(props.onDemote)}>
            Make subpage
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => dispatchCommand(props.onDeleteNode)}>
            Delete
          </MenuItem>
        </MenuList>
      </Menu>
    );
  }
);

type RecursiveItemProps = {
  node: BookNodeModel;
  menu: React.RefObject<PopupMenuHandle>;
};

function RecursiveItem(props: RecursiveItemProps) {
  const { node, menu } = props;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <TreeItem
      label={<div className="test-state-icon">{node.name}</div>}
      nodeId={node.id}
      onContextMenu={(e) => menu.current?.handleContextMenu(e, node)}
    >
      {hasChildren &&
        node.children?.map((item) => (
          <RecursiveItem key={item.id} node={item} menu={menu} />
        ))}
    </TreeItem>
  );
}

type DialogState = {
  typ: "rename" | "delete";
  node: BookNodeModel;
};

const BookEditorContents = (props: BookEditorContentsProps) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [nodeMap, setNodeMap] = useState<Map<string, BookNodeModel>>(new Map());

  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const popupMenuRef = useRef<PopupMenuHandle>(null);

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

  const startRenameNode = (node: BookNodeModel) => {
    setDialogState({ typ: "rename", node });
  };
  const startDeleteNode = (node: BookNodeModel) => {
    setDialogState({ typ: "delete", node });
  };

  const renameNode = (node?: BookNodeModel, newName?: string) => {
    if (node && newName) {
      node.name = newName;
      props.onBookModified();
    }
    setDialogState(null);
  };

  const deleteNode = (node?: BookNodeModel) => {
    if (node) {
      deleteBookNode(props.bookRoot, node);
      props.onBookModified();
    }
    setDialogState(null);
  };

  const promoteNode = (node?: BookNodeModel) => {
    if (node) {
      promoteBookNode(props.bookRoot, node);
      props.onBookModified();
    }
  };

  const demoteNode = (node?: BookNodeModel) => {
    if (node) {
      demoteBookNode(props.bookRoot, node);
      props.onBookModified();
    }
  };

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
        <PopupMenu
          ref={popupMenuRef}
          onOpenNode={props.onNodeSelected}
          onRenameNode={startRenameNode}
          onDeleteNode={startDeleteNode}
          onPromoteNode={promoteNode}
          onDemote={demoteNode}
        />
        <RecursiveItem node={props.bookRoot} menu={popupMenuRef} />
        <InputDialog
          title="Rename"
          defaultValue={dialogState?.node.name}
          inputLabel="name"
          onInputEntered={(data) => {
            renameNode(dialogState?.node, data);
          }}
          open={dialogState?.typ === "rename"}
          onClose={() => setDialogState(null)}
        />
        <DeleteDialog
          open={dialogState?.typ === "delete"}
          message={`Are you sure you want to delete "${dialogState?.node.name}?"`}
          onClose={() => setDialogState(null)}
          onDelete={() => deleteNode(dialogState?.node)}
        />
      </TreeView>
    </div>
  );
};

export default BookEditorContents;
