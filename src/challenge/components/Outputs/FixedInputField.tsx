import React, { useState, useImperativeHandle } from "react";

import { Box, TextField } from "@mui/material";

type FixedInputFieldProps = {};

type FixedInputFieldHandle = {
  getValue: () => string;
};

const FixedInputField = React.forwardRef<
  FixedInputFieldHandle,
  FixedInputFieldProps
>((_, ref) => {
  const [value, setValue] = useState("");

  const getValue = () => value;
  const clear = () => setValue("");

  useImperativeHandle(ref, () => ({ getValue, clear }));

  return (
    <Box
      sx={{ paddingLeft: 1, paddingRight: 1, height: "100%", overflow: "auto" }}
    >
      <TextField
        placeholder="add fixed inputs here..."
        multiline
        margin="dense"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        variant="standard"
        InputProps={{ disableUnderline: true }}
        sx={{ width: "100%", height: "100%", overflow: "auto" }}
      />
    </Box>
  );
});

export default FixedInputField;
export { FixedInputFieldHandle };
