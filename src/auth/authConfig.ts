export const msalConfig = {
  auth: {
    clientId: "client-id-filled-by-application",
    authority: "https://login.microsoftonline.com/common/",
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
  forceRefresh: true,
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
