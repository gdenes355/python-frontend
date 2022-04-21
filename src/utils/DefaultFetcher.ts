import IFetcher from "./IFetcher";
class DefaultFetcher implements IFetcher {
  fetch(url: string) {
    return fetch(url);
  }
}

export default DefaultFetcher;
