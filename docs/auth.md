# Authentication with Auth0

This document explains the implementation of authentication in CinemaScope using Auth0.

## Overview

CinemaScope uses **Auth0** for user authentication and authorization. The implementation focuses on providing a secure, "Login-First" experience for data-heavy sections (Film Details, Person Profiles, Compare Tool) while keeping discovery sections (Home, Search) public.

## Configuration

The Auth0 configuration is centralized in `src/main.jsx` using the `Auth0Provider`.

### Environment Variables
Sensitive configuration is managed via `.env` files (using Vite's `VITE_` prefix):
- `VITE_AUTH0_DOMAIN`: Your Auth0 tenant domain.
- `VITE_AUTH0_CLIENT_ID`: The Application Client ID.
- `VITE_AUTH0_AUDIENCE`: The API identifier (used for JWT tokens).

### Provider Setup
```javascript
<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: "openid profile email"
  }}
  cacheLocation="localstorage"
  useRefreshTokens={true}
>
  <App />
</Auth0Provider>
```
- **`cacheLocation="localstorage"`**: Ensures the user stays logged in across tab refreshes by persisting the session.
- **`useRefreshTokens={true}`**: Enables silent authentication via refresh tokens, allowing for longer sessions without re-login.

## Protected Routes

The application uses a custom `ProtectedRoute` component (`src/components/ui/ProtectedRoute.jsx`) to guard sensitive pages.

### Implementation
The `ProtectedRoute` uses the `withAuthenticationRequired` HOC or the `useAuth0` hook to check the `isAuthenticated` state. If the user is not logged in:
1. It records the current URL.
2. Redirects the user to the Auth0 Universal Login page.
3. After successful login, Auth0 redirects the user back to the original URL.

### Usage in `App.jsx`
```javascript
<Route 
  path="/film/:id" 
  element={<ProtectedRoute><FilmPage /></ProtectedRoute>} 
/>
```

## Authentication Flow

1. **Initial Load**: `Auth0Provider` checks for an existing session in `localStorage`.
2. **Accessing Protected Content**: If a user navigates to a `/film/:id` route, `ProtectedRoute` intercepts the render.
3. **Login**: The user is redirected to the Auth0 hosted login page (Universal Login).
4. **Callback**: Upon success, the user returns to the app. The `Auth0Provider` parses the result and updates the `user` and `isAuthenticated` state globally.
5. **Session Management**: Tokens are automatically refreshed in the background.

## User Profile

Authenticated user data (name, email, picture) is available via the `useAuth0()` hook in any component.
Example usage in `Profile.jsx`:
```javascript
const { user, isAuthenticated, isLoading } = useAuth0();
// ... access user.name, user.picture, etc.
```

## Best Practices Implemented

- **JWT Handling**: Auth0 handles the secure storage and rotation of JWT tokens.
- **Silent Auth**: Using refresh tokens prevents annoying re-authentications.
- **Granular Access**: Public vs. Protected routes are clearly separated in `App.jsx` to maximize SEO on discovery pages while protecting data.

## So, what does this actually do for the user?

In plain terms, Auth0 handles all the heavy lifting of figuring out if a user is who they say they are. 

When a user tries to click into a protected area—like a film's detailed cast page or their own profile—the app pauses, says "hold up, let's see who you are," and kicks them over to a secure Auth0 login screen. Once they log in (or sign up), Auth0 hands us a secure JWT token and redirects them right back to the exact page they were trying to visit. 

We stash that session securely and use silent refresh tokens in the background. What that means for the user is they don't have to keep logging in every time they open a new tab or come back tomorrow. It feels completely seamless. Meanwhile, the homepage and search are left totally public so anyone can browse without hitting a wall immediately!
