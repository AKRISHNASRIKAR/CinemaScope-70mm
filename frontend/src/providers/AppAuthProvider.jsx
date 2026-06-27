import { Auth0Context, Auth0Provider } from "@auth0/auth0-react";

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const hasAuth0Config = Boolean(auth0Domain && auth0ClientId);

const loggedOutAuthContext = {
  isAuthenticated: false,
  isLoading: false,
  user: undefined,
  error: undefined,
  buildAuthorizeUrl: async () => "",
  buildLogoutUrl: () => "",
  getAccessTokenSilently: async () => "",
  getAccessTokenWithPopup: async () => "",
  getIdTokenClaims: async () => undefined,
  handleRedirectCallback: async () => ({ appState: undefined }),
  loginWithPopup: async () => undefined,
  loginWithRedirect: async () => undefined,
  logout: () => undefined,
};

const AppAuthProvider = ({ children }) => {
  if (!hasAuth0Config) {
    return (
      <Auth0Context.Provider value={loggedOutAuthContext}>
        {children}
      </Auth0Context.Provider>
    );
  }

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
};

export default AppAuthProvider;
