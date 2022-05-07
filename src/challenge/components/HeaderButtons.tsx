import React, { useContext } from "react";
import { Grid, IconButton, Button } from "@mui/material";
import { FileDownload } from "@mui/icons-material";
import FileUploadControl from "../../components/FileUploadControl";
import ChallengeContext from "../ChallengeContext";

type HeaderButtonsProps = {
  canReset?: boolean;
};

const HeaderButtons = (props: HeaderButtonsProps) => {
  const challengeContext = useContext(ChallengeContext);
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
      <Grid item>
        <Button
          variant="outlined"
          color="error"
          disabled={!props.canReset}
          onClick={() => challengeContext?.actions["reset-code"]()}
        >
          Reset
        </Button>
      </Grid>
    </React.Fragment>
  );
};

export default HeaderButtons;
