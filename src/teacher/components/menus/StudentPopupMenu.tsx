import React, { useImperativeHandle, useState } from "react";
import { Menu, MenuItem, MenuList } from "@mui/material";
import DeleteDialog from "../../../components/dialogs/DeleteDialog";

type StudentPopupMenuProps = {
  onDeleteStudent: (student: string) => void;
};

type StudentPopupMenuHandle = {
  handleContextMenu: (e: React.MouseEvent, student: string) => void;
};

const StudentPopupMenu = React.forwardRef<
  StudentPopupMenuHandle,
  StudentPopupMenuProps
>((props, ref) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    student: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useImperativeHandle(ref, () => ({ handleContextMenu }));
  const handleContextMenu = (event: React.MouseEvent, student: string) => {
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            student,
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
            Remove student
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
          props.onDeleteStudent(contextMenu?.student || "");
          close();
        }}
        title="Remove Student"
        message={`Are you sure you want to remove ${contextMenu?.student} from the class?`}
      />
    </>
  );
});

export default StudentPopupMenu;
export { StudentPopupMenuHandle };
