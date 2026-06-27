import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { useSession } from "@/hooks/useSession";

const LoginPage = () => {
  const { isAuthenticated, isLoading, signInWithGoogle, signInWithGitHub, signInWithMagicLink } = useSession();
  const navigate = useNavigate();
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div
          className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full"
          style={{ animation: "spin 0.8s linear infinite" }}
          role="status"
          aria-label="Loading login"
        />
      </div>
    );
  }

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setMagicLoading(true);
    setError(null);
    const { error: err } = await signInWithMagicLink(magicEmail.trim());
    setMagicLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setMagicSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center relative overflow-hidden">
      <BackButton fallbackRoute="/" />

      {/* Animated grid background */}
      <div
        className="gridMove absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div
        className="relative z-10 w-full text-center bg-black/60 backdrop-blur-sm border border-white/10 rounded-card shadow-card-hover"
        style={{
          maxWidth: "clamp(320px, 90vw, 420px)",
          padding: "clamp(2rem, 5vw, 3rem) clamp(2rem, 5vw, 3rem)",
        }}
      >
        <h1
          className="font-display font-bold text-white"
          style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
        >
          Welcome to CinemaScope
        </h1>
        <p
          className="font-body text-muted mt-2"
          style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}
        >
          Sign in to track films, build your watchlist, and leave reviews.
        </p>

        {/* OAuth buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => { setError(null); signInWithGoogle(); }}
            className="w-full font-body font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-card transition-colors duration-normal cursor-pointer flex items-center justify-center gap-3"
            style={{ padding: "0.75rem 1.5rem", fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => { setError(null); signInWithGitHub(); }}
            className="w-full font-body font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-card transition-colors duration-normal cursor-pointer flex items-center justify-center gap-3"
            style={{ padding: "0.75rem 1.5rem", fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-body text-muted" style={{ fontSize: "0.75rem" }}>or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Magic link */}
        {magicSent ? (
          <p className="font-body text-gold" style={{ fontSize: "clamp(0.75rem, 1.1vw, 0.85rem)" }}>
            Check your inbox — a sign-in link is on its way.
          </p>
        ) : (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              required
              className="w-full font-body text-white bg-white/5 border border-white/10 rounded-card outline-none focus:border-gold transition-colors"
              style={{ padding: "0.65rem 1rem", fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)" }}
            />
            <button
              type="submit"
              disabled={magicLoading}
              className="w-full font-body font-medium text-black bg-gold hover:bg-gold-lt rounded-card transition-colors duration-normal cursor-pointer disabled:opacity-50"
              style={{ padding: "0.75rem 1.5rem", fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)" }}
            >
              {magicLoading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 font-body text-red-400" style={{ fontSize: "0.8rem" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
