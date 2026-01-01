import { createContext } from "react";
import type { LoginInfo } from "../models/LoginInfo";

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
  isTeacher: boolean;
  canUploadBook: boolean;
  isEditingRemote: boolean;
  canUseAi: boolean;
  wsOpen: boolean;
  wsSend?: (msg: any, then?: WsResponse) => void;
  wsReconnect?: () => void;
  registerAdditionalWsHandler?: (handler: (msg: any) => void) => void;
  unregisterAdditionalWsHandler?: () => void;
  serverUrl: string;
};

const defaultSessionContext: SessionContextType = {
  token: "",
  requiresAuth: false,
  bookPath: "",
  resultsEndpoint: "",
  logout: () => {},
  login: () => {},
  setToken: () => {},
  isLoggedIn: () => false,
  isTeacher: false,
  canUploadBook: false,
  isEditingRemote: false,
  canUseAi: false,
  wsOpen: false,
  serverUrl: "",
};

const SessionContext = createContext(defaultSessionContext);

export default SessionContext;
export type { SessionContextType, WsResponse };
