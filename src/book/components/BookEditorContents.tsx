import React, { useEffect, useState, useImperativeHandle, useRef } from "react";

import {
  Menu,
  MenuItem,
  MenuList,
  Divider,
  useTheme,
  ListItemIcon,
} from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";

import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";

import InputDialog from "../../components/dialogs/InputDialog";
import DeleteDialog from "../../components/dialogs/DeleteDialog";

import BookNodeModel, {
  extractIds,
  deleteBookNode,
  promoteBookNode,
  demoteBookNode,
  moveBookNodeAfter,
} from "../../models/BookNodeModel";

import "./BookContents.css";
import {
  ArrowBack,
  ArrowForward,
  DriveFileRenameOutline,
} from "@mui/icons-material";

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
            <ListItemIcon>
              <DriveFileRenameOutline />
            </ListItemIcon>
            Rename
          </MenuItem>
          <MenuItem onClick={() => dispatchCommand(props.onPromoteNode)}>
            <ListItemIcon>
              <ArrowBack />
            </ListItemIcon>
            Promote subpage
          </MenuItem>
          <MenuItem onClick={() => dispatchCommand(props.onDemote)}>
            <ListItemIcon>
              <ArrowForward />
            </ListItemIcon>
            Make subpage
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => dispatchCommand(props.onDeleteNode)}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
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
  const theme = useTheme();

  const { isOver, setNodeRef: setNodeDropRef } = useDroppable({
    id: "drop-" + props.node.id,
    data: props.node,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setNodeDragRef,
    transform,
  } = useDraggable({
    id: "drag-" + props.node.id,
    data: props.node,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const dropStyle: React.CSSProperties = {
    borderBottomColor: isOver ? theme.palette.primary.main : "transparent",
    borderBottomStyle: "solid",
    borderBottomWidth: "2px",
  };

  return (
    <div style={dropStyle} ref={setNodeDropRef}>
      <TreeItem
        ref={setNodeDragRef}
        style={style}
        {...listeners}
        {...attributes}
        label={<div className="test-state-icon">{node.name}</div>}
        nodeId={node.id}
        onContextMenu={(e) => menu.current?.handleContextMenu(e, node)}
      >
        {hasChildren &&
          node.children?.map((item) => (
            <RecursiveItem key={item.id} node={item} menu={menu} />
          ))}
      </TreeItem>
    </div>
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

  const activationConstraint = { distance: 15 };
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint,
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint,
  });
  const sensors = useSensors(mouseSensor, touchSensor);
  function handleDragEnd(event: DragEndEvent) {
    let from = event.active.data.current;
    let to = event.over?.data.current;
    if (from && to) {
      moveBookNodeAfter(
        props.bookRoot,
        from as BookNodeModel,
        to as BookNodeModel
      );
      props.onBookModified();
    }
  }

  return (
    <div className="book-contents">
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
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
          <RecursiveItem node={props.bookRoot} menu={popupMenuRef} />
        </TreeView>
      </DndContext>
      <PopupMenu
        ref={popupMenuRef}
        onOpenNode={props.onNodeSelected}
        onRenameNode={startRenameNode}
        onDeleteNode={startDeleteNode}
        onPromoteNode={promoteNode}
        onDemote={demoteNode}
      />
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
    </div>
  );
};

export default BookEditorContents;
