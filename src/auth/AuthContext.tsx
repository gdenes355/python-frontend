import { createContext } from "react";
import LoginInfo from "./LoginInfo";

type contextType = {
  token: string;
  requiresAuth: boolean;
  logout: () => void;
  login: (info: LoginInfo) => void;
  setToken: (token: string) => void;
  isLoggedIn: () => boolean;
};
const defContext: contextType = {
  token: "",
  requiresAuth: false,
  logout: () => {},
  login: (info: LoginInfo) => {},
  setToken: (token: string) => {},
  isLoggedIn: () => false,
};

const AuthContext = createContext(defContext);

export default AuthContext;
