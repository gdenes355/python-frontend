import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import BookEditorDrawer from "../book/components/BookEditorDrawer";
import VSCodeBookStore from "./VSCodeBookStore";
import BookNodeModel from "../models/BookNodeModel";
import useCodeRunner from "../coderunner/useCodeRunner";
import { EditorTestResults } from "../book/components/BookEditorContents";

const BookEditorFrame = () => {
  const [bookRoot, setBookRoot] = useState<BookNodeModel | undefined>(
    undefined
  );
  const [bookNode, setBookNode] = useState<BookNodeModel | undefined>(
    undefined
  );

  const [testResults, setTestResults] = useState<EditorTestResults>({
    passed: new Set(),
    failed: new Set(),
  });

  const [error, setError] = useState("");

  const bookStore = useMemo(() => {
    return new VSCodeBookStore();
  }, []);

  const fileReadPromiseRej = useRef<((reason?: any) => void) | undefined>(
    undefined
  );
  const fileReadPromiseRes = useRef<((value: string) => void) | undefined>(
    undefined
  );

  const codeRunner = useCodeRunner({});

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data.type === "update") {
        bookStore.updateBookWithText(event.data.text);
        if (event.data.text) {
          bookStore.fetcher
            .fetchBook()
            .then((result) => {
              setBookRoot(result.book);
              setBookNode(result.book);
              setError("");
            })
            .catch((err) => {
              setError(err || "Unknown error");
            });
        }
      } else if (event.data.type === "file-read") {
        let res = fileReadPromiseRes.current;
        fileReadPromiseRej.current = undefined;
        fileReadPromiseRes.current = undefined;
        res?.(event.data.text);
      }
    },
    [bookStore]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "ready" }, "*");
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  if (error) {
    return <p>Error: {error}</p>;
  }
  if (bookRoot === undefined) {
    return <p>Loading book</p>;
  }

  const readFile = (url: string) => {
    if (fileReadPromiseRej) {
      fileReadPromiseRej.current?.();
    }
    let res = new Promise<string>((resolve, reject) => {
      fileReadPromiseRej.current = reject;
      fileReadPromiseRes.current = resolve;
      window.parent.postMessage({ type: "read", url }, "*");
    });
    return res;
  };

  const onRunTest = async (node: BookNodeModel) => {
    let tests = node.tests || [];
    let additionalFiles = node.additionalFiles || [];
    let sol = node.sol?.file;
    if (sol) {
      try {
        let code = await readFile?.(sol);
        if (code) {
          let resData = await codeRunner.test(
            code,
            tests,
            additionalFiles,
            {},
            node
          );
          if (resData) {
            let pass = resData.results.every((r) => r.outcome === true);
            if (pass) {
              testResults.passed.add(node.id);
              testResults.failed.delete(node.id);
            } else {
              testResults.failed.add(node.id);
              testResults.passed.delete(node.id);
            }
            setTestResults({
              passed: testResults.passed,
              failed: testResults.failed,
            });
          }
        }
      } catch (e) {
        console.log("ERROR when getting solution", e);
      }
    }
    for (let child of node.children || []) {
      await onRunTest(child);
    }
  };

  const onRunTests = async () => {
    await onRunTest(bookRoot);
  };

  return (
    <BookEditorDrawer
      open={true}
      bookRoot={bookRoot}
      bookNode={bookNode || bookRoot}
      store={bookStore}
      onBookModified={() => {
        window.parent.postMessage({ type: "modified", data: bookRoot }, "*");
      }}
      onRequestOpen={() => {}}
      onNodeSelected={(node) => {
        window.parent.postMessage({ type: "open", node: node }, "*");
        setBookNode(node);
      }}
      testResults={testResults}
      codeRunner={codeRunner}
      onRunTests={onRunTests}
    />
  );
};

export default BookEditorFrame;
