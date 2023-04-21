import React, { useContext, useEffect, useState } from "react";
import SessionContext from "./SessionContext";

type AdminWrapperProps = {
  urlBase: string;
  children?: React.ReactNode;
};

const AdminWrapper = (props: AdminWrapperProps) => {
  const sessionContext = useContext(SessionContext);
  const [authorised, setAuthorised] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authorised) return;
    let headers = new Headers();
    headers.append("Authorization", `Bearer ${sessionContext.token}`);
    fetch(`${props.urlBase}/api/admin/token-test/`, { headers })
      .then((response) => {
        if (response.status === 200) {
          setAuthorised(true);
        } else if (response.status === 401) {
          response.json().then((data) => {
            sessionContext.login({
              clientId: data.clientId,
              tenantId: data.tenantId || "common",
              jwtEndpoint: data.jwtEndpoint,
              startUrl: props.urlBase + "/admin",
              resultsEndpoint: data.resultsEndpoint,
              wsEndPoint: data.wsEndPoint,
              bookPath: props.urlBase + "/admin",
            });
          });
        } else if (response.status === 403) {
          // you weren't an admin
          sessionContext.logout();
        } else {
          setError(
            `Unexpected response code from admin server: ${response.status}`
          );
        }
      })
      .catch((e) => {
        setError(e.toString());
      });
  }, [sessionContext, authorised, props.urlBase]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (authorised) {
    return <React.Fragment>{props.children}</React.Fragment>;
  }

  return <p>Logging in...</p>;
};

export default AdminWrapper;
