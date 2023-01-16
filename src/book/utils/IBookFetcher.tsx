import BookNodeModel from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";

type IBookFetchResult = {
  book: BookNodeModel;
  allResults: AllTestResults;
  singlePageBook: BookNodeModel | null;
};

interface IBookFetcher {
  getBookPathAbsolute: () => string;
  fetch(url: string, authToken: string): Promise<Response>;
  fetchBook: (authToken: string) => Promise<IBookFetchResult>;
}

export default IBookFetcher;
export { IBookFetchResult };
