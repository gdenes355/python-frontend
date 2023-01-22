import React, { useState } from "react";
import AuthContext from "./AuthContext";
import Login from "./Login";
import LoginInfo from "./LoginInfo";

type AuthWrapperProps = {
  children?: React.ReactNode;
};

const AuthWrapper = (props: AuthWrapperProps) => {
  const { children } = props;

  const [token, setToken] = useState<string>(
    localStorage.getItem("jwt-token") || ""
  );
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);

  const [loginInfo, setLoginInfo] = useState<LoginInfo | undefined>(undefined);

  const [bookPath, setBookPath] = useState<string>(
    localStorage.getItem("jwt-book") || ""
  );

  const [resultsEndpoint, setResultsEndpoint] = useState<string>(
    localStorage.getItem("jwt-results") || ""
  );

  const login = (info: LoginInfo) => {
    if (!info) return;
    setRequiresAuth(true);
    setToken("");
    setLoginInfo(info);
    setBookPath(info.bookPath);
    setResultsEndpoint(info.resultsEndpoint);
    localStorage.setItem("jwt-book", info.bookPath);
    localStorage.setItem("jwt-results", info.resultsEndpoint);
  };

  const logout = () => {
    localStorage.setItem("jwt-token", "");
    localStorage.setItem("jwt-book", "");
    localStorage.setItem("jwt-results", "");
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

  return (
    <AuthContext.Provider
      value={{
        token,
        requiresAuth,
        login,
        logout,
        setToken: setAuthToken,
        isLoggedIn,
        bookPath,
        resultsEndpoint,
      }}
    >
      {requiresAuth && token === "" ? <Login info={loginInfo} /> : children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
