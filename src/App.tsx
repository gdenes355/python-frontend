import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Book from "./book/Book";
import BookUpload from "./book/BookUpload";
import Challenge from "./challenge/Challenge";
import { ThemeProvider } from "@mui/material/styles";

import pageTheme from "./themes/pageTheme";

import "./App.css";
import DefaultFetcher from "./utils/DefaultFetcher";

const AppContainer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("book");
  const challengePath = searchParams.get("ch");
  const [bookFile, setBookFile] = useState<File | null>(null);

  const defaultFetcher = new DefaultFetcher();

  if (bookPath || bookFile) {
    return <Book zipFile={bookFile || undefined} />;
  } else if (challengePath) {
    return (
      <React.Fragment>
        <Challenge
          fetcher={defaultFetcher}
          guidePath={challengePath + ".md"}
          codePath={challengePath + ".py"}
          layout="linear"
        />
      </React.Fragment>
    );
  } else {
    return (
      <div>
        <p>To get started,just specify the book path. E.g.</p>
        <ul>
          <li>
            Simple examples with test cases:{" "}
            <a href="?book=./examples/book.json">?book=./examples/book.json</a>
          </li>
          <li>
            Fun tasks:{" "}
            <a href="?book=./progsoc/book.json">?book=./progsoc/book.json</a>
          </li>
          <li>
            You can also specify a library of books:{" "}
            <a href="?book=./library.json">?book=./library.json</a>
          </li>
        </ul>
        <p>
          You can now also generate a progress report using{" "}
          <a href="?book=./library.json&report=full">
            ?book=./library.json&report=full
          </a>
        </p>
        <p>
          Alternatively, you can view an individual challenge using the md and
          py paths: (e.g. <a href="?ch=./progsoc/c01">?ch=./progsoc/c01</a>)
        </p>
        <p>
          <b>New: </b> drag and drop a zip file with a book inside it
        </p>
        <BookUpload onBookUploaded={setBookFile} />
      </div>
    );
  }
};

export default function App() {
  return (
    <ThemeProvider theme={pageTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<AppContainer></AppContainer>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
