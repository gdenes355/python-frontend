import { useMsal } from "@azure/msal-react";
import React, { useState } from "react";
import AuthContext from "./AuthContext";
import Login from "./Login";
import LoginInfo from "./LoginInfo";

type AuthWrapperProps = {
  children?: React.ReactNode;
};

const AuthWrapper = (props: AuthWrapperProps) => {
  const { children } = props;
  const { instance } = useMsal();

  const [token, setToken] = useState<string>(
    localStorage.getItem("jwt-token") || ""
  );
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);

  // MSAL
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
    instance.logoutPopup({
      postLogoutRedirectUri: "/",
      mainWindowRedirectUri: "/", // redirects the top level app after logout
    });
  };
  const isLoggedIn = () => {
    return token !== "";
  };

  const setAuthToken = (token: string) => {
    localStorage.setItem("jwt-token", token);
    setToken(token);
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
