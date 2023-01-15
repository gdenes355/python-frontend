import React, { useContext, useEffect, useState } from "react";
import LoginInfo from "./LoginInfo";

import {
  useMsal,
  AuthenticatedTemplate,
  MsalProvider,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { Button } from "@mui/material";
import AuthContext from "./AuthContext";

type LoginProps = {
  info?: LoginInfo;
};

const MsalLogin = (props: LoginProps) => {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string>("");
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (accounts.length > 0) {
      const request = {
        ...loginRequest,
        account: accounts[0],
      };

      // Silently acquires an access token which is then attached to a request for Microsoft Graph data
      instance
        .acquireTokenSilent(request)
        .then((response) => {
          setAccessToken(response?.accessToken || "");
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (!accessToken || !authContext) return;

    authContext.setToken(accessToken);
  }, [accessToken, authContext]);

  const onLoginClick = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.log(e);
    });
  };

  return (
    <React.Fragment>
      <AuthenticatedTemplate>
        {accessToken
          ? "Waiting for the session to begin. Please wait..."
          : "Waiting for MSAL authentication token..."}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onLoginClick()}
        >
          Sign in
        </Button>
      </UnauthenticatedTemplate>
    </React.Fragment>
  );
};

const Login = (props: LoginProps) => {
  const { info } = props;

  if (!info) {
    return <p>Loading login screen. Please wait...</p>;
  }

  return <MsalLogin />;
};

export default Login;
