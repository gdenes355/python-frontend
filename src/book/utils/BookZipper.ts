import BookNodeModel from "../../models/BookNodeModel";
import JSZip from "jszip";
import { absolutisePath } from "../../utils/pathTools";
import IBookFetcher from "./IBookFetcher";
import { AuthContextType } from "../../auth/AuthContext";

export default class BookZipper {
  constructor(fetcher: IBookFetcher) {
    this.fetcher = fetcher;
  }

  public async zipBook(book: BookNodeModel, authContext: AuthContextType) {
    this.zip.file("book.json", JSON.stringify(book));
    await this.addNode(book, authContext);
    return this.zip;
  }

  private zip = new JSZip();
  private fetcher: IBookFetcher;

  private async addNode(node: BookNodeModel, authContext: AuthContextType) {
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
    if (node.children) {
      for (let child of node.children) {
        await this.addNode(child, authContext);
      }
    }
  }
}
