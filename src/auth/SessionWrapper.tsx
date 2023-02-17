import React, { useEffect, useState } from "react";
import SessionContext, { WsResponse } from "./SessionContext";
import Login from "./Login";
import LoginInfo from "./LoginInfo";
import useWebSocket from "react-use-websocket";

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
    if (queryBookPath !== bookPath && token !== "") {
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

  const onWsMessage = (event: WebSocketEventMap["message"]) => {
    let msg = JSON.parse(event.data);
    if (msg.i && wsMap.has(msg.i)) {
      let future = wsMap.get(msg.i);
      if (future) future(msg);
    }
  };
  const onWsError = (event: WebSocketEventMap["error"]) => {
    console.log(event);
    wsMap.forEach((then) => then({ res: "error" }));
  };
  const onWsOpen = (event: WebSocketEventMap["open"]) => {
    if (bookPath && token) {
      ws.sendMessage(
        JSON.stringify({
          cmd: "welcome",
          Authorization: token,
          book: bookPath,
        })
      );
      wsCounter = 0;
    }
  };
  const ws = useWebSocket(
    wsConnectionUrl,
    { onMessage: onWsMessage, onError: onWsError, onOpen: onWsOpen },
    !!wsConnectionUrl
  );
  useEffect(() => {
    if (!wsEndPoint || !token) {
      setWsConnectionUrl("");
      return;
    }
    if (wsEndPoint === wsConnectionUrl) return;
    setWsConnectionUrl(wsEndPoint);
  }, [wsConnectionUrl, wsEndPoint, token]);

  const wsSend = (msg: any, then: WsResponse | undefined = undefined) => {
    let res = undefined;
    msg.i = wsCounter;
    wsCounter = (wsCounter + 1) % 10000;
    if (then) {
      res = new Promise<string>((resp, rej) => {
        wsMap.set(msg.i, resp);
      }).then(then);
    }
    ws.sendMessage(JSON.stringify(msg));
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
        wsState: ws.readyState,
        wsSend,
      }}
    >
      {requiresAuth && token === "" ? <Login info={loginInfo} /> : children}
    </SessionContext.Provider>
  );
};

export default SessionWrapper;
