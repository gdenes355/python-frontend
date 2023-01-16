import React, { useState } from "react";
import AuthContext from "./AuthContext";
import Login from "./Login";
import LoginInfo from "./LoginInfo";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import { MsalProvider } from "@azure/msal-react";

const msalInstance = new PublicClientApplication(msalConfig);

type AuthWrapperProps = {
  children?: React.ReactNode;
};

const AuthWrapper = (props: AuthWrapperProps) => {
  const { children } = props;

  const [token, setToken] = useState<string>(
    localStorage.getItem("jwt-token") || ""
  );
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);

  // MSAL
  const [loginInfo, setLoginInfo] = useState<LoginInfo | undefined>(undefined);

  const login = (info: LoginInfo) => {
    if (!info) return;
    setToken("");
    setLoginInfo(info);
    setRequiresAuth(true);
  };
  const logout = () => {
    localStorage.setItem("jwt-token", "");
    setToken("");
    setLoginInfo(undefined);
    msalInstance.logoutPopup({
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
      {!requiresAuth ? (
        children
      ) : (
        <MsalProvider instance={msalInstance}>
          {token ? children : <Login info={loginInfo} />}
        </MsalProvider>
      )}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
