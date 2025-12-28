import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SessionContext from "../contexts/SessionContext";
import type { WsResponse } from "../contexts/SessionContext";
import Login from "../login/Login";
import type { LoginInfo } from "../models/LoginInfo";
import { absolutisePath } from "../../utils/pathTools";
import { useLocation, Outlet } from "react-router-dom";
import NotificationsContext from "../../components/NotificationsContext";

// eslint-disable-next-line no-var
var wsCounter = 0;
// eslint-disable-next-line no-var
var wsMap = new Map<number, (value: any | PromiseLike<any>) => void>();

const getRoles = (token: string) => {
  if (!token) return [];
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  const blob = JSON.parse(jsonPayload);
  return blob.roles || [];
};

const SessionWrapper = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const queryBookPath = searchParams.get("bk") || searchParams.get("book");

  const notificationsContext = useContext(NotificationsContext);

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
      const queryBookPathAbs = absolutisePath(
        queryBookPath,
        window.location.origin
      );
      const bookPathAbs = absolutisePath(bookPath, window.location.origin);
      if (
        queryBookPathAbs !== "edit://edit/book.json" &&
        new URL(queryBookPathAbs).origin !== new URL(bookPathAbs).origin
      ) {
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

  const isLoggedIn = useCallback(() => {
    return token !== "";
  }, [token]);

  const isTeacher = useCallback(() => {
    return getRoles(token).includes("teacher");
  }, [token]);

  const canUploadBook = useCallback(() => {
    return getRoles(token).includes("book-uploader");
  }, [token]);

  const setAuthToken = (newToken: string) => {
    localStorage.setItem("jwt-token", newToken);
    setToken(newToken);
    notificationsContext.addMessage("Logged in", "success");
  };

  const onWsMessage = useMemo(
    () => (event: WebSocketEventMap["message"]) => {
      const msg = JSON.parse(event.data);
      if (msg.i !== undefined && wsMap.has(msg.i)) {
        const future = wsMap.get(msg.i);
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
    () => () => {
      wsMap.forEach((then) => then({ res: "error" }));
    },
    []
  );
  const onWsOpen = useCallback(() => {
    console.log("WS OPEN");
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
  }, [bookPath, token]);
  const onWsClose = useMemo(
    () => (event: WebSocketEventMap["close"]) => {
      console.log("WS CLOSE", ws.current === event.target, event.target);
      wsMap.forEach((then) => then({ res: "error" }));
      if (ws.current === event.target) {
        setWsOpen(false);
      }
      notificationsContext.addMessage(
        "Websocket closed. Your progress is still saved.",
        "warning"
      );
    },
    [notificationsContext]
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

  const wsReconnect = useCallback(() => {
    console.log("wsConnectionUrl", wsConnectionUrl);
    if (ws.current) {
      if (ws.current) {
        ws.current.close();
      }
      ws.current = undefined;
    }
    if (!wsConnectionUrl) {
      return;
    }

    ws.current = new WebSocket(wsConnectionUrl);
    ws.current.onmessage = onWsMessage;
    ws.current.onerror = onWsError;
    ws.current.onopen = onWsOpen;
    ws.current.onclose = onWsClose;
  }, [wsConnectionUrl, onWsError, onWsOpen, onWsMessage, onWsClose]);

  useEffect(() => {
    wsReconnect?.();
  }, [wsReconnect]);

  const wsSend = (msg: any, then: WsResponse | undefined = undefined) => {
    let res = undefined;
    msg.i = wsCounter;
    wsCounter = (wsCounter + 1) % 10000;
    if (then) {
      res = new Promise<string>((resp) => {
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
        isTeacher,
        canUploadBook,
        bookPath,
        resultsEndpoint,
        wsOpen,
        wsSend,
        wsReconnect,
        registerAdditionalWsHandler,
        unregisterAdditionalWsHandler,
      }}
    >
      {requiresAuth && token === "" ? <Login info={loginInfo} /> : <Outlet />}
    </SessionContext.Provider>
  );
};

export default SessionWrapper;
