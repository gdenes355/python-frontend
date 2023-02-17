import { useContext } from "react";
import { ReadyState } from "react-use-websocket";
import SessionContext from "../../auth/SessionContext";

const useResultsStorage = (bookPath: string) => {
  const sessionContext = useContext(SessionContext);

  const setResult = (challengeId: string, outcome: boolean) => {
    if (!sessionContext.isLoggedIn()) return;

    // check for ws
    if (sessionContext.wsState === ReadyState.OPEN && sessionContext.wsSend) {
      sessionContext.wsSend({
        cmd: "set-result",
        id: challengeId,
        outcome: outcome,
      });
      return;
    }

    // fall back to REST if available
    if (sessionContext.resultsEndpoint) {
      fetch(sessionContext.resultsEndpoint, {
        method: "POST",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionContext.token}`,
        },
        body: JSON.stringify({
          book: bookPath,
          id: challengeId,
          outcome: outcome,
        }),
      });
    }
  };

  return setResult;
};

export { useResultsStorage };
