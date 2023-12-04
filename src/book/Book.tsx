import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Challenge from "../challenge/Challenge";
import ChallengeEditor from "../challenge/ChallengeEditor";
import BookCover from "./BookCover";
import BookDrawer from "./components/BookDrawer";
import BookReport from "./BookReport";
import BookFetcher from "./utils/BookFetcher";
import { Box } from "@mui/material";

import ZipPathTransformer from "./utils/ZipPathTransformer";
import { absolutisePath } from "../utils/pathTools";
import BookNodeModel, {
  findBookNode,
  nextBookNode,
  prevBookNode,
} from "../models/BookNodeModel";
import { TestCases } from "../models/Tests";

import ErrorBounday from "../components/ErrorBoundary";
import EditableBookStore, {
  createEditableBookStore,
} from "./utils/EditableBookStore";
import BookEditorDrawer from "./components/BookEditorDrawer";
import HeaderBar from "../components/HeaderBar";
import UnauthorisedError from "../auth/UnauthorisedException";
import SessionContext from "../auth/SessionContext";
import { ProgressStorage, useProgressStorage } from "./utils/ProgressStorage";
import GuideOnlyChallenge from "../challenge/GuideOnlyChallenge";

type BookProps = {
  zipFile?: File;
  localFolder?: FileSystemDirectoryHandle;
  onBookUploaded: (file: File, edit: boolean) => void;
};

type PathsState = {
  guidePath: string | null;
  pyPath: string | null;
};

type EditState = "cloning" | "editing" | "preview" | "localpreview" | undefined;

