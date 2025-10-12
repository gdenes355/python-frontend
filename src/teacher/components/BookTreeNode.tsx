import {
  TreeItem2,
  TreeItemSlotProps,
  UseTreeItem2LabelSlotOwnProps,
} from "@mui/x-tree-view";
import { BookTreeNodeModel } from "../hooks/useBookTree";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";

interface CustomLabelProps extends UseTreeItem2LabelSlotOwnProps {
  node: BookTreeNodeModel;
  onEditClick: React.MouseEventHandler<HTMLElement>;
  onManageVersionClick: React.MouseEventHandler<HTMLElement>;
  onContextMenu: React.MouseEventHandler<HTMLElement>;
  canEditServerBooksFolder: boolean;
}

const Label = ({
  children,
  onEditClick,
  onManageVersionClick,
  onContextMenu,
  node,
  canEditServerBooksFolder,
  ...props
}: CustomLabelProps) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      flexGrow={1}
      onContextMenu={onContextMenu}
      {...props}
    >
      <Typography>{node.name}</Typography>
      {node.isLeaf && (
        <div>
          {canEditServerBooksFolder && (
            <>
              <Tooltip title="Manage book version on server">
                <IconButton
                  onClick={onManageVersionClick}
                  aria-label="edit item"
                >
                  <ManageHistoryIcon fontSize="inherit" color="primary" />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="Edit book locally">
            <IconButton
              onClick={onEditClick}
              aria-label="edit item"
              color="primary"
            >
              <EditIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </div>
      )}
    </Stack>
  );
};

const BookTreeNode = ({
  node,
  canEditServerBooksFolder,
  onOpenBookVersionManagement,
  onContextMenu,
}: {
  node: BookTreeNodeModel;
  canEditServerBooksFolder: boolean;
  onOpenBookVersionManagement: (bookPath: string) => void;
  onContextMenu: (event: React.MouseEvent, node: BookTreeNodeModel) => void;
}) => {
  const handleIconButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    if (node.isLeaf) {
      window.open(`${node.fullPath}&edit=open-edit`, "_blank");
    }
  };
  const handleContentClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (node.isLeaf) {
      window.open(node.fullPath, "_blank");
    }
  };
  const handleManageVersionClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    const url = new URL(node.fullPath);
    const bookPath = url.searchParams.get("bk");
    if (!bookPath) {
      return;
    }
    onOpenBookVersionManagement(bookPath);
  };
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!node.isLeaf) {
      return;
    }
    event.stopPropagation();
    onContextMenu(event, node);
  };

  return (
    <TreeItem2
      itemId={node.fullPath}
      slots={{
        label: Label,
      }}
      slotProps={
        {
          label: {
            node,
            canEditServerBooksFolder,
            onEditClick: handleIconButtonClick,
            onManageVersionClick: handleManageVersionClick,
            onContextMenu: handleContextMenu,
          },
          content: { onClick: handleContentClick },
        } as TreeItemSlotProps
      }
    >
      {node.children?.map((child) => (
        <BookTreeNode
          key={child.fullPath}
          node={child}
          canEditServerBooksFolder={canEditServerBooksFolder}
          onOpenBookVersionManagement={onOpenBookVersionManagement}
          onContextMenu={onContextMenu}
        />
      ))}
    </TreeItem2>
  );
};

export default BookTreeNode;
