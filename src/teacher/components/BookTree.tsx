import { useContext, useEffect, useRef, useState } from "react";
import useBookTree, { BookTreeNodeModel } from "../hooks/useBookTree";
import { OutletContextType } from "../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";
import BookTreeNode from "./BookTreeNode";
import { SimpleTreeView } from "@mui/x-tree-view";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderIcon from "@mui/icons-material/Folder";
import BookHistoryDialog from "./BookHistoryDialog";
import { Button } from "@mui/material";
import NewBookDialog from "./NewBookDialog";

import BookDeletePopupMenu, {
  BookDeletePopupMenuHandle,
} from "./BookDeletePopupMenu";
import { useBookDelete } from "../hooks/api/useBookDelete";
import NotificationsContext from "../../components/NotificationsContext";

const BookTree = () => {
  const { canEditServerBooksFolder }: OutletContextType = useOutletContext();
  const notificationContext = useContext(NotificationsContext);
  const [bookPathForVersionManagement, setBookPathForVersionManagement] =
    useState<string | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [newBookOpen, setNewBookOpen] = useState(false);
  const bookDeletePopupRef = useRef<BookDeletePopupMenuHandle>(null);

  const { bookTree, nodeMap: bookNodeMap, bookPathList } = useBookTree();
  const { mutate: deleteBook } = useBookDelete({
    onSuccess: () => {
      notificationContext.addMessage("Book deleted", "success");
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });

  const handleToggle = (_: React.SyntheticEvent, nodeIds: string[]) => {
    setExpandedIds(nodeIds);
  };

  useEffect(() => {
    setExpandedIds([...bookNodeMap.keys()]);
  }, [bookNodeMap]);

  const handleItemClick = (_: React.SyntheticEvent, nodeId: string | null) => {
    if (!nodeId) return;
    const node = bookNodeMap.get(nodeId);
    if (node && node.isLeaf) {
      window.open(node.fullPath, "_blank");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: BookTreeNodeModel) => {
    console.log("handleContextMenu", node);
    const url = new URL(node.fullPath);
    const bookPath = url.searchParams.get("bk");
    if (!node.isLeaf) {
      console.log("Not a leaf", node);
      return;
    }
    console.log("handleContextMenu", node);
    if (!bookPath) {
      return;
    }
    bookDeletePopupRef.current?.handleContextMenu(e, bookPath);
  };

  return (
    <>
      {bookTree ? (
        <SimpleTreeView
          slots={{
            collapseIcon: FolderOpenIcon,
            expandIcon: FolderIcon,
          }}
          expandedItems={expandedIds}
          onExpandedItemsChange={handleToggle}
          disableSelection={true}
          onItemClick={handleItemClick}
        >
          <BookTreeNode
            node={bookTree}
            canEditServerBooksFolder={canEditServerBooksFolder}
            onOpenBookVersionManagement={setBookPathForVersionManagement}
            onContextMenu={handleContextMenu}
          />
        </SimpleTreeView>
      ) : (
        <p>No books available</p>
      )}
      {canEditServerBooksFolder && (
        <Button onClick={() => setNewBookOpen(true)}>Add new book</Button>
      )}
      <BookHistoryDialog
        bookPath={bookPathForVersionManagement}
        onClose={() => setBookPathForVersionManagement(undefined)}
      />
      <NewBookDialog
        open={newBookOpen}
        onClose={() => setNewBookOpen(false)}
        currentBooks={bookPathList || []}
      />
      <BookDeletePopupMenu onDeleteBook={deleteBook} ref={bookDeletePopupRef} />
    </>
  );
};

export default BookTree;
