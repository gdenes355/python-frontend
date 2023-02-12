import BookNodeModel from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";
import { SessionContextType } from "../../auth/SessionContext";

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

export default IBookFetcher;
export { IBookFetchResult };
