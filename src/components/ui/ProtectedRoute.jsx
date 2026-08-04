import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import AuthGate from "@/components/sections/AuthGate";

/** How long we wait for Auth0 to initialise before giving up on it. */
const AUTH_TIMEOUT_MS = 3000;

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * - Shows a loading spinner while auth state is initializing
 * - Renders the <AuthGate/> pass in place when the visitor is signed out,
 *   so the URL is preserved and they can sign in without losing their place
 * - Safety timeout: if Auth0 never resolves (bad credentials, network error,
 *   missing tenant) we stop spinning after AUTH_TIMEOUT_MS and treat the user
 *   as unauthenticated, so the app can never freeze on a spinner.
 */
const ProtectedRoute = ({
  children,
  title = "Members only",
  message = "This area is reserved for members. Sign in to continue — everything else on CinemaScope stays open to browse.",
}) => {
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
    return (
      <AuthGate
        eyebrow="Members only"
        title={title}
        message={message}
        ctaLabel="Sign in to continue"
        secondaryLabel="Back to browsing"
        secondaryTo="/"
      />
    );
  }

  return children;
};

export default ProtectedRoute;
