import React from "react";
import {
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';

type HeaderMenuProps = {
  usingFixedInput: boolean;
  onUsingFixedInputChange: (fixedInput: boolean) => void;
  onBookUpload?: () => void;
  onShareProgress?: () => void;
  onLoadProgress?: () => void;
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
      {props.onShareProgress ? (
        <MenuItem onClick={() => props.onShareProgress?.()}>
          <ListItemIcon>
            <AssignmentReturnedIcon />
          </ListItemIcon>
          Share Book Progress
        </MenuItem>
      ) : undefined}
      {props.onLoadProgress ? (
        <MenuItem onClick={() => props.onLoadProgress?.()}>
          <ListItemIcon>
            <AssignmentReturnIcon />
          </ListItemIcon>
          Load Book Progress
        </MenuItem>
      ) : undefined}
    </React.Fragment>
  );
};

export default HeaderMenu;
