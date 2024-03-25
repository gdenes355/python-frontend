import React from "react";
import {
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";

type HeaderMenuProps = {
  usingFixedInput: boolean;
  onUsingFixedInputChange: (fixedInput: boolean) => void;
  onBookUpload?: () => void;
};

const HeaderMenu = (props: HeaderMenuProps) => {
  return (
    <React.Fragment>
      <MenuItem>
        <FormControlLabel
          control={
            <Switch
              checked={props.usingFixedInput === true}
              onChange={() => {
                props.onUsingFixedInputChange(!props.usingFixedInput);
              }}
            />
          }
          label="Use fixed inputs"
        />
      </MenuItem>

      {props.onBookUpload ? (
        <MenuItem onClick={() => props.onBookUpload && props.onBookUpload()}>
          <ListItemIcon>
            <ArticleIcon />
          </ListItemIcon>
          Upload Book Zip
        </MenuItem>
      ) : undefined}
    </React.Fragment>
  );
};

export default HeaderMenu;
