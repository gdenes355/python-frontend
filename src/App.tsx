import "./App.css";
import SessionWrapper from "./auth/components/SessionWrapper";
import { VsThemeContextProvider } from "./themes/VsThemeContext";
import { CssBaseline } from "@mui/material";
import { NotificationsWrapper } from "./components/NotificationsContext";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import StartPage from "./StartPage";
import AuthCallbackPage from "./auth/AuthCallbackPage";
import AllClasses from "./teacher/AllClasses";
import Tools from "./teacher/Tools";
import ThisYear from "./teacher/ThisYear";
import BookEditorFrame from "./vscode-frame/BookEditorFrame";
import StudentDashboard from "./studentDashboard/StudentDashboard";
import HeaderBar from "./components/HeaderBar";
import BookUpload from "./book/components/BookUpload";
import { useEffect, useState, lazy, Suspense } from "react";
import Book from "./book/Book";
import FolderPicker from "./components/FolderPicker";

const AdminWrapper = lazy(() => import("./auth/AdminWrapper"));

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
      <>
        <HeaderBar />
        <BookUpload
          isForEditing={isTeacher?.length > 0}
          onBookUploaded={openBookFromZip}
        />
        <FolderPicker onFolderPicked={openLocalFolder} />
      </>
    );
  }
};

const envServerUrlOverride = import.meta.env.VITE_SERVER_URL;

function App() {
  const serverUrl = envServerUrlOverride
    ? envServerUrlOverride
    : window.location.origin;

  return (
    <VsThemeContextProvider>
      <CssBaseline>
        <NotificationsWrapper>
          <BrowserRouter>
            <Routes>
              <Route element={<SessionWrapper />}>
                <Route path="start" element={<StartPage />} />
                <Route path="auth-callback" element={<AuthCallbackPage />} />
                <Route
                  path="student/books"
                  element={<StudentDashboard baseUrl={serverUrl} />}
                />
                <Route
                  path="teacher"
                  element={
                    <Suspense fallback={<div>Loading teacher area...</div>}>
                      <AdminWrapper urlBase={serverUrl} />
                    </Suspense>
                  }
                >
                  <Route path="classes" element={<AllClasses />} />
                  <Route path="tools" element={<Tools />} />
                  <Route index path="*" element={<ThisYear />} />
                </Route>
                <Route path="book-editor-frame" element={<BookEditorFrame />} />
                <Route index path="*" element={<AppContainer />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationsWrapper>
      </CssBaseline>
    </VsThemeContextProvider>
  );
}

export default App;
