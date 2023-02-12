import { useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import SessionContext from "../../auth/SessionContext";

const useResultsStorage = () => {
  const sessionContext = useContext(SessionContext);

  const [wsConnection, setWsConnection] = useState<Socket | undefined>(
    undefined
  );
  const [wsConnectionUrl, setWsConnectionUrl] = useState<string>("");

  useEffect(() => {
    if (!sessionContext.resultsEndpoint) {
      if (wsConnection) {
        wsConnection.close();
      }
      setWsConnection(undefined);
      setWsConnectionUrl("");
      return;
    }

    if (sessionContext.resultsProtocol === "ws") {
      if (
        wsConnection?.active &&
        wsConnectionUrl === sessionContext.resultsEndpoint
      ) {
        return; // we already have an active connection
      }
      setWsConnection(
        io(sessionContext.resultsEndpoint, {
          transports: ["websocket"],
          auth: { Authorization: sessionContext.token },
        })
      );
      setWsConnectionUrl(sessionContext.resultsEndpoint);
    }
  }, [
    sessionContext.resultsEndpoint,
    sessionContext.token,
    sessionContext.resultsProtocol,
    wsConnection,
    wsConnectionUrl,
  ]);

  useEffect(() => {
    return () => {
      if (wsConnection) wsConnection.close();
      setWsConnection(undefined);
    };
  });

  const setResult = (
    bookPath: string,
    challengeId: string,
    outcome: boolean
  ) => {
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
      if (wsConnection) {
        wsConnection.emit("data", {
          book: bookPath,
          id: challengeId,
          outcome: outcome,
        });
      }
    }
  };

  return setResult;
};

export { useResultsStorage };
