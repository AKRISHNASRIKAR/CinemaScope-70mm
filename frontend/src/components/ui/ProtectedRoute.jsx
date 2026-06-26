import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute — wraps routes that require authentication.
 * 
 * - Shows a loading spinner while auth state is initializing
 * - Redirects to /login if user is not authenticated
 * - Optionally accepts a fallback route to redirect after login
 */
const ProtectedRoute = ({ children, fallbackRoute = "/login" }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
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