import React, { useMemo, useContext } from "react";
import {
  Grid2,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import FileUploadControl from "../../../components/FileUploadControl";
import { FileDownload } from "@mui/icons-material";
import ChallengeContext from "../../ChallengeContext";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

type HeaderButtonsEditorProps = {
  editingGuide?: boolean;
  hasUnsavedChanges?: boolean;
  onEditingGuideChange?: (editingGuide: boolean) => void;
};

const HeaderButtonsEditor = (props: HeaderButtonsEditorProps) => {
  const challengeContext = useContext(ChallengeContext);
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location]
  );
  const previewUrl = useMemo(() => {
    let chid = searchParams.get("chid");
    return (
      location.pathname + `?bk=edit://edit/book.json&chid=${chid}&edit=preview`
    );
  }, [searchParams, location]);
  return (
    <React.Fragment>
      <Grid2 key="py-upload">
        <FileUploadControl
          onUpload={challengeContext?.actions["handle-code-upload"]}
        />
      </Grid2>
      <Grid2 key="py-download">
        <IconButton
          onClick={() => challengeContext?.actions["download-code"]()}
        >
          <FileDownload />
        </IconButton>
      </Grid2>
      <Grid2 key="edit-preview">
        <a href={previewUrl} target="_blank" rel="noreferrer noopener">
          <Button>Preview</Button>
        </a>
      </Grid2>
      <Grid2 key="unsaved-changes">
        {props.hasUnsavedChanges ? (
          <Tooltip title="You have unsaved changes">
            <FiberManualRecordIcon sx={{ color: "red", margin: "5px" }} />
          </Tooltip>
        ) : undefined}
      </Grid2>
      <Grid2 key="edit-toggle">
        <FormControlLabel
          control={
            <Switch
              checked={props.editingGuide === true}
              onChange={() => {
                props.onEditingGuideChange?.(!props.editingGuide);
              }}
            />
          }
          label="Edit guide"
        />
      </Grid2>
    </React.Fragment>
  );
};

export default HeaderButtonsEditor;
