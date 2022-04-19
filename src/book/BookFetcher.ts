import { isAbsoluteAddress, absolutisePath } from "../utils/pathTools";
import JSZip from "jszip";
import BookNodeModel from "../models/BookNodeModel";
import { AllTestResults } from "../models/Tests";
import { loadTestState } from "./ResultsStore";

type BookFetchResult = {
  book: BookNodeModel;
  allResults: AllTestResults;
};

class BookFetcher {
  constructor(bookPath: string, zipPath?: string | null) {
    this.zipPath = zipPath || undefined;
    this.bookPath = bookPath;
    if (isAbsoluteAddress(bookPath)) {
      this.bookPathAbsolute = this.bookPath;
    } else {
      // is this within a zip?
      if (this.zipPath) {
        this.bookPathAbsolute = new URL(bookPath, "pf-zip://").toString();
      } else {
        this.bookPathAbsolute = new URL(bookPath, document.baseURI).toString();
      }
    }

    if (this.zipPath) {
      this.fetchZip();
    }
  }

  public usesLocalZip() {
    return this.zipPath;
  }

  public getBookPathAbsolute() {
    return this.bookPathAbsolute;
  }

  public fetch(url: string) {
    return fetch(url);
  }

  public fetchBook(): Promise<BookFetchResult> {
    return new Promise<BookFetchResult>((r, e) => {
      let allRes: AllTestResults = { passed: new Set(), failed: new Set() };
      this.fetch(this.bookPath)
        .then((response) => response.json())
        .then((bookData) =>
          this.expandBookLinks(
            bookData,
            this.getBookPathAbsolute(),
            allRes,
            true
          )
        )
        .then((res) => r(res));
    });
  }

  private zipPath?: string;
  private bookPathAbsolute: string;
  private bookPath: string;

  async expandBookLinks(
    bookNode: BookNodeModel,
    mainUrl: string,
    allRes: AllTestResults,
    fileRoot: boolean
  ) {
    bookNode.bookMainUrl = mainUrl;
    if (fileRoot) {
      let localRes = loadTestState(bookNode);
      allRes.passed = new Set([...allRes.passed, ...localRes.passed]);
      allRes.failed = new Set([...allRes.failed, ...localRes.failed]);
    }
    if (bookNode.children) {
      for (const child of bookNode.children) {
        await this.expandBookLinks(child, mainUrl, allRes, false);
      }
    }
    if (bookNode.bookLink) {
      let path = absolutisePath(bookNode.bookLink, mainUrl);
      let response = await this.fetch(path);
      let bookData = await response.json();
      bookNode.children = bookData.children;
      await this.expandBookLinks(bookData, path, allRes, true);
    }
    return { book: bookNode, allResults: allRes };
  }

  private fetchZip() {
    if (!this.zipPath) {
      return;
    }
    fetch(this.zipPath)
      .then(function (response) {
        // 2) filter on 200 OK
        if (response.status === 200 || response.status === 0) {
          return Promise.resolve(response.blob());
        } else {
          return Promise.reject(new Error(response.statusText));
        }
      })
      .then(JSZip.loadAsync) // 3) chain with the zip promise
      .then(function (zip) {
        console.log("zip", zip);
        return zip;
      })
      .then((zip) => {
        return zip.file(this.bookPath)?.async("string");
      })
      .then(function success(text) {
        console.log(text);
        return JSON.parse(text as string);
      })
      .then((obj) => console.log(obj));
  }
}

export default BookFetcher;
