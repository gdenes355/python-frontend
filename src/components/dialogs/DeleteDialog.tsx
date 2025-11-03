import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type DeleteDialogProps = {
  title?: string;
  message?: string;
  open: boolean;
  onDelete: () => void;
  onClose: () => void;
};

const DeleteDialog = (props: DeleteDialogProps) => {
  const { open } = props;

  return (
    <Dialog open={open} onClose={props.onClose}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.message || "Are you sure you want to delete this?"}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button
          color="error"
          onClick={() => {
            props.onDelete();
          }}
          autoFocus
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
