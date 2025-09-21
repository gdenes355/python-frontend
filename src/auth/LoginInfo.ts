type AuthProvider = "MSAL" | "GOOGLE";

type LoginInfo = {
  clientId: string;
  tenantId: string;
  authProvider: AuthProvider;
  jwtEndpoint: string;
  ended?: boolean;
  startUrl: string;
  resultsEndpoint: string;
  wsEndPoint: string;
  bookPath: string;
};

export default LoginInfo;
