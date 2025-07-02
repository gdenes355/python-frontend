import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import BookUpload from "./BookUpload";

type BookUploadModalProps = {
  visible: boolean;
  onBookUploaded: (file: File, edit: boolean) => void;
  onClose: () => void;
};

export default function BookUploadModal(props: BookUploadModalProps) {
  return (
    <Dialog
      open={props.visible}
      onClose={props.onClose}
      aria-labelledby="upload book zip"
      aria-describedby="upload a new book zip of challenges"
    >
      <DialogTitle>Upload book zip</DialogTitle>
      <DialogContent style={{ width: "400px" }}>
        <BookUpload onBookUploaded={props.onBookUploaded} />
      </DialogContent>
    </Dialog>
  );
}
