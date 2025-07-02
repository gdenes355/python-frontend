import React, { useContext } from "react";
import { Grid2, IconButton } from "@mui/material";
import FileDownload from "@mui/icons-material/FileDownload";
import FileUploadControl from "../../../components/FileUploadControl";
import ChallengeContext from "../../ChallengeContext";

const HeaderButtons = () => {
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
    </React.Fragment>
  );
};

export default HeaderButtons;
