import React, { useCallback, useContext, useEffect } from "react";
import ChallengeContext from "../challenge/ChallengeContext";
import { Skeleton } from "@mui/material";

type TurtlePreviewProps = {
  challengeId?: string;
  turtleExampleImage?: string;
};

const TurtlePreview = (props: TurtlePreviewProps) => {
  const challenge = useContext(ChallengeContext);

  const generateNewPreview = useCallback(
    (challengeId?: string) => {
      if (!challengeId || props.challengeId !== challengeId) return;
      if (props.turtleExampleImage) return;
      challenge?.actions["draw-turtle-example"]();
    },
    [props.challengeId, props.turtleExampleImage, challenge]
  );

  useEffect(() => {
    if (!props.challengeId) return;
    const challengeId = props.challengeId;
    const controller = new AbortController();
    setTimeout(() => {
      if (controller.signal.aborted) return;
      generateNewPreview(challengeId);
    }, 500);
    return () => {
      controller.abort();
    };
  }, [props.challengeId, generateNewPreview]);

  if (!props.turtleExampleImage) {
    return (
      <Skeleton
        onClick={() => generateNewPreview(props.challengeId)}
        animation="wave"
        variant="rounded"
        width={500}
        height={400}
        sx={{ cursor: "pointer" }}
      />
    );
  }
  return <img src={props.turtleExampleImage} alt="Turtle preview"></img>;
};

export default TurtlePreview;
