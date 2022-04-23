import React, { useContext } from "react";
import Console from "../../components/Console";
import ChallengeContext from "../ChallengeContext";

const ChallengeConsole = (props: {
  content: string;
  inputEnabled: boolean;
}) => {
  const challengeContext = useContext(ChallengeContext);
  return (
    <Console
      content={props.content}
      isInputEnabled={props.inputEnabled}
      onInput={(input) => {
        challengeContext?.actions["input-entered"]({ input });
      }}
      onInterrupt={() => challengeContext?.actions["kill"]()}
    />
  );
};

export default ChallengeConsole;
