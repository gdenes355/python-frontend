type LoginInfo = {
  clientId: string;
  jwtEndpoint: string;
  ended?: boolean;
  startUrl: string;
  resultsEndpoint: string;
  resultsProtocol: "REST" | "ws";
  bookPath: string;
};

export default LoginInfo;
