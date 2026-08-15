// Auth provider — wraps the React tree with a Supabase session context.
// Replaces the previous Auth0 provider; the supabase singleton handles
// session persistence and token refresh automatically.
//
// ProtectedRoute and all components that need auth state use useSession()
// directly from @/hooks/useSession — no context is needed because the
// Supabase client manages state internally.
//
// This component exists solely as the structural placeholder that App.jsx
// renders around the Router, keeping the same JSX shape as before.

const AppAuthProvider = ({ children }) => children;

export default AppAuthProvider;
