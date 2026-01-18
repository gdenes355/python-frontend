import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Autocomplete } from "@mui/material";

type InputDialogProps = {
  title?: string;
  message?: string;
  placeholder?: string;
  inputLabel?: string;
  defaultValue?: string;
  okButtonLabel?: string;
  open: boolean;
  type?: "text" | "combo";
  fullWidth?: boolean;
  options?: string[];
  disabledOptions?: string[];
  onInputEntered: (data: string) => void;
  onClose: () => void;
  renderOption?: (option: string) => string;
};

const InputDialog = (props: InputDialogProps) => {
  const { open } = props;
  const [value, setValue] = useState<string | undefined>(undefined);
  const openRef = useRef<boolean>(open);

  const visibleComponentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tryFocus = (remainingAttempts: number) => {
      if (!openRef.current) return;
      if (remainingAttempts <= 0) return;
      if (visibleComponentRef.current?.focus()) return;
      setTimeout(() => tryFocus(remainingAttempts - 1), 50);
    };
    openRef.current = open;
    if (open) {
      tryFocus(5);
      setValue(props.defaultValue || "");
    }
  }, [open]);

  useEffect(() => {
    setValue(props.defaultValue);
  }, [props.defaultValue]);

  return (
    <Dialog open={open} onClose={props.onClose} fullWidth={props.fullWidth}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.message}</DialogContentText>
        {props.type === "combo" ? (
          <Autocomplete
            ref={visibleComponentRef}
            options={props.options || []}
            getOptionDisabled={(option) =>
              props.disabledOptions?.includes(option) || false
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Book"
                variant="standard"
                placeholder={props.placeholder}
              />
            )}
            onChange={(_, n) => setValue(n || "")}
            value={value || ""}
            renderOption={(lprops, option) => (
              <li {...lprops}>
                {props.renderOption ? props.renderOption(option) : option}
              </li>
            )}
          />
        ) : (
          <TextField
            margin="dense"
            id="formField"
            label={props.inputLabel}
            value={value || ""}
            fullWidth
            variant="standard"
            autoComplete="off"
            placeholder={props.placeholder}
            onChange={(e) => setValue(e.target.value)}
            inputRef={visibleComponentRef}
            onKeyPress={(ev) => {
              if (ev.key === "Enter") {
                props.onInputEntered(value || "");
                setValue(props.defaultValue);
                ev.preventDefault();
              }
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setValue(props.defaultValue || "");
            props.onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={props.type === "combo" && !value}
          onClick={() => {
            if (!value) return;
            if (props.type === "combo" && !props.options?.includes(value)) {
              //invalid choice
              return;
            }
            props.onInputEntered(value);
            setValue(props.defaultValue || "");
          }}
        >
          {props.okButtonLabel || "Ok"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InputDialog;
