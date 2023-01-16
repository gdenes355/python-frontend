import React, { useContext, useEffect, useState } from "react";
import LoginInfo from "./LoginInfo";

import {
  useMsal,
  AuthenticatedTemplate,
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
    if (!accessToken || !authContext || !info) return;
    fetch(info.jwtEndpoint, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ msal_access_token: accessToken }),
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
    //authContext.setToken(accessToken);
  }, [accessToken, authContext, info]);

  const onLoginClick = () => {
    instance
      .loginPopup(loginRequest)
      .catch((e) => {
        console.log(e);
      })
      .then(console.log);
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

  return <MsalLogin info={info} />;
};

export default Login;
