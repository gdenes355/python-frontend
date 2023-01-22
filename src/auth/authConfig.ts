export const msalConfig = {
  auth: {
    redirectUri: "https://msal--gdenes355-python-frontend.netlify.app/",
    clientId: "client-id-filled-by-application",
    authority: "https://login.microsoftonline.com/common/",
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
