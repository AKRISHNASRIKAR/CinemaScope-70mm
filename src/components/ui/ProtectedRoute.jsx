import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

/** How long we wait for Auth0 to initialise before giving up on it. */
const AUTH_TIMEOUT_MS = 3000;

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * - Shows a loading spinner while auth state is initializing
 * - Redirects to /login if user is not authenticated
 * - Safety timeout: if Auth0 never resolves (bad credentials, network error,
 *   missing tenant) we stop spinning after AUTH_TIMEOUT_MS and treat the user
 *   as unauthenticated, so the app can never freeze on a spinner.
 */
const ProtectedRoute = ({ children, fallbackRoute = "/login" }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading && !timedOut) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the intended destination for redirect after login
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
