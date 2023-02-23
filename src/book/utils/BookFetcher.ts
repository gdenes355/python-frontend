import {
  isAbsoluteAddress,
  absolutisePath,
  splitToParts,
} from "../../utils/pathTools";
import JSZip from "jszip";
import BookNodeModel, { getSinglePage } from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";
import { loadTestStateLocal } from "./ProgressStorage";
import IBookFetcher, { IBookFetchResult } from "./IBookFetcher";
import UnauthorisedError from "../../auth/UnauthorisedException";
import { SessionContextType } from "../../auth/SessionContext";
import NotFoundError from "./NotFoundError";
import { ReadyState } from "react-use-websocket";

class BookFetcher implements IBookFetcher {
  constructor(
    bookPath: string,
    zipPath?: string | null,
    zipData?: string | File,
    localFolder?: FileSystemDirectoryHandle
  ) {
    this.localFolder = localFolder;
    this.zipPath = zipPath || undefined;
    this.zipData = zipData || undefined;
    this.bookPath = bookPath;
    if (isAbsoluteAddress(bookPath)) {
      this.bookPathAbsolute = this.bookPath;
    } else {
      if (this.zipPath || this.zipData) {
        // is this within a zip?
        this.bookPathAbsolute = new URL(bookPath, "pfzip://in.zip/").toString();
      } else if (this.localFolder) {
        // is this within a local folder?
        this.bookPathAbsolute = new URL(bookPath, "pfdir://in.dir/").toString();
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

  public async fetch(url: string, sessionContext?: SessionContextType) {
    if (this.localFolder) {
      let pathParts = splitToParts(url.replace("pfdir://in.dir/", ""));
      let folder = this.localFolder;
      for (let i = 0; i < pathParts.length - 1; i++) {
        folder = await folder.getDirectoryHandle(pathParts[i]);
      }
      let fh = await folder.getFileHandle(pathParts[pathParts.length - 1]);
      let file = await fh.getFile();
      let text = await file.text();
      return new Response(text, { status: 200 });
    } else if (this.usesLocalZip()) {
      // use a local ZIP file
      if (!this.zip) {
        await this.fetchZip();
      }
      let blob = await this.zip
        ?.file(url.replace("pfzip://in.zip/", ""))
        ?.async("blob");
      return new Response(blob, { status: 200 });
    } else if (
      sessionContext?.wsState === ReadyState.OPEN &&
      sessionContext?.wsSend
    ) {
      // use Websockets
      let response: any = undefined;

      await sessionContext.wsSend(
        {
          cmd: "fetch",
          path: url,
        },
        (msg: any) => {
          response = msg;
        }
      );
      if (response.res === "succ") {
        return new Response(response.data);
      }
    }

    // fall back to HTTP fetch
    let headers = new Headers();
    if (sessionContext?.token) {
      headers.append("Authorization", `Bearer ${sessionContext.token}`);
    }
    let res = await fetch(url, { headers });
    if (res.status === 401) {
      let data = await res.json();
      throw new UnauthorisedError({
        clientId: data.clientId,
        jwtEndpoint: data.jwtEndpoint,
        startUrl: this.bookPathAbsolute,
        resultsEndpoint: data.resultsEndpoint,
        wsEndPoint: data.wsEndPoint,
        bookPath: this.bookPath,
      });
    } else if (res.status === 404 || res.status === 500) {
      throw new NotFoundError(url);
    } else if (sessionContext?.token) {
      let newToken = res.headers.get("new-token");
      if (newToken) {
        console.log("refresh token");
        sessionContext.setToken(newToken);
      }
    }
    return res;
  }

  public fetchBook(
    authContext?: SessionContextType
  ): Promise<IBookFetchResult> {
    return new Promise<IBookFetchResult>((r, e) => {
      let allRes: AllTestResults = { passed: new Set(), failed: new Set() };
      this.fetch(this.bookPathAbsolute, authContext)
        .then((response) =>
          response
            .json()
            .then((data) => ({ code: response.status, data }))
            .then(({ code, data }) => {
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
            .then((res) =>
              r({ ...res, singlePageBook: getSinglePage(res.book) })
            )
        )
        .catch((t) => {
          if (t instanceof UnauthorisedError) {
            e(t);
          } else if (t instanceof NotFoundError) {
            e(t);
          }
        });
    });
  }

  private zipPath?: string;
  private zipData?: string | File;
  private bookPathAbsolute: string;
  private bookPath: string;
  private zip: JSZip | null = null;

  private localFolder?: FileSystemDirectoryHandle;

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
      let localRes = loadTestStateLocal(bookNode);
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
