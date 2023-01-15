import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

import Start from "./Start";
import Book from "./book/Book";
import BookUpload from "./book/components/BookUpload";
import pageTheme, { darkTheme } from "./themes/pageTheme";
import VsThemeContext from "./themes/VsThemeContext";

import Cookies from "js-cookie";

import "./App.css";
import HeaderBar from "./components/HeaderBar";

import AuthWrapper from "./auth/AuthWrapper";

const AppContainer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("book");
  const isTeacher = searchParams.get("teacher") || "";
  const [bookFile, setBookFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const openBookFromZip = (file: File, edit: boolean) => {
    setBookFile(file);
    navigate({ search: `?boo=book.json${edit ? "&edit=clone" : ""}` });
  };

  useEffect(() => {
    navigator.serviceWorker.register("pysw.js").then(function (reg) {
      if (navigator.serviceWorker.controller === null || !reg.active) {
        window.location.reload();
      }
    });
  }, []);

  if (bookPath || bookFile) {
    return (
      <Book zipFile={bookFile || undefined} onBookUploaded={openBookFromZip} />
    );
  } else {
    return (
      <React.Fragment>
        <HeaderBar />
        <BookUpload
          isForEditing={isTeacher?.length > 0}
          onBookUploaded={openBookFromZip}
        />
      </React.Fragment>
    );
  }
};

export default function App() {
  const [vsTheme, setVsTheme] = useState("vs-light");

  useEffect(() => {
    let previousTheme = Cookies.get("theme");
    if (previousTheme) {
      setVsTheme(previousTheme);
    }
  }, []);

  const handleThemeChange = (theme: string) => {
    setVsTheme(theme);
    Cookies.set("theme", theme);
  };

  return (
    <VsThemeContext.Provider
      value={{ theme: vsTheme, handleThemeChange: handleThemeChange }}
    >
      <ThemeProvider theme={vsTheme === "vs-dark" ? darkTheme : pageTheme}>
        <CssBaseline>
          <AuthWrapper>
            <BrowserRouter>
              <Routes>
                <Route path="start" element={<Start />} />
                <Route path="*" element={<AppContainer></AppContainer>} />
              </Routes>
            </BrowserRouter>
          </AuthWrapper>
        </CssBaseline>
      </ThemeProvider>
    </VsThemeContext.Provider>
  );
}
