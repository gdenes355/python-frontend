import { useMemo } from "react";

import type { LoginInfo } from "../models/LoginInfo";
import LoginCard from "./components/LoginCard";
import useTokenExchange from "./hooks/useTokenExchange";
import { v4 as uuid } from "uuid";
import { jwtDecode } from "jwt-decode";
import { useNeedsManualApproval } from "./hooks/useNeedsManualApproval";

const LoginGoogle = ({ info }: { info: LoginInfo }) => {
  const idToken = sessionStorage.getItem("google-auth-id-token");
  const googleIdentity = useMemo(() => {
    if (!idToken) return undefined;
    const decoded = jwtDecode(idToken);
    if (decoded.aud !== info.clientId) {
      // stale credentials
      window.sessionStorage.removeItem("google-auth-id-token");
      return undefined;
    }
    // Google jwt comes with name and email
    return {
      // @ts-ignore
      name: decoded.name,
      // @ts-ignore
      email: decoded.email,
    };
  }, [idToken, info]);

  const { needsManualApproval, onApprovalReceived } =
    useNeedsManualApproval(info);

  const tokenExchange = useTokenExchange({ info });

  if (!needsManualApproval && googleIdentity && idToken) {
    tokenExchange.exchangeToken(idToken);
  }

  return (
    <LoginCard
      isThirdPartyAuthenticated={!!idToken && !!googleIdentity}
      hasThirdPartyToken={!!idToken && !!googleIdentity}
      info={info}
      accountName={googleIdentity?.name}
      accountUsername={googleIdentity?.email}
      onCancelClick={() => {
        window.sessionStorage.removeItem("google-auth-id-token");
        window.location.reload();
      }}
      onLoginClick={() => {
        const redirectUri = window.location.origin + "/auth-callback";
        const clientId = info.clientId;
        const nonce = uuid();
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=email%20profile&nonce=${nonce}`;
      }}
      onManualApproval={() => {
        onApprovalReceived();
      }}
    />
  );
};

export default LoginGoogle;
