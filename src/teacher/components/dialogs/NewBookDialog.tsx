import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { DialogContent } from "@mui/material";
import { useContext, useState } from "react";
import { useBookCreate } from "../../hooks/api/useBookCreate";
import NotificationsContext from "../../../components/NotificationsContext";
type NewBookDialogProps = {
  currentBooks: string[];
  open: boolean;
  onClose: () => void;
};

const NewBookDialog = (props: NewBookDialogProps) => {
  const { open, onClose, currentBooks } = props;
  const [bookName, setBookName] = useState("");
  const isNew = !currentBooks.includes(`books/${bookName}/book.json`);
  const notEndingInSlash = bookName.slice(-1) !== "/";
  const isBlank = bookName === "";
  const notificationsContext = useContext(NotificationsContext);

  const {
    mutate: create,
    isPending: isFetching,
    error,
  } = useBookCreate({
    onSuccess: () => {
      onClose();
      setBookName("");
      notificationsContext.addMessage("Book created", "success");
    },
    onError: (error) => {
      notificationsContext.addMessage(error.message, "error");
    },
  });

  const handleAdd = () => {
    if (!isNew || !notEndingInSlash || isBlank) {
      return;
    }
    create(`books/${bookName}/book.json`);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>New book</DialogTitle>
      <DialogContent>
        <Stack direction="row">
          <span>books/</span>
          <TextField
            autoFocus
            variant="standard"
            label="Book path"
            placeholder="e.g. 9/u3"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            error={!isNew || !notEndingInSlash}
            helperText={
              error?.message || !isNew
                ? "Book path already exists"
                : !notEndingInSlash
                ? "Book path must not end with a slash"
                : ""
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAdd}
          disabled={isFetching || isBlank || !isNew || !notEndingInSlash}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewBookDialog;
