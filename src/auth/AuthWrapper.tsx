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

  const login = (info: LoginInfo) => {
    if (!info) return;
    setRequiresAuth(true);
    setToken("");
    setLoginInfo(info);
  };
  const logout = () => {
    localStorage.setItem("jwt-token", "");
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
      }}
    >
      {requiresAuth && token === "" ? <Login info={loginInfo} /> : children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
