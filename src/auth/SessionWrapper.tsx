import React, { useEffect, useMemo, useRef, useState } from "react";
import SessionContext, { WsResponse } from "./SessionContext";
import Login from "./Login";
import LoginInfo from "./LoginInfo";

type SessionWrapperProps = {
  children?: React.ReactNode;
};

var wsCounter = 0;
var wsMap = new Map<number, (value: any | PromiseLike<any>) => void>();

const SessionWrapper = (props: SessionWrapperProps) => {
  const { children } = props;
  const searchParams = new URLSearchParams(document.location.search);
  const queryBookPath = searchParams.get("bk") || searchParams.get("book");

  const [token, setToken] = useState<string>(
    localStorage.getItem("jwt-token") || ""
  );
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);

  const [loginInfo, setLoginInfo] = useState<LoginInfo | undefined>(undefined);

  const [bookPath, setBookPath] = useState<string>(
    localStorage.getItem("session-book") || ""
  );

  const [resultsEndpoint, setResultsEndpoint] = useState<string>(
    localStorage.getItem("session-results-endpoint") || ""
  );

  const [wsEndPoint, setWsEndPoint] = useState<string>(
    localStorage.getItem("session-ws") || ""
  );

  const [wsConnectionUrl, setWsConnectionUrl] = useState<string>("");

  useEffect(() => {
    if (queryBookPath && queryBookPath !== bookPath && token !== "") {
      // so this session now needs to end...
      logout();
    }
  }, [queryBookPath, bookPath, token]);

  const login = (info: LoginInfo) => {
    if (!info) return;
    setRequiresAuth(true);
    setToken("");
    setLoginInfo(info);
    setBookPath(info.bookPath);
    setResultsEndpoint(info.resultsEndpoint);
    setWsEndPoint(info.wsEndPoint);
    localStorage.setItem("session-book", info.bookPath);
    localStorage.setItem("session-results-endpoint", info.resultsEndpoint);
    localStorage.setItem("session-ws", info.wsEndPoint);
  };

  const logout = () => {
    localStorage.setItem("jwt-token", "");
    localStorage.setItem("session-book", "");
    localStorage.setItem("session-results-endpoint", "");
    localStorage.setItem("session-ws", "");
    setToken("");
    setLoginInfo(undefined);
  };
  const isLoggedIn = () => {
    return token !== "";
  };

  const setAuthToken = (newToken: string) => {
    localStorage.setItem("jwt-token", newToken);
    setToken(newToken);
  };

  const onWsMessage = useMemo(
    () => (event: WebSocketEventMap["message"]) => {
      let msg = JSON.parse(event.data);

      if (msg.i !== undefined && wsMap.has(msg.i)) {
        let future = wsMap.get(msg.i);
        if (future) {
          future(msg);
        }
      }
    },
    []
  );
  const onWsError = useMemo(
    () => (event: WebSocketEventMap["error"]) => {
      wsMap.forEach((then) => then({ res: "error" }));
    },
    []
  );
  const onWsOpen = useMemo(
    () => (event: WebSocketEventMap["open"]) => {
      if (bookPath && token) {
        setWsOpen(true);
        ws.current?.send(
          JSON.stringify({
            cmd: "welcome",
            Authorization: token,
            book: bookPath,
          })
        );
        wsCounter = 0;
      }
    },
    [bookPath, token]
  );
  const onWsClose = useMemo(
    () => (event: WebSocketEventMap["close"]) => {
      wsMap.forEach((then) => then({ res: "error" }));
      setWsOpen(false);
    },
    []
  );
  const ws = useRef<WebSocket | undefined>(undefined);
  const [wsOpen, setWsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!wsEndPoint || !token) {
      setWsConnectionUrl("");
      return;
    }
    if (wsEndPoint === wsConnectionUrl) return;
    setWsConnectionUrl(wsEndPoint);
  }, [wsConnectionUrl, wsEndPoint, token]);

  useEffect(() => {
    if (!wsConnectionUrl) {
      ws.current = undefined;
      setWsOpen(false);
      return;
    }
    ws.current = new WebSocket(wsConnectionUrl);
    ws.current.onmessage = onWsMessage;
    ws.current.onerror = onWsError;
    ws.current.onopen = onWsOpen;
    ws.current.onclose = onWsClose;
  }, [wsConnectionUrl, onWsError, onWsOpen, onWsMessage, onWsClose]);

  const wsSend = (msg: any, then: WsResponse | undefined = undefined) => {
    let res = undefined;
    msg.i = wsCounter;
    wsCounter = (wsCounter + 1) % 10000;
    if (then) {
      res = new Promise<string>((resp, rej) => {
        wsMap.set(msg.i, resp);
      }).then(then);
    }
    ws.current?.send(JSON.stringify(msg));
    return res;
  };

  return (
    <SessionContext.Provider
      value={{
        token,
        requiresAuth,
        login,
        logout,
        setToken: setAuthToken,
        isLoggedIn,
        bookPath,
        resultsEndpoint,
        wsOpen,
        wsSend,
      }}
    >
      {requiresAuth && token === "" ? <Login info={loginInfo} /> : children}
    </SessionContext.Provider>
  );
};

export default SessionWrapper;