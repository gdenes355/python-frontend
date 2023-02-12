import React, { useState } from "react";
import SessionContext from "./SessionContext";
import Login from "./Login";
import LoginInfo from "./LoginInfo";

type SessionWrapperProps = {
  children?: React.ReactNode;
};

const SessionWrapper = (props: SessionWrapperProps) => {
  const { children } = props;

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

  const [resultsProtocol, setResultsProtocol] = useState<"REST" | "ws">(() => {
    let v = localStorage.getItem("session-results-protocol");
    if (v === "REST" || v === "ws") {
      return v;
    } else {
      return "REST";
    }
  });

  const login = (info: LoginInfo) => {
    if (!info) return;
    setRequiresAuth(true);
    setToken("");
    setLoginInfo(info);
    setBookPath(info.bookPath);
    setResultsEndpoint(info.resultsEndpoint);
    setResultsProtocol(info.resultsProtocol);
    localStorage.setItem("session-book", info.bookPath);
    localStorage.setItem("session-results-endpoint", info.resultsEndpoint);
    localStorage.setItem("session-results-protocol", info.resultsProtocol);
  };

  const logout = () => {
    localStorage.setItem("jwt-token", "");
    localStorage.setItem("session-book", "");
    localStorage.setItem("session-results-endpoint", "");
    localStorage.setItem("session-results-protocol", "");
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
        resultsProtocol,
      }}
    >
      {requiresAuth && token === "" ? <Login info={loginInfo} /> : children}
    </SessionContext.Provider>
  );
};

export default SessionWrapper;
