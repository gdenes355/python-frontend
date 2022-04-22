import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import Start from "./Start";
import Book from "./book/Book";
import BookUpload from "./book/BookUpload";
import Challenge from "./challenge/Challenge";

import pageTheme from "./themes/pageTheme";

import "./App.css";
import DefaultFetcher from "./utils/DefaultFetcher";

const AppContainer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("book");
  const challengePath = searchParams.get("ch");
  const editable = searchParams.get("edit");
  const [bookFile, setBookFile] = useState<File | null>(null);
  const navigate = useNavigate();

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
          showEditTools={editable ? true : false}
          layout="linear"
        />
      </React.Fragment>
    );
  } else {
    return (
      <BookUpload
        onBookUploaded={(file) => {
          setBookFile(file);
          navigate({ search: "?book=book.json" });
        }}
      />
    );
  }
};

export default function App() {
  return (
    <ThemeProvider theme={pageTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="start" element={<Start />} />
          <Route path="*" element={<AppContainer></AppContainer>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
