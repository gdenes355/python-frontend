import { createContext } from "react";
import LoginInfo from "./LoginInfo";

type SessionContextType = {
  token: string;
  requiresAuth: boolean;
  bookPath: string;
  resultsEndpoint: string;
  resultsProtocol: "REST" | "ws";
  logout: () => void;
  login: (info: LoginInfo) => void;
  setToken: (token: string) => void;
  isLoggedIn: () => boolean;
};

const defContext: SessionContextType = {
  token: "",
  requiresAuth: false,
  bookPath: "",
  resultsEndpoint: "",
  resultsProtocol: "REST",
  logout: () => {},
  login: (info: LoginInfo) => {},
  setToken: (token: string) => {},
  isLoggedIn: () => false,
};

const SessionContext = createContext(defContext);

export default SessionContext;
export { SessionContextType as SessionContextType };
