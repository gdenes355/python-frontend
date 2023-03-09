import BookNodeModel, { getSinglePage } from "../../models/BookNodeModel";
import BookFetcher from "./BookFetcher";
import { v4 as uuidv4 } from "uuid";
import { absolutisePath } from "../../utils/pathTools";
import IBookFetcher, { IBookFetchResult } from "./IBookFetcher";
import { AllTestResults } from "../../models/Tests";
import { SessionContextType } from "../../auth/SessionContext";

async function addNode(
  node: BookNodeModel,
  fetcher: BookFetcher,
  authContext: SessionContextType
) {
  node.id = uuidv4(); // update UUID so this becomes a unique book
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
  if (node.children) {
    for (let child of node.children) {
      await addNode(child, fetcher, authContext);
    }
  }
  node.bookMainUrl = "edit://edit/book.json";
  node.bookLink = undefined; // flatten books
}

async function createEditableBookStore(
  book: BookNodeModel,
  originalFetcher: BookFetcher,
  authContext: SessionContextType
) {
  await addNode(book, originalFetcher, authContext);
  localStorage.setItem("edit://edit/book.json", JSON.stringify(book));
  return new EditableBookStore(book);
}

class EditableBookStore {
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
      let allResults: AllTestResults = { passed: new Set(), failed: new Set() };
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
    saveBook: () =>
      localStorage.setItem("edit://edit/book.json", JSON.stringify(this.book)),
  };

  private book: BookNodeModel;
}

export default EditableBookStore;
export { createEditableBookStore };
