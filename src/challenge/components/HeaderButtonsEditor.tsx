import React, { useMemo, useContext } from "react";
import {
  Grid,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import FileUploadControl from "../../components/FileUploadControl";
import { FileDownload } from "@mui/icons-material";
import ChallengeContext from "../ChallengeContext";

type HeaderButtonsEditorProps = {
  editingGuide?: boolean;
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
      <Grid item key="py-upload">
        <FileUploadControl
          onUpload={challengeContext?.actions["handle-code-upload"]}
        />
      </Grid>
      <Grid item key="py-download">
        <IconButton
          onClick={() => challengeContext?.actions["download-code"]()}
        >
          <FileDownload />
        </IconButton>
      </Grid>
      <Grid item key="edit-preview">
        <a href={previewUrl} target="_blank" rel="noreferrer noopener">
          <Button>Preview</Button>
        </a>
      </Grid>
      <Grid item key="edit-toggle">
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
      </Grid>
    </React.Fragment>
  );
};

export default HeaderButtonsEditor;
