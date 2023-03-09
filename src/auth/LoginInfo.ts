type LoginInfo = {
  clientId: string;
  jwtEndpoint: string;
  ended?: boolean;
  startUrl: string;
  resultsEndpoint: string;
  wsEndPoint: string;
  bookPath: string;
};

export default LoginInfo;
