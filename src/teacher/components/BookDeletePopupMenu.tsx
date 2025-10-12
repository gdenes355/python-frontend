import React, { useImperativeHandle, useState } from "react";
import { ListItemIcon, Menu, MenuItem, MenuList } from "@mui/material";
import DeleteDialog from "../../components/dialogs/DeleteDialog";
import DeleteIcon from "@mui/icons-material/Delete";

type BookDeletePopupMenuProps = {
  onDeleteBook: (book: string) => void;
};

type BookDeletePopupMenuHandle = {
  handleContextMenu: (e: React.MouseEvent, book: string) => void;
};

const BookDeletePopupMenu = React.forwardRef<
  BookDeletePopupMenuHandle,
  BookDeletePopupMenuProps
>((props, ref) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    book: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useImperativeHandle(ref, () => ({ handleContextMenu }));
  const handleContextMenu = (event: React.MouseEvent, book: string) => {
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            book,
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
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            Delete book
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
          props.onDeleteBook(contextMenu?.book || "");
          close();
        }}
        title="Delete Book"
        message={`Are you sure you want to permanently delete ${contextMenu?.book} from the server? This operation is irreversible.`}
      />
    </>
  );
});

export default BookDeletePopupMenu;
export { BookDeletePopupMenuHandle };
