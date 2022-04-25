import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Challenge from "../challenge/Challenge";
import ChallengeEditor from "../challenge/ChallengeEditor";
import BookCover from "./BookCover";
import BookDrawer from "./components/BookDrawer";
import BookReport from "./BookReport";
import BookFetcher from "./utils/BookFetcher";

import { saveTestState } from "./utils/ResultsStore";
import { absolutisePath } from "../utils/pathTools";
import BookNodeModel, {
  findBookNode,
  nextBookNode,
  prevBookNode,
} from "../models/BookNodeModel";
import { TestCases, AllTestResults } from "../models/Tests";

import ErrorBounday from "../components/ErrorBoundary";
import EditableBookStore, {
  createEditableBookStore,
} from "./utils/EditableBookStore";

type BookProps = {
  zipFile?: File;
};

type PathsState = {
  guidePath: string | null;
  pyPath: string | null;
};

type EditState = "cloning" | "editing" | "export" | undefined;

const Book = (props: BookProps) => {
  const [rootNode, setRootNode] = useState<BookNodeModel | null>(null);
  const [paths, setPaths] = useState<PathsState>({
    guidePath: null,
    pyPath: null,
  });
  const [activeNode, setActiveNode] = useState<BookNodeModel | null>(null);
  const [tests, setTests] = useState<TestCases | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [allTestResults, setAllTestResults] = useState<AllTestResults>({
    passed: new Set(),
    failed: new Set(),
  });
  const [editState, setEditState] = useState<EditState>(undefined);
  const [editableBookStore, setEditableBookStore] =
    useState<EditableBookStore | null>(null);

  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("book") || "book.json";
  const zipPath = searchParams.get("zip-path");
  const zipData = searchParams.get("zip-data") || "";
  const bookChallengeId = searchParams.get("chid");
  const editParam = searchParams.get("edit");

  const bookFetcher = useMemo(() => {
    if (editParam === "editing" && !editableBookStore) {
      let store = new EditableBookStore();
      setEditableBookStore(store);
      return store.fetcher;
    }
    if (editableBookStore) {
      return editableBookStore.fetcher;
    }
    return new BookFetcher(bookPath, zipPath, zipData || props.zipFile);
  }, [bookPath, zipPath, zipData, props.zipFile, editableBookStore, editParam]);
  const navigate = useNavigate();

  const activeTestsPassingChanged = (newTestState: boolean | null) => {
    if (!activeNode) {
      return;
    }
    if (newTestState === true) {
      allTestResults.passed.add(activeNode.id);
      allTestResults.failed.delete(activeNode.id);
    } else if (newTestState === false) {
      allTestResults.passed.delete(activeNode.id);
      allTestResults.failed.add(activeNode.id);
    }
    /*else {
            // unlikely that we want to delete an old test result this way
            allTestResults.passed.delete(bookChallengeId);
            allTestResults.failed.delete(bookChallengeId);            
        }*/
    setAllTestResults(allTestResults); // trigger update
    saveTestState(activeNode, newTestState); // persist
  };

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
            book: "edit://edit/book.json",
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
      createEditableBookStore(rootNode, bookFetcher).then(bookClonedForEditing);
      return;
    }

    if (editParam === "editing") {
      setEditState("editing");
    }
  }, [editParam, editState, rootNode, bookFetcher, bookClonedForEditing]);

  /**
   * Getting the book to open
   */
  useEffect(() => {
    if (!bookFetcher) {
      setAllTestResults({ passed: new Set(), failed: new Set() });
      return;
    }

    bookFetcher.fetchBook().then((result) => {
      setAllTestResults(result.allResults);
      setRootNode(result.book);
    });
  }, [bookFetcher]);

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

  const openNode = (node: BookNodeModel) => {
    let newSearchParams = new URLSearchParams({
      book: bookPath,
      chid: node.id,
      "zip-path": zipPath || "",
      "zip-data": zipData || "",
      edit: editParam || "",
    });
    if (!node.children || node.children.length === 0) {
      navigate(
        {
          search: "?" + newSearchParams.toString(),
        },
        { replace: false }
      );
    }
  };

  const openDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const openReport = (open: boolean) => {
    navigate(
      {
        search:
          "?" +
          new URLSearchParams({
            book: bookPath,
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
    if (searchParams.get("report") === "full") {
      return (
        <BookReport
          bookRoot={rootNode}
          allTestResults={allTestResults}
          onCloseReport={() => openReport(false)}
        />
      );
    } else if (activeNode && paths.guidePath && paths.pyPath) {
      if (!editState) {
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
                onTestsPassingChanged={activeTestsPassingChanged}
                isExample={activeNode.isExample}
                typ={activeNode.typ}
              />
              <BookDrawer
                bookRoot={rootNode}
                allTestResults={allTestResults}
                activePageId={bookChallengeId || undefined}
                onRequestOpen={openDrawer}
                onNodeSelected={openNode}
                open={drawerOpen}
                onOpenReport={() => openReport(true)}
              />
            </ErrorBounday>
          </React.Fragment>
        );
      } else if (editState === "cloning") {
        return <p>Cloning this book for editing... Please wait...</p>;
      } else if (!editableBookStore) {
        return <p>Something went wrong. Please refresh the page</p>;
      } else {
        return (
          <React.Fragment>
            <ErrorBounday>
              <ChallengeEditor
                bookStore={editableBookStore}
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
                onTestsPassingChanged={activeTestsPassingChanged}
                isExample={activeNode.isExample}
                typ={activeNode.typ}
                onBookNodeSaved={(n) => {
                  requestNextChallenge();
                  setTimeout(() => openNode(n), 500); // hack for now
                }}
              />
              <BookDrawer
                bookRoot={rootNode}
                allTestResults={allTestResults}
                activePageId={bookChallengeId || undefined}
                onRequestOpen={openDrawer}
                onNodeSelected={openNode}
                open={drawerOpen}
                onOpenReport={() => openReport(true)}
              />
            </ErrorBounday>
          </React.Fragment>
        );
      }
    } else {
      return (
        <React.Fragment>
          <BookCover
            bookRoot={rootNode}
            allTestResults={allTestResults}
            onNodeSelected={openNode}
          />
        </React.Fragment>
      );
    }
  } else {
    return <p>Loading book... </p>;
  }
};

export default Book;
