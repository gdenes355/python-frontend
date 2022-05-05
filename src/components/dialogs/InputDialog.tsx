import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type InputDialogProps = {
  title?: string;
  message?: string;
  inputLabel?: string;
  defaultValue?: string;
  okButtonLabel?: string;
  open: boolean;
  onInputEntered: (data: string) => void;
  onClose: () => void;
};

const InputDialog = (props: InputDialogProps) => {
  const { open } = props;
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(props.defaultValue || "");
  }, [props.defaultValue]);

  return (
    <Dialog open={open} onClose={props.onClose}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.message}</DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="formField"
          label={props.inputLabel}
          value={value}
          fullWidth
          variant="standard"
          autoComplete="off"
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={(ev) => {
            if (ev.key === "Enter") {
              props.onInputEntered(value);
              ev.preventDefault();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button
          onClick={() => {
            props.onInputEntered(value);
          }}
        >
          {props.okButtonLabel || "Ok"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InputDialog;
