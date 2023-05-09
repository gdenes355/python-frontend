import React, { useEffect, useMemo, useRef, useState } from "react";
import SessionContext, { WsResponse } from "./SessionContext";
import Login from "./Login";
import LoginInfo from "./LoginInfo";
import { absolutisePath } from "../utils/pathTools";
import { useLocation, Outlet } from "react-router-dom";

type SessionWrapperProps = {};

var wsCounter = 0;
var wsMap = new Map<number, (value: any | PromiseLike<any>) => void>();

const SessionWrapper = (props: SessionWrapperProps) => {
  const searchParams = new URLSearchParams(useLocation().search);
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

  const additionalWsListener = useRef<((msg: any) => void) | undefined>(
    undefined
  );

  useEffect(() => {
    if (token !== "" && queryBookPath) {
      // we have a token already and we need to open a book (from query)
      if (queryBookPath === bookPath) {
        // all good, the query matches the current book
        return;
      }

      // otherwise to avoid leaking the token, check that the queryBookPath is from the same origin as the bookPath
      let queryBookPathAbs = absolutisePath(
        queryBookPath,
        window.location.origin
      );
      let bookPathAbs = absolutisePath(bookPath, window.location.origin);
      if (new URL(queryBookPathAbs).origin !== new URL(bookPathAbs).origin) {
        console.log("force logout...", queryBookPathAbs, bookPathAbs);
        logout();
      } else {
        setBookPath(queryBookPath);
        localStorage.setItem("session-book", queryBookPath);
      }
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
      } else {
        if (additionalWsListener.current) {
          additionalWsListener.current(msg);
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
      if (ws.current === event.target) {
        setWsOpen(false);
      }
    },
    []
  );
  const ws = useRef<WebSocket | undefined>(undefined);
  const [wsOpen, setWsOpen] = useState<boolean>(false);

  const registerAdditionalWsHandler = (handler: (msg: any) => void) => {
    additionalWsListener.current = handler;
  };

  const unregisterAdditionalWsHandler = () => {
    additionalWsListener.current = undefined;
  };

  useEffect(() => {
    if (!wsEndPoint || !token) {
      setWsConnectionUrl("");
      return;
    }
    if (wsEndPoint === wsConnectionUrl) return;
    setWsConnectionUrl(wsEndPoint);
  }, [wsConnectionUrl, wsEndPoint, token]);

  useEffect(() => {
    console.log("wsConnectionUrl", wsConnectionUrl);
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
    try {
      ws.current?.send(JSON.stringify(msg));
    } catch (e) {
      console.log("failed to send websocket packet", e);
    }
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
        registerAdditionalWsHandler,
        unregisterAdditionalWsHandler,
      }}
    >
      {requiresAuth && token === "" ? <Login info={loginInfo} /> : <Outlet />}
    </SessionContext.Provider>
  );
};

export default SessionWrapper;
