import { Box, Button, DialogContent, Stack } from "@mui/material";
import BookNodeModel, { extractIds } from "../../../models/BookNodeModel";
import useBookHistory from "../../../teacher/hooks/api/useBookHistory";
import { useContext, useMemo } from "react";
import { useBookVersionUpload } from "../../../teacher/hooks/api/useBookVersionUpload";
import NotificationsContext from "../../../components/NotificationsContext";
import { Route, Routes } from "react-router-dom";
import AdminWrapper from "../../../auth/AdminWrapper";

const BookUploadDialogContent = ({
  uploadData,
  onClose,
}: {
  uploadData?: {
    book: BookNodeModel;
    zip: Blob;
  };
  onClose: () => void;
}) => {
  const notificationsContext = useContext(NotificationsContext);
  const remotePath = localStorage.getItem("@editor-original-book");
  if (!remotePath) return <div>No remote path found</div>;
  if (!uploadData) return <div>Waiting for the book to be compiled...</div>;
  const {
    data: bookHistory,
    isLoading: isLoadingBookHistory,
    error: errorBookHistory,
  } = useBookHistory(remotePath);
  const { mutate: upload, isPending: isUploading } = useBookVersionUpload(
    remotePath,
    {
      onSuccess: () => {
        notificationsContext.addMessage("Version uploaded", "success");
        onClose();
      },
      onError: (error) => {
        notificationsContext.addMessage(error.message, "error");
      },
    }
  );

  const currentVersionIds = useMemo(() => {
    return new Set(
      bookHistory?.history.filter((entry) => entry.version === "current")?.at(0)
        ?.nodeIds || []
    );
  }, [bookHistory]);
  const newVersionIds = useMemo(() => {
    return new Set(Array.from(extractIds(uploadData?.book || {}).keys()));
  }, [uploadData?.book]);
  const deletedChallengeIds = useMemo(
    () =>
      new Set(
        Array.from(currentVersionIds).filter((id) => !newVersionIds.has(id))
      ),
    [currentVersionIds, newVersionIds]
  );
  const addedChallengeIds = useMemo(
    () =>
      new Set(
        Array.from(newVersionIds).filter((id) => !currentVersionIds.has(id))
      ),
    [currentVersionIds, newVersionIds]
  );
  const overlappingChallengeIds = useMemo(
    () =>
      new Set(
        Array.from(currentVersionIds).filter((id) => newVersionIds.has(id))
      ),
    [currentVersionIds, newVersionIds]
  );
  return (
    <DialogContent>
      <Stack sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div>Book name: {uploadData?.book?.name}</div>
        <div>Remote path: {remotePath}</div>

        <Box>
          {isLoadingBookHistory ? (
            <div>Loading book history...</div>
          ) : errorBookHistory ? (
            <div>Error loading book history: {errorBookHistory.message}</div>
          ) : bookHistory ? (
            <>
              <div>
                Existing book found: {currentVersionIds.size} challenges
              </div>
              <div>Deleted challenges: {deletedChallengeIds.size}</div>
              <div>Added challenges: {addedChallengeIds.size}</div>
              <div>Overlapping challenges: {overlappingChallengeIds.size}</div>
            </>
          ) : (
            <div>No book history found</div>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            console.log("Uploading book");
            upload(
              new File([uploadData?.zip], "book.zip", {
                type: "application/zip",
              })
            );
          }}
          disabled={
            isUploading ||
            !!errorBookHistory ||
            !bookHistory ||
            isLoadingBookHistory ||
            false
          }
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </Stack>
    </DialogContent>
  );
};

export default function WrappedComponent({
  uploadData,
  onClose,
}: {
  uploadData?: {
    book: BookNodeModel;
    zip: Blob;
  };
  onClose: () => void;
}) {
  return (
    <Routes>
      <Route element={<AdminWrapper urlBase={window.location.origin} />}>
        <Route
          path="*"
          element={
            <BookUploadDialogContent
              uploadData={uploadData}
              onClose={onClose}
            />
          }
        />
      </Route>
    </Routes>
  );
}
