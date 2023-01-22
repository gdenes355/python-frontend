import BookNodeModel from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";
import { AuthContextType } from "../../auth/AuthContext";

type IBookFetchResult = {
  book: BookNodeModel;
  allResults: AllTestResults;
  singlePageBook: BookNodeModel | null;
};

interface IBookFetcher {
  getBookPathAbsolute: () => string;
  fetch(url: string, authContext?: AuthContextType): Promise<Response>;
  fetchBook: (authContext?: AuthContextType) => Promise<IBookFetchResult>;
}

export default IBookFetcher;
export { IBookFetchResult };
