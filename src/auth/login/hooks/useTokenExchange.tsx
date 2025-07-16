import { useCallback, useContext } from "react";
import type { LoginInfo } from "../../models/LoginInfo";
import SessionContext from "../../contexts/SessionContext";

const useTokenExchange = ({ info }: { info: LoginInfo }) => {
  const sessionContext = useContext(SessionContext);
  const exchangeToken = useCallback(
    (accessToken: string) => {
      if (!sessionContext || !accessToken) return;
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
            sessionContext.setToken(data.access_token);
          } else {
            console.log(data);
          }
        })
        .catch(console.log);
    },
    [sessionContext, info]
  );

  return {
    exchangeToken,
  };
};

export default useTokenExchange;
