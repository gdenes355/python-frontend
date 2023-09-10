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
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import SessionContext from "./SessionContext";
import { msalConfig } from "./authConfig";

import "./Login.css";

type LoginProps = {
  info?: LoginInfo;
};

type MsalLoginProps = {
  info: LoginInfo;
};

const MsalLogin = (props: MsalLoginProps) => {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string>("");
  const authContext = useContext(SessionContext);
  const { info } = props;
  const [userHasInteracted, setUserHasInteracted] = useState<boolean>(
    info.resultsEndpoint.startsWith("https://perse.pythonsponge.com")
  );

  /// acquire access token from MS
  useEffect(() => {
    if (!userHasInteracted) return;
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
  }, [accounts, instance, userHasInteracted]);

  /// Manual interaction
  const onManualApproval = () => {
    setUserHasInteracted(true);
  };

  const onCancel = () => {
    sessionStorage.setItem("msal-login-query", "");
    instance.logoutRedirect().catch((e) => {
      console.log(e);
    });
  };

  /// Exchange MS access token for JWT token
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

  /// Manual start of the login flow
  const onLoginClick = () => {
    sessionStorage.setItem(
      "msal-login-query",
      window.location.pathname + window.location.search
    );
    instance.loginRedirect(loginRequest).catch((e) => {
      console.log(e);
    });
  };

  return (
    <div className="login-container">
      <Card
        variant="outlined"
        sx={{ maxWidth: 500, p: 3 }}
        className="login-card"
      >
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            PythonSponge login
          </Typography>
        </CardContent>

        <AuthenticatedTemplate>
          {userHasInteracted ? (
            accessToken ? (
              "Waiting for the session to begin. Please wait..."
            ) : (
              "Waiting for MSAL authentication token..."
            )
          ) : accounts.length > 0 ? (
            <React.Fragment>
              <CardContent>
                You are logging in as {accounts[0].name?.toString()} (
                {accounts[0].username}). PythonSponge will share your name and
                email address with the following server to save and track your
                progress: {info.resultsEndpoint}. Would you like to allow this?
              </CardContent>
              <CardActions className="login-card-actions">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => onCancel()}
                  sx={{ mr: 3 }}
                >
                  No
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => onManualApproval()}
                >
                  Yes
                </Button>
              </CardActions>
            </React.Fragment>
          ) : (
            "Waiting for authentication"
          )}
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <CardContent>
            This book is protected; you can access it once you have logged in
            with your Microsoft Account.
          </CardContent>
          <CardActions disableSpacing className="login-card-actions">
            <Button
              color="primary"
              variant="contained"
              onClick={() => onLoginClick()}
            >
              Sign in
            </Button>
          </CardActions>
        </UnauthenticatedTemplate>
      </Card>
    </div>
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
    config.auth.authority = `https://login.microsoftonline.com/${info.tenantId}/`;
    config.auth.redirectUri = window.location.origin + "/auth-callback";
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
