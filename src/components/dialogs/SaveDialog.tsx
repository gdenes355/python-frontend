import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type SaveDialogProps = {
  title?: string;
  message?: string;
  open: boolean;
  cancelText?: string;
  onSave: () => void;
  onClose: () => void;
};

const SaveDialog = (props: SaveDialogProps) => {
  const { open } = props;

  return (
    <Dialog open={open} onClose={props.onClose}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.message || "Would you like to save your changes?"}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{props.cancelText || "Cancel"}</Button>
        <Button
          color="primary"
          onClick={() => {
            props.onSave();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveDialog;
export { SaveDialogProps };
