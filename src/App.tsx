import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import BookFragment from "./book/BookFragment";
import Challenge from "./challenge/Challenge";
import { ThemeProvider } from "@mui/material/styles";

import pageTheme from "./themes/pageTheme";

import "./App.css";

const AppContainer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("book");
  const challengePath = searchParams.get("ch");
  const editable = searchParams.get("edit");

  if (bookPath) {
    return <BookFragment />;
  } else if (challengePath) {
    return (
      <React.Fragment>
        <Challenge
          guidePath={challengePath + ".md"}
          codePath={challengePath + ".py"}
          showEditTools = {editable ? true : false }
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
            <b>New: </b> You can also specify a library of books:{" "}
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
          To show edit tools for a challenge you can include edit=true in the querystring of a book
          <a href="?book=.%2Fexamples%2Fbook.json&chid=afb57340-1197-473c-b24d-5687796fd3d4&edit=true">?book=.%2Fexamples%2Fbook.json&chid=afb57340-1197-473c-b24d-5687796fd3d4&edit=true</a>
        </p>        
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
