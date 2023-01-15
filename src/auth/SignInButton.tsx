import React from "react";
import {
  useMsal,
  useIsAuthenticated,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { Button } from "@mui/material";

const SignInButton = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = (loginType: string) => {
    if (loginType === "popup") {
      instance.loginPopup(loginRequest).catch((e) => {
        console.log(e);
      });
    }
  };

  const handleLogout = (logoutType: string) => {
    if (logoutType === "popup") {
      instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/", // redirects the top level app after logout
      });
    }
  };

  return (
    <div>
      <AuthenticatedTemplate>
        <p>You are signed in;{accounts[0]?.username}</p>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleLogout("popup")}
        >
          Log out
        </Button>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleLogin("popup")}
        >
          Sign in using popup
        </Button>
      </UnauthenticatedTemplate>
    </div>
  );
};

export default SignInButton;
