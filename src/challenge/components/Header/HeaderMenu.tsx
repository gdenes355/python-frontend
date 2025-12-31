import React, { useCallback, useContext } from "react";
import {
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import RestoreIcon from "@mui/icons-material/Restore";
import ChallengeContext from "../../ChallengeContext";
import SessionContext from "../../../auth/contexts/SessionContext";
import EditIcon from "@mui/icons-material/Edit";

type HeaderMenuProps = {
  canReset?: boolean;
  usingFixedInput: boolean;
  onUsingFixedInputChange: (fixedInput: boolean) => void;
  onBookUpload?: () => void;
};

const HeaderMenu = (props: HeaderMenuProps) => {
  const { canUploadBook } = useContext(SessionContext);
  const challengeContext = useContext(ChallengeContext);
  const openForEditing = useCallback(() => {
    const currentLocation = window.location.href;
    // get all query params from current location
    const queryParams = new URLSearchParams(currentLocation.split("?")[1]);
    // add edit=open-edit to query params
    queryParams.set("edit", "open-edit");
    // redirect to new location
    window.location.href =
      currentLocation.split("?")[0] + "?" + queryParams.toString();
  }, []);
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
      {!challengeContext?.isEditing && canUploadBook ? (
        <MenuItem onClick={openForEditing}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          Open for editing
        </MenuItem>
      ) : undefined}

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
