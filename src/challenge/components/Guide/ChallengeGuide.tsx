import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import ChallengeContext from "../../ChallengeContext";
import Guide from "../../../components/Guide";
import { TextField } from "@mui/material";

type ChallengeGuideProps = {
  initialMd: string;
  challengeId?: string;
  turtleExampleImage?: string;

  isEditing?: boolean;
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
        <TextField
          multiline
          margin="dense"
          value={md}
          onChange={(e) => setMd(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{ width: "100%", height: "100%", overflowY: "auto" }}
        />
      );
    }
    return (
      <Guide
        challengeId={props.challengeId}
        md={md}
        turtleExampleImage={props.turtleExampleImage}
      />
    );
  }
);

export default ChallengeGuide;
export type { ChallengeGuideRef };
