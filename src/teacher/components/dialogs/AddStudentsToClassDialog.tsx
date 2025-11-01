import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useRef } from "react";
import { sanitisePastedEmails } from "../../utils";

type AddStudentsToClassDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddStudents: (students: string[]) => void;
};

const AddStudentsToClassDialog = ({
  open,
  onClose,
  onAddStudents,
}: AddStudentsToClassDialogProps) => {
  const textfieldUsernamesRef = useRef<HTMLTextAreaElement>(null);
  const handleAddStudents = () => {
    const data = textfieldUsernamesRef?.current?.value || "";
    const studentsToAdd = data.split("\n").map((u) => u.trim());
    onAddStudents(studentsToAdd);
  };
  return (
    <Dialog open={open} onClose={onClose} title="Add students">
      <DialogTitle>Add Students</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter students below, one per line, with or without the @ email
          suffix. You can also paste a list of students from Outlook.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="usernames"
          label="Student usernames"
          fullWidth
          variant="standard"
          multiline
          inputRef={textfieldUsernamesRef}
          inputProps={{ maxLength: 1500 }} // say max 60 students at 25 chars per email
          onPaste={(e) => {
            if (
              e.clipboardData.getData("Text") &&
              textfieldUsernamesRef.current
            ) {
              let txt = sanitisePastedEmails(e.clipboardData.getData("Text"));
              let textarea = textfieldUsernamesRef.current;
              let start_position = textarea.selectionStart;
              let end_position = textarea.selectionEnd;
              textarea.value = `${textarea.value.substring(
                0,
                start_position
              )}${txt}${textarea.value.substring(
                end_position,
                textarea.value.length
              )}`;
              e.preventDefault();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAddStudents}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudentsToClassDialog;
