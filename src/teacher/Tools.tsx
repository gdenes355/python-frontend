import React, { useContext, useEffect, useState } from "react";
import TeacherContainer from "./TeacherContainer";

import { useOutletContext } from "react-router-dom";
import SessionContext from "../auth/SessionContext";
import { OutletContextType } from "../auth/AdminWrapper";
import { Button, Divider, Link, Paper, Tooltip } from "@mui/material";
import { Stack } from "@mui/system";
import DeleteDialog from "../components/dialogs/DeleteDialog";

const Tools = () => {
  const oc: OutletContextType = useOutletContext();

  const sessionContext = useContext(SessionContext);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [books, setBooks] = React.useState<string[] | undefined>(undefined);
  const [cache_size, setCacheSize] = React.useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    oc.request("api/admin/books").then((data) => setBooks(data));
    oc.request("api/admin/cache/name").then((data) => {
      setCacheSize(data?.["cache-size"]);
    });
  }, [oc]);

  const refreshLocalNameCache = () => {
    fetch(`${oc.urlBase}/api/admin/cache/name`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
    }).then((resp) => {
      if (resp.status === 200) {
        resp.json().then((r) => {
          setCacheSize(r?.["data"]?.["cache-size"]);
        });
      }
    });
  };

  const deleteNamesFromServer = () => {
    fetch(`${oc.urlBase}/api/admin/cache/name`, {
      method: "DELETE",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
    }).then((resp) => {
      if (resp.status === 200) {
        resp.json().then((r) => {
          setCacheSize(r?.["data"]?.["cache-size"]);
        });
      }
    });
  };

  return (
    <TeacherContainer>
      <div
        style={{ overflow: "auto", paddingLeft: "10px", paddingRight: "10px" }}
      >
        <Paper elevation={4} sx={{ padding: 1, marginTop: 2 }}>
          <h2 style={{ margin: 0 }}>Name resolution cache</h2>
          <p>
            Results are stored using user IDs. To resolve these, the server
            currently has{" "}
            {cache_size === undefined
              ? "an unknown number of"
              : cache_size.toString()}{" "}
            email to name mappings stored.{" "}
          </p>
          <Divider />
          <Stack spacing={2} direction={"row"} sx={{ marginTop: 1 }}>
            <Tooltip title="Are you missing the latest name from your dashboard? Click here to refetch the name cache. No risk.">
              <Button variant="contained" onClick={refreshLocalNameCache}>
                Refresh local cache
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete all names
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={4} sx={{ padding: 1, marginTop: 2 }}>
          <h2 style={{ margin: 0 }}>Available books</h2>
          <ul>
            {books?.map((book) => {
              const link = `${window.location.origin}?bk=${book}`;
              return (
                <li key={book}>
                  <Link href={link} target="_blank" rel="noreferrer">
                    {link}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Paper>
        <DeleteDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
          }}
          onDelete={() => {
            deleteNamesFromServer();
            setDeleteDialogOpen(false);
          }}
          title="Delete names from server"
          message={`Are you sure you want to delete all email->name mappings from the server? This operation is irreversible; you will need to wait for students to sign in to PythonSponge again to rebuild the cache.`}
        />
      </div>
    </TeacherContainer>
  );
};

export default Tools;
