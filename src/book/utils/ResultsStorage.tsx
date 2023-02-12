import { useContext, useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import SessionContext from "../../auth/SessionContext";

const useResultsStorage = (bookPath: string) => {
  const sessionContext = useContext(SessionContext);

  const [wsConnectionUrl, setWsConnectionUrl] = useState<string>("");
  const { sendMessage, readyState } = useWebSocket(wsConnectionUrl);

  useEffect(() => {
    if (!sessionContext.resultsEndpoint) {
      setWsConnectionUrl("");
      return;
    }

    if (sessionContext.resultsProtocol === "ws") {
      if (wsConnectionUrl === sessionContext.resultsEndpoint) {
        return; // we already have an active connection
      }
      setWsConnectionUrl(sessionContext.resultsEndpoint);
    }
  }, [
    sessionContext.resultsEndpoint,
    sessionContext.token,
    sessionContext.resultsProtocol,
    wsConnectionUrl,
  ]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(
        JSON.stringify({
          Authorization: sessionContext.token,
          book: bookPath,
        })
      );
    }
    console.log(readyState);
  }, [readyState, bookPath, sendMessage, sessionContext.token]);

  const setResult = (challengeId: string, outcome: boolean) => {
    if (!sessionContext.isLoggedIn() || !sessionContext.resultsEndpoint) return;
    if (sessionContext.resultsProtocol === "REST") {
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
    } else if (sessionContext.resultsProtocol === "ws") {
      if (readyState === ReadyState.OPEN) {
        sendMessage(
          JSON.stringify({
            id: challengeId,
            outcome: outcome,
          })
        );
      }
    }
  };

  return setResult;
};

export { useResultsStorage };
