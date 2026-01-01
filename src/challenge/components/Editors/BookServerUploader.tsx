import { forwardRef, useContext, useImperativeHandle, useState } from "react";
import BookNodeModel from "../../../models/BookNodeModel";
import IBookFetcher from "../../../book/utils/IBookFetcher";
import BookZipper from "../../../book/utils/BookZipper";
import SessionContext from "../../../auth/contexts/SessionContext";
import { LazyBookUploadDialog } from "./LazyBookUploadDialog";

type BookServerUploaderProps = {};
export type BookServerUploaderRef = {
  showDialog(bookFetcher: IBookFetcher): Promise<void>;
};

const BookServerUploader = forwardRef<
  BookServerUploaderRef,
  BookServerUploaderProps
>((_, ref) => {
  const authContext = useContext(SessionContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<
    | {
        book: BookNodeModel;
        zip: Blob;
      }
    | undefined
  >(undefined);

  const showDialog = async (bookFetcher: IBookFetcher) => {
    setDialogOpen(true);
    let book = await bookFetcher.fetchBook(authContext);
    const zipper = new BookZipper(bookFetcher);
    let zip = await zipper.zipBook(book.book, authContext);
    let blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });
    setDialogData({ book: book.book, zip: blob });
  };

  useImperativeHandle(ref, () => ({
    showDialog,
  }));

  if (!authContext.canUploadBook || !authContext.isEditingRemote) {
    return null;
  }

  return (
    <LazyBookUploadDialog
      uploadData={dialogData}
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
    />
  );
});

export default BookServerUploader;
