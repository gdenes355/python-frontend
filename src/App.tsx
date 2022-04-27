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

const AppContainer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("book");
  const [bookFile, setBookFile] = useState<File | null>(null);
  const navigate = useNavigate();

  if (bookPath || bookFile) {
    return <Book zipFile={bookFile || undefined} />;
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
          <BrowserRouter>
            <Routes>
              <Route path="start" element={<Start />} />
              <Route path="*" element={<AppContainer></AppContainer>} />
            </Routes>
          </BrowserRouter>
        </CssBaseline>
      </ThemeProvider>
    </VsThemeContext.Provider>
  );
}
