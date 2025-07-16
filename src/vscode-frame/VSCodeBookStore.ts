import IBookFetcher, { IBookFetchResult } from "../book/utils/IBookFetcher";
import { absolutisePath } from "../utils/pathTools";
import { AllTestResults, emptyTestResults } from "../models/Tests";
import BookNodeModel, { getSinglePage } from "../models/BookNodeModel";
import { IEditableBookStore } from "../book/utils/EditableBookStore";

class VSCodeBookStore implements IEditableBookStore {
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
      if (this.book && !this.error) {
        let book = this.book;
        return new Promise<IBookFetchResult>((r) =>
          r({
            book,
            allResults,
            singlePageBook: getSinglePage(book),
          })
        );
      }

      return new Promise<IBookFetchResult>((_, e) => {
        e(this.error);
      });
    },
  };

  public store = {
    save: (text: string, url: string) => {
      window.parent.postMessage(
        {
          type: "create-file",
          url: url.replace("edit://edit/", ""),
          text: text,
        },
        "*"
      );
    },

    /*localStorage.setItem(
        absolutisePath(url, this.fetcher.getBookPathAbsolute()),
        text
      ),*/
    saveBook: () => {
      // ignore, as this call is always followed by a reload request
    },
  };

  public updateBookWithText(text: string) {
    this.bookStr = text;
    try {
      this.book = JSON.parse(this.bookStr) as BookNodeModel;
      this.error = "";
    } catch (ex: any) {
      this.error = ex.message;
    }
  }

  private bookStr: string | undefined;
  private book: BookNodeModel | undefined;
  private error: string = "";
}

export default VSCodeBookStore;
