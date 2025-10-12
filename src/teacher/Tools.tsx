import { useContext, useState } from "react";
import TeacherContainer from "./TeacherContainer";

import { Button, Divider, Paper, Tooltip } from "@mui/material";
import { Stack } from "@mui/system";
import DeleteDialog from "../components/dialogs/DeleteDialog";
import NotificationsContext from "../components/NotificationsContext";

import BookTree from "./components/BookTree";
import { useNameCacheSize } from "./hooks/api/useNameCacheSize";
import { useNameCacheInvalidate } from "./hooks/api/useNameCacheInvalidate";
import { useNameCacheDelete } from "./hooks/api/useNameCacheDelete";

const Tools = () => {
  const notificationContext = useContext(NotificationsContext);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { data: cacheSize } = useNameCacheSize();
  const { mutate: invalidate } = useNameCacheInvalidate({
    onSuccess: () => {
      notificationContext.addMessage("Name cache refreshed", "success");
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });
  const { mutate: deleteNames } = useNameCacheDelete({
    onSuccess: () => {
      notificationContext.addMessage("Names deleted", "success");
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });

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
            {cacheSize === undefined
              ? "an unknown number of"
              : cacheSize.toString()}{" "}
            email to name mappings stored.{" "}
          </p>
          <Divider />
          <Stack spacing={2} direction={"row"} sx={{ marginTop: 1 }}>
            <Tooltip title="Are you missing the latest name from your dashboard? Click here to refetch the name cache. No risk.">
              <Button variant="contained" onClick={() => invalidate()}>
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

        <Paper elevation={4} sx={{ padding: 1, marginTop: 2, marginBottom: 2 }}>
          <h2 style={{ margin: 0 }}>Available books</h2>
          <BookTree />
        </Paper>
        <DeleteDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
          }}
          onDelete={() => {
            deleteNames();
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
