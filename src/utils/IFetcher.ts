interface IFetcher {
  fetch(url: string): Promise<Response>;
}

export default IFetcher;
