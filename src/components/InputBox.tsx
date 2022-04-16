import { Box, TextField } from "@mui/material";
import React, { RefObject } from "react";
import "./InputBox.css";

type InputBoxProps = {
};

class InputBox extends React.Component<InputBoxProps> {
  
  private inputFieldEl: RefObject<HTMLInputElement>;

  constructor(props: InputBoxProps) {
    super(props);
    this.inputFieldEl = React.createRef<HTMLInputElement>();
  }

  getValue() {
    if(this.inputFieldEl) {
      return this.inputFieldEl.current?.value;
    }    
  }

  render() {
    return (
        <Box sx={{ width: "100%", height: "100%", bgcolor: "black" }}>
        <div className="console">
          <TextField inputRef={this.inputFieldEl}
            placeholder="add fixed inputs here..."
            multiline
            maxRows={Infinity}
            margin="dense"
            fullWidth
          />         

        </div>
        </Box>
    )
  }
}

export default InputBox;
