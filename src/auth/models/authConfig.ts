export const msalConfig = {
  auth: {
    clientId: "client-id-filled-by-application",
    authority: "authority-filled-by-application",
    redirectUri: "redirect-uri-filled-by-application",
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
