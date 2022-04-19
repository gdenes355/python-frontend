import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Challenge from "../challenge/Challenge";
import BookCover from "./BookCover";
import BookDrawer from "./BookDrawer";
import BookReport from "./BookReport";
import BookFetcher from "./BookFetcher";

import { saveTestState } from "./ResultsStore";
import { absolutisePath } from "../utils/pathTools";
import BookNodeModel, {
  findBookNode,
  nextBookNode,
  prevBookNode,
} from "../models/BookNodeModel";
import { TestCases, AllTestResults } from "../models/Tests";

type PathsState = {
  guidePath: string | null;
  pyPath: string | null;
};

export default function Book() {
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

  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get("book") || "";
  const zipPath = searchParams.get("zip-path");
  const bookChallengeId = searchParams.get("chid");

  const bookFetcher = useMemo(() => {
    return new BookFetcher(bookPath, zipPath);
  }, [bookPath, zipPath]);
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
    if (!node.children || node.children.length === 0) {
      navigate(
        {
          search:
            "?" +
            new URLSearchParams({ book: bookPath, chid: node.id }).toString(),
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
      return (
        <React.Fragment>
          <Challenge
            guidePath={paths.guidePath}
            codePath={paths.pyPath}
            tests={tests && tests.length > 0 ? tests : null}
            bookNode={activeNode}
            title={rootNode.name}
            openBookDrawer={openDrawer}
            onRequestPreviousChallenge={requestPreviousChallenge}
            onRequestNextChallenge={requestNextChallenge}
            layout="fullscreen"
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
        </React.Fragment>
      );
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
}
