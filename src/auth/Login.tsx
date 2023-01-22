import React, { useContext, useEffect, useState } from "react";
import LoginInfo from "./LoginInfo";

import {
  useMsal,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  MsalProvider,
} from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";
import { Button } from "@mui/material";
import AuthContext from "./AuthContext";
import { msalConfig } from "./authConfig";

type LoginProps = {
  info?: LoginInfo;
};

type MsalLoginProps = {
  info: LoginInfo;
};

const MsalLogin = (props: MsalLoginProps) => {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string>("");
  const authContext = useContext(AuthContext);
  const { info } = props;

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
    fetch(info.jwtEndpoint, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msal_access_token: accessToken,
        bookUrl: info.startUrl,
      }),
    })
      .then((result) => result.json())
      .then((data) => {
        if (data.access_token) {
          authContext.setToken(data.access_token);
        } else {
          console.log(data);
        }
      })
      .catch(console.log);
  }, [accessToken, authContext, info, instance, accounts]);

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
  const [msalInstance, setMsalInstance] = useState<
    PublicClientApplication | undefined
  >(undefined);

  useEffect(() => {
    if (!info) {
      setMsalInstance(undefined);
      return;
    }

    let config = { ...msalConfig };
    config.auth.clientId = info.clientId;

    config.auth.redirectUri = window.location.origin + window.location.pathname;
    setMsalInstance(new PublicClientApplication(config));
  }, [info]);

  if (!info) {
    return <p>Loading login info. Please wait...</p>;
  }

  if (!msalInstance) {
    return <p>Waiting for Microsoft Authentication. Please wait...</p>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalLogin info={info} />
    </MsalProvider>
  );
};

export default Login;
