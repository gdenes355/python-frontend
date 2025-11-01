import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import useBookHistory from "../../hooks/api/useBookHistory";
import { BookHistoryEntry } from "../../../models/BookHistory";
import DownloadIcon from "@mui/icons-material/Download";
import { useBookHistoryDownload } from "../../hooks/api/useBookHistoryDownload";
import BookUpload, {
  BookUploadType,
} from "../../../book/components/BookUpload";
import { useContext, useEffect, useState } from "react";
import JSZip from "jszip";
import { extractIds } from "../../../models/BookNodeModel";
import { useBookVersionUpload } from "../../hooks/api/useBookVersionUpload";
import NotificationsContext from "../../../components/NotificationsContext";

type BookHistoryDialogProps = {
  bookPath?: string;
  onClose: () => void;
};

const HistoryEntry = ({
  entry,
  bookPath,
}: {
  entry: BookHistoryEntry;
  bookPath?: string;
}) => {
  const { mutate: download, isPending: isFetchingDownload } =
    useBookHistoryDownload(entry.version, bookPath);
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      flexGrow={1}
      sx={{
        gap: "5px",
        width: "500px",
      }}
    >
      <div>
        {entry.version === "current"
          ? "Current version"
          : `Archived on ${entry.date}`}
      </div>
      <Tooltip title="Download as zip">
        <IconButton onClick={() => download()} disabled={isFetchingDownload}>
          <DownloadIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const getNodeIdsFromBookZip = async (file: File) => {
  const zip = await JSZip.loadAsync(file);
  const book = await zip.file("book.json")?.async("text");
  if (!book) return [];
  const bookData = JSON.parse(book);
  return Array.from(extractIds(bookData).keys());
};

const NewVersionComponent = ({
  bookPath,
  currentChallengeIds,
  onClose,
}: {
  bookPath?: string;
  currentChallengeIds: Set<string>;
  onClose: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [challengeIdsInNewVersion, setChallengeIdsInNewVersion] = useState<
    Set<string>
  >(new Set());
  const [isComputingNewVersionStats, setIsComputingNewVersionStats] =
    useState(false);
  const notificationsContext = useContext(NotificationsContext);

  const { mutate: upload, isPending: isUploading } = useBookVersionUpload(
    bookPath,
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

  const handleBookUploaded = (file: File, _: BookUploadType) => {
    setFile(file);
    setIsComputingNewVersionStats(true);
    getNodeIdsFromBookZip(file).then((nodeIds) => {
      setChallengeIdsInNewVersion(new Set(nodeIds));
      setIsComputingNewVersionStats(false);
    });
  };

  useEffect(() => {
    setFile(null);
    setChallengeIdsInNewVersion(new Set());
  }, [bookPath]);

  const handleUpload = () => {
    if (file) {
      upload(file);
    }
  };

  if (!file) {
    return <BookUpload onBookUploaded={handleBookUploaded} />;
  }
  if (isComputingNewVersionStats) {
    return <Typography variant="body1">Processing new file...</Typography>;
  }
  if (challengeIdsInNewVersion.size === 0) {
    return (
      <Typography variant="body1">No challenges in new version</Typography>
    );
  }

  const deletedChallengeIds = new Set(
    Array.from(currentChallengeIds).filter(
      (id) => !challengeIdsInNewVersion.has(id)
    )
  );
  const addedChallengeIds = new Set(
    Array.from(challengeIdsInNewVersion).filter(
      (id) => !currentChallengeIds.has(id)
    )
  );
  const overlappingChallengeIds = new Set(
    Array.from(currentChallengeIds).filter((id) =>
      challengeIdsInNewVersion.has(id)
    )
  );

  return (
    <>
      <Typography variant="body1">
        {challengeIdsInNewVersion.size} challenges in new version.{" "}
        {deletedChallengeIds.size} deleted, {addedChallengeIds.size} added,{" "}
        {overlappingChallengeIds.size} overlapping.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            setFile(null);
            setChallengeIdsInNewVersion(new Set());
            setIsComputingNewVersionStats(false);
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            handleUpload();
          }}
          disabled={isUploading}
        >
          Upload
        </Button>
      </Stack>
    </>
  );
};

const BookHistoryDialog = (props: BookHistoryDialogProps) => {
  const { bookPath, onClose } = props;
  const { data: bookHistory, isLoading, error } = useBookHistory(bookPath);

  return (
    <Dialog open={!!bookPath} onClose={onClose}>
      <DialogTitle>
        Version history {bookHistory?.name ? ` for ${bookHistory.name}` : ""}
      </DialogTitle>
      <DialogContent>
        <Typography variant="h6">History</Typography>

        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <Typography color="error">{error?.message}</Typography>
        ) : bookHistory?.history.length === 0 ? (
          <p>No history found</p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                overflowY: "auto",
              }}
            >
              {bookHistory?.history.map((entry) => (
                <HistoryEntry
                  entry={entry}
                  key={entry.version}
                  bookPath={bookPath}
                />
              ))}
            </div>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Upload new version</Typography>
            <NewVersionComponent
              bookPath={bookPath}
              currentChallengeIds={
                new Set(
                  bookHistory?.history
                    ?.filter((entry) => entry.version === "current")
                    ?.at(0)?.nodeIds || []
                )
              }
              onClose={onClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookHistoryDialog;
