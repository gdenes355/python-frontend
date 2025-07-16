import React, { useContext } from "react";
import {
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import RestoreIcon from "@mui/icons-material/Restore";
import ChallengeContext from "../../ChallengeContext";

type HeaderMenuProps = {
  canReset?: boolean;
  usingFixedInput: boolean;
  onUsingFixedInputChange: (fixedInput: boolean) => void;
  onBookUpload?: () => void;
};

const HeaderMenu = (props: HeaderMenuProps) => {
  const challengeContext = useContext(ChallengeContext);
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
              size="small"
            />
          }
          label="Use fixed inputs"
        />
      </MenuItem>
      <MenuItem
        sx={{ color: (theme) => theme.palette.error.main }}
        onClick={() => challengeContext?.actions["reset-code"]()}
        disabled={!props.canReset}
      >
        <ListItemIcon>
          <RestoreIcon color="error" />
        </ListItemIcon>
        Reset Code
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
