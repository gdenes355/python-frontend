import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import copy from "clipboard-copy";
import { Tooltip } from "@mui/material";

type InfoDialogProps = {
  title?: string;
  text?: string;
  open: boolean;
  onClose: () => void;
};

const InfoDialog = (props: InfoDialogProps) => {
  const { open } = props;

  const [copied, setCopied] = useState(false);

  return (
    <Dialog open={open} onClose={props.onClose}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{ wordWrap: "break-word", overflowY: "auto", maxHeight: "400px" }}
        >
          {props.text}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Tooltip
          title="copied to clipboard"
          leaveDelay={1500}
          open={copied}
          onClose={() => setCopied(false)}
        >
          <Button
            onClick={() => {
              if (props.text) {
                copy(props.text).then(() => setCopied(true));
              }
            }}
          >
            Copy
          </Button>
        </Tooltip>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoDialog;
