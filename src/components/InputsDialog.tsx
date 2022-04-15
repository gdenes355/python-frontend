import React, { useRef } from 'react';
import { TextField, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";

const InputsDialog = React.forwardRef<HTMLDivElement>((props, ref) => {  
  
  const txtInputs = useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [contents, setContents] = React.useState("");
  const [readonly, setReadonly] = React.useState(true);
  
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleActivate= () => {
    setReadonly(false);
  };

  const handleDeactivate= () => {
    setReadonly(true);
  };  

  return (
    <div>
      <Box onClick={handleClickOpen}>
        Fix inputs
      </Box>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Set Debug Input</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Any text here will be used as line-by-line input instead of prompting from the console. It will be reset for each new challenge.
          </DialogContentText>
          <TextField
            ref={txtInputs}
            margin="dense"
            multiline
            rows={8}
            id="input"
            label="Input"
            type="text"
            fullWidth
            disabled={readonly}
            defaultValue={contents}
            onChange={event => {
              const { value } = event.target;
              setContents(value);
            }}

          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleActivate} color="primary">
            Activate
          </Button>
          <Button onClick={handleDeactivate} color="primary">
            Deactivate
          </Button>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>                  
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default InputsDialog;