const Book = (props: BookProps) => {
  const authContext = useContext(SessionContext);
  const [rootNode, setRootNode] = useState<BookNodeModel | null>(null);
  const [paths, setPaths] = useState<PathsState>({
    guidePath: null,
    pyPath: null,
  });
  const [activeNode, setActiveNode] = useState<BookNodeModel | null>(null);
  const [tests, setTests] = useState<TestCases | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const [editState, setEditState] = useState<EditState>(undefined);
  const [editableBookStore, setEditableBookStore] =
    useState<EditableBookStore | null>(null);

  const [bookForceReload, setBookForceReload] = useState(0);
  const requestBookReload = () => setBookForceReload((c) => c + 1);

  const [error, setError] = useState<string | undefined>(undefined);

  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath =
    searchParams.get("bk") || searchParams.get("book") || "book.json";
  const zipPath = searchParams.get("zip-path");
  const zipPathTransformed = useMemo(
    () => ZipPathTransformer.transformZipPath(zipPath),
    [zipPath]
  );
  const zipData = searchParams.get("zip-data") || "";
  const bookChallengeId = searchParams.get("chid");
  const editParam = searchParams.get("edit") || "";
  const navigate = useNavigate();

  const progressStorage: ProgressStorage = useProgressStorage(bookPath);

  const openNode = useMemo(
    () => (node: BookNodeModel) => {
      if (editState === "cloning" || editParam === "clone") {
        return;
      }
      let newSearchParams = new URLSearchParams({
        bk: bookPath,
        chid: node.id,
        ...(zipPath && { "zip-path": zipPath }),
        ...(zipData && { "zip-data": zipData }),
        ...(editParam && { edit: editParam }),
      });
      if (!node.children || node.children.length === 0) {
        navigate(
          {
            search: "?" + newSearchParams.toString(),
          },
          { replace: false }
        );
      }
    },
    [bookPath, editParam, navigate, zipData, zipPath, editState]
  );

  const bookFetcher = useMemo(() => {
    if (
      (editParam === "editing" || editParam === "preview") &&
      !editableBookStore
    ) {
      let store = new EditableBookStore();
      setEditableBookStore(store);
      return store.fetcher;
    }
    if (editableBookStore) {
      return editableBookStore.fetcher;
    }
    return new BookFetcher(
      bookPath,
      zipPathTransformed,
      zipData || props.zipFile,
      props.localFolder
    );
  }, [
    bookPath,
    zipPathTransformed,
    zipData,
    props.zipFile,
    editableBookStore,
    editParam,
    props.localFolder,
  ]);

  /**
   * Managing edit state
   */
  const bookClonedForEditing = useMemo(
    () => (store: EditableBookStore) => {
      setEditableBookStore(store);
      setEditState("editing");
      navigate({
        search:
          "?" +
          new URLSearchParams({
            bk: "edit://edit/book.json",
            chid: activeNode?.id || "",
            edit: "editing",
          }),
      });
    },
    [activeNode, navigate]
  );
  useEffect(() => {
    if (
      editParam === "clone" &&
      !editState &&
      rootNode &&
      bookFetcher &&
      bookFetcher instanceof BookFetcher
    ) {
      setEditState("cloning");
      createEditableBookStore(rootNode, bookFetcher, authContext).then(
        bookClonedForEditing
      );
      return;
    }

    if (
      editParam === "editing" ||
      editParam === "preview" ||
      editParam === "localpreview"
    ) {
      setEditState(editParam);
    }
  }, [
    editParam,
    editState,
    rootNode,
    bookFetcher,
    bookClonedForEditing,
    authContext,
  ]);

  /**
   * Getting the book to open
   */
  useEffect(() => {
    if (!bookFetcher) {
      return;
    }
    if (authContext.requiresAuth && !authContext.isLoggedIn()) return;
    bookFetcher
      .fetchBook(authContext)
      .then((result) => {
        progressStorage.updateResults(result.allResults, result.allResults);
        progressStorage.fetchResults(result.book, result.allResults);
        setRootNode(result.book);
        if (result.singlePageBook) {
          openNode(result.singlePageBook);
        }
      })
      .catch((e) => {
        if (e instanceof UnauthorisedError) {
          authContext.login(e.getInfo());
        } else {
          setError(e.toString());
        }
      });
    // ignore missing authContext, as this should not change in a meaningful
    // manner (or at least its changes should not trigger a book refetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookFetcher, bookForceReload, openNode]);

  /**
   * Getting the challenge within the book
   */
  useEffect(() => {
    if (!rootNode) {
      return;
    }
    if (bookChallengeId) {
      let node = findBookNode(rootNode, bookChallengeId);
      setActiveNode(node);
      if (node && node.guide) {
        setPaths({
          guidePath: absolutisePath(
            node.guide,
            node.bookMainUrl || bookFetcher.getBookPathAbsolute()
          ),
          pyPath: node.py
            ? absolutisePath(
                node.py,
                node.bookMainUrl || bookFetcher.getBookPathAbsolute()
              )
            : null,
        });
        setTests(node.tests);
      }
    } else {
      setPaths({ guidePath: null, pyPath: null });
    }
  }, [rootNode, bookChallengeId, bookFetcher]);

  const openDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const openReport = (open: boolean) => {
    navigate(
      {
        search:
          "?" +
          new URLSearchParams({
            bk: bookPath,
            report: open ? "full" : "",
            chid: bookChallengeId || "",
            "zip-path": zipPath || "",
            "zip-data": zipData || "",
          }),
      },
      { replace: false }
    );
  };

  const requestNextChallenge = () => {
    if (rootNode && bookChallengeId) {
      openNode(
        nextBookNode(
          rootNode,
          bookChallengeId,
          (node) => node.guide !== undefined
        )
      );
    }
  };

  const requestPreviousChallenge = () => {
    if (rootNode && bookChallengeId) {
      openNode(
        prevBookNode(
          rootNode,
          bookChallengeId,
          (node) => node.guide !== undefined
        )
      );
    }
  };

  if (rootNode) {
    if (editState === "cloning" || editParam === "clone") {
      return <p>Cloning this book for editing... Please wait...</p>;
    } else if (searchParams.get("report") === "full") {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
            flexDirection: "column",
          }}
        >
          <HeaderBar title={rootNode.name} />
          <BookReport
            bookRoot={rootNode}
            allTestResults={progressStorage.allTestResults}
            onCloseReport={() => openReport(false)}
          />
        </Box>
      );
    } else if (activeNode && paths.guidePath) {
      if (
        !editState ||
        editState === "preview" ||
        editState === "localpreview"
      ) {
        if (paths.pyPath) {
          return (
            <React.Fragment>
              <ErrorBounday>
                <Challenge
                  fetcher={bookFetcher}
                  guidePath={paths.guidePath}
                  codePath={paths.pyPath}
                  tests={tests && tests.length > 0 ? tests : null}
                  bookNode={activeNode}
                  title={rootNode.name}
                  openBookDrawer={openDrawer}
                  onRequestPreviousChallenge={requestPreviousChallenge}
                  onRequestNextChallenge={requestNextChallenge}
                  uid={bookPath + bookChallengeId}
                  progressStorage={progressStorage}
                  isExample={activeNode.isExample}
                  isAssessment={activeNode.isAssessment}
                  typ={activeNode.typ}
                  onBookUploaded={props.onBookUploaded}
                  authContext={authContext}
                  canReloadBook={editState === "localpreview"}
                  onBookReloadRequested={() => requestBookReload()}
                />
                <BookDrawer
                  bookRoot={rootNode}
                  allTestResults={progressStorage.allTestResults}
                  activePageId={bookChallengeId || undefined}
                  onRequestOpen={openDrawer}
                  onNodeSelected={openNode}
                  open={drawerOpen}
                  onOpenReport={() => openReport(true)}
                />
              </ErrorBounday>
            </React.Fragment>
          );
        } else {
          return (
            <>
              <GuideOnlyChallenge
                guidePath={paths.guidePath}
                bookNode={activeNode}
                title={rootNode.name}
                onRequestNextChallenge={requestNextChallenge}
                onRequestPreviousChallenge={requestPreviousChallenge}
                openBookDrawer={openDrawer}
                fetcher={bookFetcher}
              />
              <BookDrawer
                bookRoot={rootNode}
                allTestResults={progressStorage.allTestResults}
                activePageId={bookChallengeId || undefined}
                onRequestOpen={openDrawer}
                onNodeSelected={openNode}
                open={drawerOpen}
                onOpenReport={() => openReport(true)}
              />
            </>
          );
        }
      } else if (!editableBookStore) {
        return <p>Something went wrong. Please refresh the page</p>;
      } else {
        return (
          <ErrorBounday>
            <ChallengeEditor
              bookStore={editableBookStore}
              fetcher={bookFetcher}
              guidePath={paths.guidePath}
              codePath={paths.pyPath!}
              tests={tests && tests.length > 0 ? tests : null}
              bookNode={activeNode}
              title={rootNode.name}
              openBookDrawer={openDrawer}
              onRequestPreviousChallenge={requestPreviousChallenge}
              onRequestNextChallenge={requestNextChallenge}
              uid={bookPath + bookChallengeId}
              progressStorage={progressStorage}
              isExample={activeNode.isExample}
              typ={activeNode.typ}
              onBookModified={requestBookReload}
              authContext={authContext}
            />
            <BookEditorDrawer
              bookRoot={rootNode}
              bookNode={activeNode}
              store={editableBookStore}
              activePageId={bookChallengeId || undefined}
              onRequestOpen={openDrawer}
              onNodeSelected={openNode}
              open={drawerOpen}
              onBookModified={() => {
                editableBookStore.store.saveBook();
                requestBookReload();
              }}
            />
          </ErrorBounday>
        );
      }
    } else {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
            flexDirection: "column",
          }}
        >
          <HeaderBar title={rootNode.name} />
          <BookCover
            bookRoot={rootNode}
            allTestResults={progressStorage.allTestResults}
            onNodeSelected={openNode}
          />
        </Box>
      );
    }
  } else {
    if (error) {
      return (
        <React.Fragment>
          <HeaderBar />
          <p>
            Failed to load book, please check the link. You can also look at the
            error message below
          </p>
          <p>{error}</p>
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <HeaderBar />
        <p>Loading book... </p>
      </React.Fragment>
    );
  }
};

export default Book;
