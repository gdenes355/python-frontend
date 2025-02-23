import React, { useContext } from "react";
import { Grid2, IconButton, Button } from "@mui/material";
import { FileDownload } from "@mui/icons-material";
import FileUploadControl from "../../../components/FileUploadControl";
import ChallengeContext from "../../ChallengeContext";

type HeaderButtonsProps = {
  canReset?: boolean;
};

const HeaderButtons = (props: HeaderButtonsProps) => {
  const challengeContext = useContext(ChallengeContext);
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
      <Grid2>
        <Button
          variant="outlined"
          color="error"
          disabled={!props.canReset}
          onClick={() => challengeContext?.actions["reset-code"]()}
        >
          Reset
        </Button>
      </Grid2>
    </React.Fragment>
  );
};

export default HeaderButtons;
