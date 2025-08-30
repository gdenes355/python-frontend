import { useMsal, MsalProvider, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { loginRequest } from "../models/authConfig";
import { msalConfig } from "../models/authConfig";
import type { LoginInfo } from "../models/LoginInfo";
import { useEffect, useState } from "react";
import LoginCard from "./components/LoginCard";
import useTokenExchange from "./hooks/useTokenExchange";
import { useNeedsManualApproval } from "./hooks/useNeedsManualApproval";

const MsalLoginInternal = ({ info }: { info: LoginInfo }) => {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string>("");
  const isAuthenticated = useIsAuthenticated();

  const { needsManualApproval, onApprovalReceived } =
    useNeedsManualApproval(info);

  const tokenExchange = useTokenExchange({ info });

  /// silently acquire access token from MS
  useEffect(() => {
    if (needsManualApproval) return;
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
  }, [accounts, instance, needsManualApproval]);

  /// Exchange MS access token for JWT token
  useEffect(() => {
    tokenExchange.exchangeToken(accessToken);
  }, [tokenExchange, accessToken, instance, accounts]);

  return (
    <LoginCard
      isThirdPartyAuthenticated={isAuthenticated}
      hasThirdPartyToken={!!accessToken}
      info={info}
      accountName={
        accounts.length > 0 ? accounts[0].name?.toString() : undefined
      }
      accountUsername={accounts.length > 0 ? accounts[0].username : undefined}
      onCancelClick={() => {
        instance.logoutRedirect().catch((e) => {
          console.log(e);
        });
      }}
      onLoginClick={() => {
        instance.loginRedirect(loginRequest).catch((e) => {
          console.log(e);
        });
      }}
      onManualApproval={() => {
        onApprovalReceived();
      }}
    />
  );
};

const LoginMsal = ({ info }: { info: LoginInfo }) => {
  const [msalInstance, setMsalInstance] = useState<
    PublicClientApplication | undefined
  >(undefined);

  useEffect(() => {
    if (!info) {
      setMsalInstance(undefined);
      return;
    }

    const config = { ...msalConfig };
    config.auth.clientId = info.clientId;
    config.auth.authority = `https://login.microsoftonline.com/${info.tenantId}/`;
    config.auth.redirectUri = window.location.origin + "/auth-callback";
    setMsalInstance(new PublicClientApplication(config));
  }, [info]);

  if (!msalInstance) {
    return <p>Waiting for Microsoft Authentication. Please wait...</p>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalLoginInternal info={info} />
    </MsalProvider>
  );
};

export default LoginMsal;
