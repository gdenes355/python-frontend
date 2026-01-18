import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import ChallengeContext from "../../ChallengeContext";
import Guide from "../../../components/Guide";
import {
  Box,
  Fade,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";

type ChallengeGuideProps = {
  initialMd: string;
  challengeId?: string;
  turtleExampleImage?: string;
  comment?: string;

  isEditing?: boolean;
  isLoading?: boolean;
};

type ChallengeGuideRef = {
  getValue(): string;
};

const ChallengeGuide = React.forwardRef<ChallengeGuideRef, ChallengeGuideProps>(
  (props, ref) => {
    const challengeContext = useContext(ChallengeContext);

    const [md, setMd] = useState<string>(props.initialMd || "");

    useEffect(() => {
      setMd(props.initialMd);
    }, [props.initialMd]);

    useImperativeHandle(ref, () => ({
      getValue: () => md,
    }));

    if (challengeContext?.isEditing && props.isEditing) {
      return (
        <Box sx={{ height: "100%", display: "flex" }}>
          <TextField
            multiline
            margin="dense"
            value={md}
            onChange={(e) => setMd(e.target.value)}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{ width: "50%", height: "100%", overflowY: "auto" }}
          />
          <Box sx={{ width: "50%", height: "100%", overflowY: "auto" }}>
            <Guide
              challengeId={props.challengeId}
              md={md}
              turtleExampleImage={props.turtleExampleImage}
            />
          </Box>
        </Box>
      );
    }
    if (props.isLoading) {
      return (
        <Fade in={props.isLoading} timeout={500}>
          <div>
            <Typography variant="h3">
              <Skeleton />
            </Typography>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        </Fade>
      );
    }
    return (
      <>
        <Guide
          challengeId={props.challengeId}
          md={md}
          turtleExampleImage={props.turtleExampleImage}
        />
        {props.comment ? (
          <Paper
            sx={{
              marginBottom: 10,
              padding: 1,
              border: 1,
              borderColor: "error.main",
            }}
            elevation={8}
          >
            <h3 style={{ marginTop: 0 }}>Feedback</h3>
            <p>
              {props.comment.split("\n").map((line, idx) => (
                <span key={idx}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </Paper>
        ) : null}
      </>
    );
  },
);

export default ChallengeGuide;
export type { ChallengeGuideRef };
