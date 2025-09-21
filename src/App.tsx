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

import SessionWrapper from "./auth/SessionWrapper";
import AuthCallbackPage from "./auth/AuthCallbackPage";
import FolderPicker from "./components/FolderPicker";
import AdminWrapper from "./auth/AdminWrapper";
import BookEditorFrame from "./vscode-frame/BookEditorFrame";
import StudentDashboard from "./studentDashboard/StudentDashboard";
import ThisYear from "./teacher/ThisYear";
import AllClasses from "./teacher/AllClasses";
import Tools from "./teacher/Tools";
import { NotificationsWrapper } from "./components/NotificationsContext";

const AppContainer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("bk") || searchParams.get("book");
  const isTeacher = searchParams.get("teacher") || "";
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [localFolder, setLocalFolder] = useState<
    FileSystemDirectoryHandle | undefined
  >();
  const navigate = useNavigate();

  const openBookFromZip = (file: File, edit: boolean) => {
    setBookFile(file);
    navigate({
      pathname: "/",
      search: `?bk=book.json${edit ? "&edit=clone" : ""}`,
    });
  };

  const openLocalFolder = (folder: FileSystemDirectoryHandle) => {
    setLocalFolder(folder);
    navigate({ pathname: "/", search: "?bk=book.json&edit=localpreview" });
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
      <Book
        zipFile={bookFile || undefined}
        localFolder={localFolder}
        onBookUploaded={openBookFromZip}
      />
    );
  } else {
    return (
      <React.Fragment>
        <HeaderBar />
        <BookUpload
          isForEditing={isTeacher?.length > 0}
          onBookUploaded={openBookFromZip}
        />
        <FolderPicker onFolderPicked={openLocalFolder} />
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

  const serverUrl = window.location.origin; //  "http://localhost:5001"; //

  return (
    <VsThemeContext.Provider
      value={{ theme: vsTheme, handleThemeChange: handleThemeChange }}
    >
      <ThemeProvider theme={vsTheme === "vs-dark" ? darkTheme : pageTheme}>
        <CssBaseline>
          <NotificationsWrapper>
            <BrowserRouter>
              <Routes>
                <Route element={<SessionWrapper />}>
                  <Route path="start" element={<Start />} />
                  <Route path="auth-callback" element={<AuthCallbackPage />} />
                  <Route
                    path="student/books"
                    element={<StudentDashboard baseUrl={serverUrl} />}
                  />
                  <Route
                    path="teacher"
                    element={<AdminWrapper urlBase={serverUrl} />}
                  >
                    <Route path="classes" element={<AllClasses />} />
                    <Route path="tools" element={<Tools />} />
                    <Route index path="*" element={<ThisYear />} />
                  </Route>
                  <Route
                    path="book-editor-frame"
                    element={<BookEditorFrame />}
                  />
                  <Route index path="*" element={<AppContainer />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationsWrapper>
        </CssBaseline>
      </ThemeProvider>
    </VsThemeContext.Provider>
  );
}
