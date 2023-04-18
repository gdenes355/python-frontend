import React, { useCallback, useEffect, useMemo, useState } from "react";
import BookEditorDrawer from "../book/components/BookEditorDrawer";
import VSCodeBookStore from "./VSCodeBookStore";
import BookNodeModel from "../models/BookNodeModel";

const BookEditorFrame = () => {
  const [bookRoot, setBookRoot] = useState<BookNodeModel | undefined>(
    undefined
  );
  const [bookNode, setBookNode] = useState<BookNodeModel | undefined>(
    undefined
  );

  const [error, setError] = useState("");

  const bookStore = useMemo(() => {
    return new VSCodeBookStore();
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data.type === "update") {
        bookStore.updateBookWithText(event.data.text);
        if (event.data.text) {
          bookStore.fetcher
            .fetchBook()
            .then((result) => {
              setBookRoot(result.book);
              setBookNode(result.book);
              setError("");
            })
            .catch((err) => {
              setError(err || "Unknown error");
            });
        }
      }
    },
    [bookStore]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "ready" }, "*");
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  if (error) {
    return <p>Error: {error}</p>;
  }
  if (bookRoot === undefined) {
    return <p>Loading book</p>;
  }

  return (
    <BookEditorDrawer
      open={true}
      bookRoot={bookRoot}
      bookNode={bookRoot}
      store={bookStore}
      onBookModified={() => {
        window.parent.postMessage({ type: "modified", data: bookNode }, "*");
      }}
      onRequestOpen={() => {}}
      onNodeSelected={(node) => {
        window.parent.postMessage({ type: "open", node: node }, "*");
      }}
    />
  );
};

export default BookEditorFrame;
