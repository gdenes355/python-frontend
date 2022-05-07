import React, { useMemo } from "react";
import { Grid, Button, Switch, FormControlLabel } from "@mui/material";
import { useLocation } from "react-router-dom";

type HeaderButtonsEditorProps = {
  editingGuide?: boolean;
  onEditingGuideChange?: (editingGuide: boolean) => void;
};

const HeaderButtonsEditor = (props: HeaderButtonsEditorProps) => {
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location]
  );
  const previewUrl = useMemo(() => {
    let chid = searchParams.get("chid");
    return (
      location.pathname +
      `?book=edit://edit/book.json&chid=${chid}&edit=preview`
    );
  }, [searchParams, location]);
  return (
    <React.Fragment>
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
