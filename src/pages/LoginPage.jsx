import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center relative overflow-hidden">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "gridMove 20s linear infinite",
        }}
      />

      <div className="relative z-10 text-center bg-black/60 backdrop-blur-sm border border-white/10 rounded-card shadow-card-hover" style={{ padding: "clamp(2rem, 5vw, 3rem) clamp(2.5rem, 6vw, 4rem)" }}>
        <h1 className="font-display font-bold text-white" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}>
          Welcome to CinemaScope
        </h1>
        <p className="font-body text-muted mt-3" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}>
          Discover the world's greatest films.
        </p>
        <button
          onClick={() => loginWithRedirect()}
          className="mt-8 font-body font-medium text-base bg-gold hover:bg-gold-lt text-black rounded-card transition-colors duration-normal cursor-pointer"
          style={{ padding: "clamp(0.6rem, 1.2vh, 0.85rem) clamp(1.5rem, 3vw, 2.5rem)", fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)" }}
        >
          Log In
        </button>
      </div>

      <style>{`@keyframes gridMove { 0% { transform: translateY(0); } 100% { transform: translateY(-50px); } }`}</style>
    </div>
  );
};

export default LoginPage;
