import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import SessionContext from "./SessionContext";
import { Outlet } from "react-router-dom";

type AdminWrapperProps = {
  urlBase: string;
  children?: React.ReactNode;
};

type OutletContextType = {
  request: (req: string, withCache?: boolean) => Promise<any>;
  urlBase: string;
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

  const requestRef = useRef<Map<string, any>>(new Map());
  const request = useCallback(
    (req: string, withCache: boolean = true) =>
      new Promise<any>((res, rej) => {
        if (withCache) {
          let cached = requestRef.current.get(req);
          if (cached) {
            res(cached);
          }
        }
        let headers = new Headers();
        headers.append("Authorization", `Bearer ${sessionContext.token}`);
        fetch(`${props.urlBase}/${req}`, { headers })
          .then((resp: Response) => {
            if (resp.status !== 200) {
              throw new Error(
                `Failed to fetch ${req} with status ${resp.status}`
              );
            }
            return resp.json();
          })
          .then((data) => {
            if (withCache) requestRef.current.set(req, data.data);
            res(data.data);
          })
          .catch((e) => rej(`Failed to fetch ${req}`));
      }),
    [sessionContext.token, props.urlBase]
  );

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (authorised) {
    return (
      <React.Fragment>
        <Outlet context={{ request, urlBase: props.urlBase }} />
      </React.Fragment>
    );
  }

  return <p>Logging in...</p>;
};

export default AdminWrapper;
export { OutletContextType };
