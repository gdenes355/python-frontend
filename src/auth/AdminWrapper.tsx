import React, { useContext, useEffect, useState } from "react";
import SessionContext from "./SessionContext";
import UnauthorisedError from "./UnauthorisedException";

type AdminWrapperProps = {
  children?: React.ReactNode;
};

const AdminWrapper = (props: AdminWrapperProps) => {
  const session = useContext(SessionContext);
  const [authorised, setAuthorised] = useState(false);

  useEffect(() => {
    let headers = new Headers();
    headers.append("Authorization", `Bearer ${session.token}`);
    fetch("http://localhost:5001/api/admin/token-test/", { headers }).then(
      (response) =>
        response
          .json()
          .then((data) => ({ code: response.status, data }))
          .then(({ code, data }) => {
            if (code === 200) {
              setAuthorised(true);
            } else if (code === 401) {
              session.login({
                clientId: data.clientId,
                jwtEndpoint: data.jwtEndpoint,
                startUrl: "admin",
                resultsEndpoint: data.resultsEndpoint,
                wsEndPoint: data.wsEndPoint,
                bookPath: "admin",
              });
            } else if (code === 403) {
              // you weren't an admin
              session.logout();
            }
          })
    );
  }, []);
  if (authorised) {
    return <React.Fragment>{props.children}</React.Fragment>;
  } else {
    return <p>Logging in...</p>;
  }
};

export default AdminWrapper;
