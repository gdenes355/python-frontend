import { isAbsoluteAddress, absolutisePath } from "../../utils/pathTools";
import JSZip from "jszip";
import BookNodeModel, { getSinglePage } from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";
import { loadTestState } from "./ResultsStore";
import IBookFetcher, { IBookFetchResult } from "./IBookFetcher";
import UnauthorisedError from "../../auth/UnauthorisedException";
import { SessionContextType } from "../../auth/SessionContext";

class BookFetcher implements IBookFetcher {
  constructor(
    bookPath: string,
    zipPath?: string | null,
    zipData?: string | File
  ) {
    this.zipPath = zipPath || undefined;
    this.zipData = zipData || undefined;
    this.bookPath = bookPath;
    if (isAbsoluteAddress(bookPath)) {
      this.bookPathAbsolute = this.bookPath;
    } else {
      // is this within a zip?
      if (this.zipPath || this.zipData) {
        this.bookPathAbsolute = new URL(bookPath, "pfzip://in.zip/").toString();
      } else {
        this.bookPathAbsolute = new URL(bookPath, document.baseURI).toString();
      }
    }
  }

  public usesLocalZip() {
    return this.zipPath || this.zip || this.zipData;
  }

  public getBookPathAbsolute() {
    return this.bookPathAbsolute;
  }

  public async fetch(url: string, authContext?: SessionContextType) {
    if (this.usesLocalZip()) {
      if (!this.zip) {
        await this.fetchZip();
      }
      let blob = await this.zip
        ?.file(url.replace("pfzip://in.zip/", ""))
        ?.async("blob");
      return new Response(blob, { status: 200 });
    } else {
      let headers = new Headers();
      if (authContext?.token) {
        headers.append("Authorization", `Bearer ${authContext.token}`);
      }
      let res = await fetch(url, { headers: headers });
      if (authContext?.token) {
        let newToken = res.headers.get("new-token");
        if (newToken) {
          authContext.setToken(newToken);
        }
      }
      return res;
    }
  }

  public fetchBook(
    authContext?: SessionContextType
  ): Promise<IBookFetchResult> {
    return new Promise<IBookFetchResult>((r, e) => {
      let allRes: AllTestResults = { passed: new Set(), failed: new Set() };
      this.fetch(this.bookPathAbsolute, authContext).then((response) =>
        response
          .json()
          .then((data) => ({ code: response.status, data }))
          .then(({ code, data }) => {
            if (code === 401 && data.error === "get-jwt") {
              e(
                new UnauthorisedError({
                  clientId: data.clientId,
                  jwtEndpoint: data.jwtEndpoint,
                  startUrl: this.bookPathAbsolute,
                  resultsEndpoint: data.resultsEndpoint,
                  resultsProtocol: data.resultsProtocol,
                  bookPath: this.bookPath,
                })
              );
            }

            if (code !== 200) {
              e(new Error("Book cannot be found"));
            }

            return this.expandBookLinks(
              data,
              this.getBookPathAbsolute(),
              allRes,
              true,
              authContext
            );
          })
          .then((res) => r({ ...res, singlePageBook: getSinglePage(res.book) }))
      );
    });
  }

  private zipPath?: string;
  private zipData?: string | File;
  private bookPathAbsolute: string;
  private bookPath: string;
  private zip: JSZip | null = null;

  private zipFetchingFromPath = false;

  async expandBookLinks(
    bookNode: BookNodeModel,
    mainUrl: string,
    allRes: AllTestResults,
    fileRoot: boolean,
    authContext?: SessionContextType
  ) {
    bookNode.bookMainUrl = mainUrl;
    if (fileRoot) {
      let localRes = loadTestState(bookNode);
      allRes.passed = new Set([...allRes.passed, ...localRes.passed]);
      allRes.failed = new Set([...allRes.failed, ...localRes.failed]);
    }
    if (bookNode.children) {
      for (const child of bookNode.children) {
        await this.expandBookLinks(child, mainUrl, allRes, false, authContext);
      }
    }
    if (bookNode.bookLink) {
      let path = absolutisePath(bookNode.bookLink, mainUrl);
      let response = await this.fetch(path, authContext);
      let bookData = await response.json();
      bookNode.children = bookData.children;
      await this.expandBookLinks(bookData, path, allRes, true, authContext);
    }
    return { book: bookNode, allResults: allRes };
  }

  private async fetchZip() {
    if (
      this.zip ||
      (!this.zipPath && !this.zipData) ||
      this.zipFetchingFromPath
    ) {
      return;
    }
    if (this.zipPath) {
      this.zipFetchingFromPath = true;
      let response = await fetch(this.zipPath);
      if (response.status !== 200 && response.status !== 0) {
        console.error("Failed to fetch zip file", this.zipPath);
        return;
      }
      let blob = await response.blob();
      this.zip = await JSZip.loadAsync(blob);
      this.zipFetchingFromPath = false;
    } else if (this.zipData) {
      this.zip = await JSZip.loadAsync(this.zipData, { base64: true });
    }
  }
}

export default BookFetcher;
