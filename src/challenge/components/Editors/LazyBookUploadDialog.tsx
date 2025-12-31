import { Dialog, DialogTitle } from "@mui/material";
import { lazy, Suspense } from "react";
import BookNodeModel from "../../../models/BookNodeModel";
const BookUploadDialogContent = lazy(() => import("./BookUploadDialogContent"));

export const LazyBookUploadDialog = (props: {
  uploadData?: {
    book: BookNodeModel;
    zip: Blob;
  };
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Upload book to server</DialogTitle>
      <Suspense fallback={<div>Loading...</div>}>
        <BookUploadDialogContent
          uploadData={props.uploadData}
          onClose={props.onClose}
        />
      </Suspense>
    </Dialog>
  );
};
