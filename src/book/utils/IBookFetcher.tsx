import BookNodeModel from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";

type IBookFetchResult = {
  book: BookNodeModel;
  allResults: AllTestResults;
  singlePageBook: BookNodeModel | null;
};

interface IBookFetcher {
  getBookPathAbsolute: () => string;
  fetch(url: string): Promise<Response>;
  fetchBook: () => Promise<IBookFetchResult>;
}

export default IBookFetcher;
export { IBookFetchResult };
