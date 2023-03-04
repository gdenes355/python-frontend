import React, { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { ClassModel } from "./Models";
import { Box, Chip } from "@mui/material";

type AddGroupDialogProps = {
  groups: ClassModel[];
  open: boolean;
  onInputEntered: (data: string) => void;
  onClose: () => void;
};

const AddGroupDialog = (props: AddGroupDialogProps) => {
  const { open } = props;
  const [classShortName, setClassShortName] = useState<string | undefined>(
    undefined
  );
  const [teacher, setTeacher] = useState<string | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(
    new Date().getFullYear()
  );

  const [proposedName, setProposedName] = useState<string>("");

  useEffect(() => {
    if (open) {
      setClassShortName(undefined);
      setTeacher(undefined);
      setYear(new Date().getFullYear());
    }
  }, [open]);

  const existingGroupNames = useMemo(
    () => new Set(props.groups.map((g) => g.name)),
    [props.groups]
  );

  useEffect(() => {
    let nextYear = year
      ? ((year - Math.floor(year / 100) * 100 + 1) % 100)
          .toString()
          .padStart(2, "0")
      : undefined;
    let newName = `${classShortName || ""} ${teacher || ""} ${year || ""}${
      year && nextYear ? "-" : ""
    }${nextYear || ""}`.trim();

    setProposedName(newName);
  }, [classShortName, teacher, year]);

  return (
    <Dialog open={open} onClose={props.onClose}>
      <DialogTitle>Add new group</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          error={classShortName === ""}
          margin="dense"
          label="Class name. E.g. 9A"
          value={classShortName || ""}
          fullWidth
          variant="standard"
          autoComplete="off"
          onChange={(e) => setClassShortName(e.target.value)}
        />
        <TextField
          margin="dense"
          error={teacher === ""}
          label="Teacher"
          value={teacher || ""}
          fullWidth
          variant="standard"
          autoComplete="off"
          onChange={(e) => setTeacher(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Start of academic year"
          value={year || ""}
          fullWidth
          variant="standard"
          autoComplete="off"
          onChange={(e) => setYear(parseInt(e.target.value) || undefined)}
          type="number"
        />
        <Box sx={{ marginTop: 2 }}>
          Your new group will be called
          <Chip
            sx={{ marginLeft: 2 }}
            color={
              proposedName
                ? existingGroupNames.has(proposedName)
                  ? "error"
                  : "primary"
                : "default"
            }
            label={proposedName}
          ></Chip>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            props.onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={!proposedName || existingGroupNames.has(proposedName)}
          onClick={() => {
            if (!proposedName || existingGroupNames.has(proposedName)) return;
            props.onInputEntered(proposedName);
          }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGroupDialog;
