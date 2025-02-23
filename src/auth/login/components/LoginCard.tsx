import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import LoginInfo from "../../LoginInfo";

type LoginCardProps = {
  accountName?: string;
  accountUsername?: string;
  hasThirdPartyToken: boolean;
  isThirdPartyAuthenticated: boolean;
  info: LoginInfo;

  onCancelClick?: () => void;
  onLoginClick?: () => void;
  onManualApproval?: () => void;
};

const LoginCard = (props: LoginCardProps) => {
  const [userHasInteracted, setUserHasInteracted] = useState<boolean>(false);

  /// Manual interaction
  const onManualApproval = () => {
    setUserHasInteracted(true);
    props.onManualApproval?.();
  };

  const onCancel = () => {
    sessionStorage.setItem("auth-login-query", "");
    props.onCancelClick?.();
  };

  const onLoginClick = () => {
    sessionStorage.setItem(
      "auth-login-query",
      window.location.pathname + window.location.search
    );
    props.onLoginClick?.();
  };

  const authProviderFriendlyName =
    props.info.authProvider === "MSAL"
      ? "Microsoft Account"
      : props.info.authProvider === "GOOGLE"
      ? "Google Account"
      : "Account";

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
        {props.isThirdPartyAuthenticated ? (
          userHasInteracted ? (
            props.hasThirdPartyToken ? (
              "Waiting for the session to begin. Please wait..."
            ) : (
              "Waiting for authentication token..."
            )
          ) : (
            <React.Fragment>
              <CardContent>
                You are logging in{" "}
                {props?.accountName ? `as ${props.accountName}` : ""}{" "}
                {props.accountUsername ? `(${props.accountUsername})` : ""}.
                PythonSponge will share your name and email address with the
                following server to save and track your progress
                {props.info.resultsEndpoint
                  ? `: ${props.info.resultsEndpoint}`
                  : ""}
                . Would you like to allow this?
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
          )
        ) : (
          <>
            {" "}
            <CardContent>
              This book is protected; you can access it once you have logged in
              with your {authProviderFriendlyName}.
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
          </>
        )}
      </Card>
    </div>
  );
};

export default LoginCard;
