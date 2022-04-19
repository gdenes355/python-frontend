import { isAbsoluteAddress, absolutisePath } from "../utils/pathTools";
import JSZip from "jszip";
import BookNodeModel from "../models/BookNodeModel";
import { AllTestResults } from "../models/Tests";
import { loadTestState } from "./ResultsStore";
import IFetcher from "../utils/IFetcher";

type BookFetchResult = {
  book: BookNodeModel;
  allResults: AllTestResults;
};

class BookFetcher implements IFetcher {
  constructor(bookPath: string, zipPath?: string | null) {
    this.zipPath = zipPath || undefined;
    this.bookPath = bookPath;
    if (isAbsoluteAddress(bookPath)) {
      this.bookPathAbsolute = this.bookPath;
    } else {
      // is this within a zip?
      if (this.zipPath) {
        this.bookPathAbsolute = new URL(bookPath, "pfzip://in.zip/").toString();
      } else {
        this.bookPathAbsolute = new URL(bookPath, document.baseURI).toString();
      }
    }
  }

  public usesLocalZip() {
    return this.zipPath || this.zip;
  }

  public getBookPathAbsolute() {
    return this.bookPathAbsolute;
  }

  public async fetch(url: string) {
    console.log(this.usesLocalZip());
    if (this.usesLocalZip()) {
      if (!this.zip) {
        await this.fetchZip();
      }
      let blob = await this.zip
        ?.file(url.replace("pfzip://in.zip/", ""))
        ?.async("blob");
      return new Response(blob, { status: 200 });
    } else {
      return await fetch(url);
    }
  }

  public fetchBook(): Promise<BookFetchResult> {
    return new Promise<BookFetchResult>((r, e) => {
      let allRes: AllTestResults = { passed: new Set(), failed: new Set() };
      this.fetch(this.bookPathAbsolute)
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
  private zip: JSZip | null = null;

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

  private async fetchZip() {
    if (!this.zipPath || this.zip) {
      return;
    }

    let response = await fetch(this.zipPath);
    if (response.status !== 200 && response.status !== 0) {
      console.error("Failed to fetch zip file", this.zipPath);
      return;
    }
    let blob = await response.blob();
    this.zip = await JSZip.loadAsync(blob);
  }
}

export default BookFetcher;
