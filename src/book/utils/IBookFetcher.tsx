import { SessionContextType } from "../../auth/contexts/SessionContext";
import BookNodeModel from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";

type IBookFetchResult = {
  book: BookNodeModel;
  allResults: AllTestResults;
  singlePageBook: BookNodeModel | null;
};

interface IBookFetcher {
  getBookPathAbsolute: () => string;
  fetch(url: string, authContext?: SessionContextType): Promise<Response>;
  fetchBook: (authContext?: SessionContextType) => Promise<IBookFetchResult>;
}

export const clearBook = (b: BookNodeModel) => {
  if (b.bookMainUrl) {
    b.bookMainUrl = undefined;
  }
  if (b.bookLink) {
    b.bookLink = undefined;
  }
  if (b.children) {
    b.children = b.children.map(clearBook);
  }
  return b;
};

export default IBookFetcher;
export { IBookFetchResult };
