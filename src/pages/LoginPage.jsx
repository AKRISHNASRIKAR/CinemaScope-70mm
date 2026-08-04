import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

import AuthGate from "@/components/sections/AuthGate";
import BackButton from "@/components/ui/BackButton";

/**
 * LoginPage — the members entrance.
 *
 * All of the visual work lives in <AuthGate/>, which is shared with
 * ProtectedRoute so the sign-in surface is identical wherever it appears.
 */
const LoginPage = () => {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-base">
      <BackButton fallbackRoute="/" />
      <AuthGate
        eyebrow="Member pass"
        title="Welcome to CinemaScope"
        message="Discover the world's greatest films. Sign in to keep your watchlist, comparisons and viewing history in sync across devices."
        ctaLabel="Sign in"
        secondaryLabel="Continue browsing"
        secondaryTo="/"
      />
    </div>
  );
};

export default LoginPage;
