import BookNodeModel, { getSinglePage } from "../../models/BookNodeModel";
import BookFetcher from "./BookFetcher";
import { v4 as uuidv4 } from "uuid";
import { absolutisePath } from "../../utils/pathTools";
import IBookFetcher, { IBookFetchResult } from "./IBookFetcher";
import { AllTestResults, emptyTestResults } from "../../models/Tests";
import { SessionContextType } from "../../auth/contexts/SessionContext";

function runTasksWithLimit(limit: number) {
  let active = 0;
  const q: Array<() => void> = [];

  const runNext = () => {
    active--;
    q.shift()?.();
  };

  return <T>(task: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        task()
          .then((v) => {
            resolve(v);
            runNext();
          })
          .catch((e) => {
            reject(e);
            runNext();
          });
      };
      active < limit ? run() : q.push(run);
    });
}

async function addNode(
  node: BookNodeModel,
  fetcher: BookFetcher,
  authContext: SessionContextType,
  cloneWithNewIds: boolean
) {
  node.id = cloneWithNewIds ? uuidv4() : node.id; // update UUID so this becomes a unique book
  if (node.guide) {
    let absPath = absolutisePath(
      node.guide,
      node.bookMainUrl || fetcher.getBookPathAbsolute()
    );
    let resp = await fetcher.fetch(absPath, authContext);
    if (resp.ok) {
      localStorage.setItem("edit://edit/" + node.guide, await resp.text());
    }
  }
  if (node.py) {
    let absPath = absolutisePath(
      node.py,
      node.bookMainUrl || fetcher.getBookPathAbsolute()
    );
    let resp = await fetcher.fetch(absPath, authContext);
    if (resp.ok) {
      localStorage.setItem("edit://edit/" + node.py, await resp.text());
    }
  }
  if (node.additionalFiles) {
    node.additionalFiles.forEach(async (file) => {
      let absPath = absolutisePath(
        file.filename,
        node.bookMainUrl || fetcher.getBookPathAbsolute()
      );
      let resp = await fetcher.fetch(absPath, authContext);
      if (resp.ok) {
        localStorage.setItem("edit://edit/" + file.filename, await resp.text());
      }
    });
  }

  if (node.tests) {
    node.tests.forEach(async (test) => {
      if (test.out instanceof Array) {
        test.out.forEach(async (out) => {
          // fetch files referenced in test cases but not if they are from file output tests
          if (out.filename && out.typ && out.typ[0] !== "f") {
            let absPath = absolutisePath(
              out.filename,
              node.bookMainUrl || fetcher.getBookPathAbsolute()
            );
            let resp = await fetcher.fetch(absPath, authContext);
            if (resp.ok) {
              localStorage.setItem(
                "edit://edit/" + out.filename,
                await resp.text()
              );
            }
          }
        });
      }
    });
    if (node.sol) {
      let absPath = node.sol.file
        ? absolutisePath(
            node.sol.file,
            node.bookMainUrl || fetcher.getBookPathAbsolute()
          )
        : undefined;
      if (absPath) {
        let resp = await fetcher.fetch(absPath, authContext);
        if (resp.ok) {
          localStorage.setItem(
            "edit://edit/" + node.sol.file,
            await resp.text()
          );
        }
      }
    }
  }

  const runLimited = runTasksWithLimit(6);

  if (node.children?.length) {
    await Promise.all(
      node.children.map((child) =>
        runLimited(() => addNode(child, fetcher, authContext, cloneWithNewIds))
      )
    );
  }
  node.bookMainUrl = "edit://edit/book.json";
  node.bookLink = undefined; // flatten books
}

async function createEditableBookStore(
  book: BookNodeModel,
  originalFetcher: BookFetcher,
  authContext: SessionContextType,
  cloneWithNewIds: boolean
) {
  await addNode(book, originalFetcher, authContext, cloneWithNewIds);
  localStorage.setItem("edit://edit/book.json", JSON.stringify(book));
  return new EditableBookStore(book);
}

interface IEditableBookStore {
  store: {
    save: (text: string, url: string) => void;
    saveBook: () => void;
  };
}

class EditableBookStore implements IEditableBookStore {
  constructor(book?: BookNodeModel) {
    if (!book) {
      let stored = localStorage.getItem("edit://edit/book.json");
      if (stored) {
        book = JSON.parse(stored) as BookNodeModel;
      }
    }

    if (!book) {
      throw Error("Cannot find the editable book instance.");
    }
    this.book = book;
  }

  public fetcher: IBookFetcher = {
    fetch: async function (url) {
      let stored = localStorage.getItem(
        absolutisePath(url, "edit://edit/book.json")
      );
      if (stored || stored === "") {
        return new Response(stored, { status: 200 });
      } else {
        return new Response(null, { status: 404 });
      }
    },
    getBookPathAbsolute: () => {
      return "edit://edit/book.json";
    },
    fetchBook: () => {
      let allResults: AllTestResults = emptyTestResults();
      this.book = JSON.parse(JSON.stringify(this.book));
      return new Promise<IBookFetchResult>((r) =>
        r({
          book: this.book,
          allResults,
          singlePageBook: getSinglePage(this.book),
        })
      );
    },
  };

  public store = {
    save: (text: string, url: string) =>
      localStorage.setItem(
        absolutisePath(url, this.fetcher.getBookPathAbsolute()),
        text
      ),
    saveBook: (newBook?: string) => {
      if (newBook) {
        this.book = JSON.parse(newBook) as BookNodeModel;
      }
      localStorage.setItem("edit://edit/book.json", JSON.stringify(this.book));
    },
  };

  public getBook = () => this.book;

  private book: BookNodeModel;
}

export default EditableBookStore;
export { createEditableBookStore, IEditableBookStore };
