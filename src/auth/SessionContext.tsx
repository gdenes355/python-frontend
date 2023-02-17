import { createContext } from "react";
import { ReadyState } from "react-use-websocket";
import LoginInfo from "./LoginInfo";

type WsResponse = (msg: string) => void;

type SessionContextType = {
  token: string;
  requiresAuth: boolean;
  bookPath: string;
  resultsEndpoint: string;
  logout: () => void;
  login: (info: LoginInfo) => void;
  setToken: (token: string) => void;
  isLoggedIn: () => boolean;
  wsState: ReadyState;
  wsSend?: (msg: any, then?: WsResponse) => void;
};

const defContext: SessionContextType = {
  token: "",
  requiresAuth: false,
  bookPath: "",
  resultsEndpoint: "",
  logout: () => {},
  login: (info: LoginInfo) => {},
  setToken: (token: string) => {},
  isLoggedIn: () => false,
  wsState: ReadyState.UNINSTANTIATED,
};

const SessionContext = createContext(defContext);

export default SessionContext;
export { SessionContextType, WsResponse };
