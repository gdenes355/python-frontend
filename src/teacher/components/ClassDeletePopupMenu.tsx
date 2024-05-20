import React, { useImperativeHandle, useState } from "react";
import { Menu, MenuItem, MenuList } from "@mui/material";
import DeleteDialog from "../../components/dialogs/DeleteDialog";

type ClassDeletePopupMenuProps = {
  onDeleteClass: (klass: string) => void;
};

type ClassDeletePopupMenuHandle = {
  handleContextMenu: (e: React.MouseEvent, klass: string) => void;
};

const ClassDeletePopupMenu = React.forwardRef<
  ClassDeletePopupMenuHandle,
  ClassDeletePopupMenuProps
>((props, ref) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    klass: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useImperativeHandle(ref, () => ({ handleContextMenu }));
  const handleContextMenu = (event: React.MouseEvent, klass: string) => {
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            klass,
          }
        : null
    );
    event.preventDefault();
    event.stopPropagation();
  };

  const close = () => {
    setContextMenu(null);
    setDeleteDialogOpen(false);
  };

  return (
    <>
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
          <MenuItem onClick={() => setDeleteDialogOpen(true)}>
            Delete class
          </MenuItem>
        </MenuList>
      </Menu>
      <DeleteDialog
        open={deleteDialogOpen && contextMenu !== null}
        onClose={() => {
          setDeleteDialogOpen(false);
          close();
        }}
        onDelete={() => {
          props.onDeleteClass(contextMenu?.klass || "");
          close();
        }}
        title="Delete Class"
        message={`Are you sure you want to permanently delete ${contextMenu?.klass}? Related student results will not be lost`}
      />
    </>
  );
});

export default ClassDeletePopupMenu;
export { ClassDeletePopupMenuHandle };
