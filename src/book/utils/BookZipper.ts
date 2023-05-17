import BookNodeModel from "../../models/BookNodeModel";
import JSZip from "jszip";
import { absolutisePath } from "../../utils/pathTools";
import IBookFetcher from "./IBookFetcher";
import { SessionContextType } from "../../auth/SessionContext";

export default class BookZipper {
  constructor(fetcher: IBookFetcher) {
    this.fetcher = fetcher;
  }

  public async zipBook(book: BookNodeModel, authContext: SessionContextType) {
    this.zip.file("book.json", JSON.stringify(book));
    await this.addNode(book, authContext);
    return this.zip;
  }

  private zip = new JSZip();
  private fetcher: IBookFetcher;

  private async addNode(node: BookNodeModel, authContext: SessionContextType) {
    if (node.guide) {
      let absPath = absolutisePath(
        node.guide,
        node.bookMainUrl || this.fetcher.getBookPathAbsolute()
      );
      let resp = await this.fetcher.fetch(absPath, authContext);
      if (resp.ok) {
        this.zip.file(node.guide, await resp.text());
      }
    }
    if (node.py) {
      let absPath = absolutisePath(
        node.py,
        node.bookMainUrl || this.fetcher.getBookPathAbsolute()
      );
      let resp = await this.fetcher.fetch(absPath, authContext);
      if (resp.ok) {
        this.zip.file(node.py, await resp.text());
      }
    }
    if (node.hasSolution) {
      let absPath = absolutisePath(
        `solutions/${node.py}`,
        node.bookMainUrl || this.fetcher.getBookPathAbsolute()
      );
      let resp = await this.fetcher.fetch(absPath, authContext);
      if (resp.ok) {
        this.zip.folder("solutions")?.file(`${node.py}`, await resp.text());
      }
    }
    if (node.additionalFiles) {
      for (const file of node.additionalFiles) {
        let absPath = absolutisePath(
          file.filename,
          node.bookMainUrl || this.fetcher.getBookPathAbsolute()
        );
        let resp = await this.fetcher.fetch(absPath, authContext);
        if (resp.ok) {
          this.zip.file(file.filename, await resp.text());
        }
      }
    }
    if (node.children) {
      for (let child of node.children) {
        await this.addNode(child, authContext);
      }
    }
  }
}
