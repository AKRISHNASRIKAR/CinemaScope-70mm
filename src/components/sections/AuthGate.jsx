import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";

import { fetcher } from "@/lib/api/fetcher";
import { backdropUrl } from "@/lib/utils/tmdbImage";

/**
 * AuthGate — the single sign-in surface for the whole app.
 *
 * Rendered full-screen by `/login` and inline by `ProtectedRoute` when an
 * unauthenticated visitor opens a members-only route. Presented as a
 * cinema member pass: a glass ticket floating over a blurred film backdrop.
 *
 * The backdrop is fetched with SWR *without* Suspense on purpose — the pass
 * paints immediately and the artwork fades in behind it, so the CTA is never
 * blocked on the network and the panel never flashes empty.
 */

const NOTCH = "clamp(14px, 2.2vw, 20px)";

const AuthGate = ({
  eyebrow = "Member access",
  title = "Welcome to CinemaScope",
  message = "Sign in to keep your watchlist, comparisons and viewing history in sync.",
  ctaLabel = "Sign in",
  secondaryLabel = "Continue browsing",
  secondaryTo = "/",
}) => {
  const { loginWithRedirect, isLoading } = useAuth0();
  const navigate = useNavigate();
  const [artLoaded, setArtLoaded] = useState(false);

  const { data } = useSWR("/movie/popular", fetcher);
  const feature = data?.results?.find((f) => f.backdrop_path) ?? null;
  const art = backdropUrl(feature?.backdrop_path);

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden bg-base" style={{ minHeight: "100vh" }}>
      {/* ── Full-bleed blurred backdrop ─────────────────────────── */}
      {art && (
        <img
          src={art}
          alt=""
          aria-hidden
          loading="eager"
          fetchpriority="high"
          onLoad={() => setArtLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "blur(22px) saturate(1.25)",
            transform: "scale(1.12)",
            opacity: artLoaded ? 0.7 : 0,
            transition: "opacity 900ms ease",
          }}
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-base via-base/70 to-base/35" />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(90% 60% at 50% 30%, rgba(201,168,67,0.10) 0%, rgba(9,9,9,0) 70%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "150px 150px",
        }}
      />

      {/* ── The pass ────────────────────────────────────────────── */}
      <div
        className="relative rounded-card border border-white/10 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          width: "clamp(290px, 92vw, 460px)",
          margin: "clamp(4.5rem, 12vh, 7rem) clamp(1rem, 4vw, 2rem)",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* gold foil edge */}
        <div
          aria-hidden
          style={{ height: "3px", background: "linear-gradient(90deg, rgba(201,168,67,0) 0%, #c9a843 50%, rgba(201,168,67,0) 100%)" }}
        />

        <div style={{ padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.35rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)" }}>
          {/* Pass header */}
          <div className="flex items-center justify-between" style={{ gap: "0.75rem" }}>
            <span
              className="font-wordmark font-black italic text-white tracking-tight"
              style={{ fontSize: "clamp(0.85rem, 1.6vw, 1.05rem)" }}
            >
              CinemaScope
            </span>
            <span
              className="font-mono text-gold uppercase border border-gold/40 rounded-full whitespace-nowrap"
              style={{ fontSize: "clamp(0.4rem, 0.7vw, 0.55rem)", letterSpacing: "0.22em", padding: "0.2rem 0.6rem" }}
            >
              {eyebrow}
            </span>
          </div>

          <h1
            className="font-display font-bold text-white leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.35rem)", marginTop: "clamp(1.25rem, 3vh, 2rem)" }}
          >
            {title}
          </h1>

          <p
            className="font-body text-white/55 leading-relaxed"
            style={{ fontSize: "clamp(0.72rem, 1.1vw, 0.9rem)", marginTop: "clamp(0.5rem, 1.2vh, 0.85rem)", maxWidth: "42ch" }}
          >
            {message}
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => loginWithRedirect()}
            disabled={isLoading}
            className="w-full font-body font-semibold text-black bg-gold hover:bg-gold-lt rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            style={{
              marginTop: "clamp(1.25rem, 3vh, 2rem)",
              padding: "0.85rem 2rem",
              fontSize: "clamp(0.78rem, 1.2vw, 0.92rem)",
              letterSpacing: "0.02em",
            }}
          >
            {isLoading ? "Connecting…" : ctaLabel}
          </button>

          {secondaryLabel && (
            <button
              onClick={() => navigate(secondaryTo)}
              className="w-full font-body text-white/45 hover:text-white transition-colors duration-fast cursor-pointer bg-transparent"
              style={{ marginTop: "clamp(0.5rem, 1.2vh, 0.85rem)", padding: "0.6rem 1rem", fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}
            >
              {secondaryLabel}
            </button>
          )}
        </div>

        {/* ── Perforation ───────────────────────────────────────── */}
        <div className="relative" style={{ height: "1px" }}>
          <div
            aria-hidden
            className="absolute inset-x-0"
            style={{
              top: 0,
              height: "1px",
              backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 6px, transparent 6px 12px)",
            }}
          />
          <div
            aria-hidden
            className="absolute rounded-full bg-base border border-white/10"
            style={{ width: NOTCH, height: NOTCH, left: 0, top: "50%", transform: "translate(-50%, -50%)" }}
          />
          <div
            aria-hidden
            className="absolute rounded-full bg-base border border-white/10"
            style={{ width: NOTCH, height: NOTCH, right: 0, top: "50%", transform: "translate(50%, -50%)" }}
          />
        </div>

        {/* ── Stub ──────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between"
          style={{ gap: "1rem", padding: "clamp(0.9rem, 2vw, 1.25rem) clamp(1.35rem, 4vw, 2.5rem)" }}
        >
          <div className="min-w-0">
            <p
              className="font-mono text-white/40 uppercase"
              style={{ fontSize: "clamp(0.4rem, 0.7vw, 0.55rem)", letterSpacing: "0.28em" }}
            >
              Admit one
            </p>
            <p
              className="font-mono text-white/25 line-clamp-1"
              style={{ fontSize: "clamp(0.4rem, 0.7vw, 0.55rem)", letterSpacing: "0.14em", marginTop: "0.2rem" }}
            >
              {feature?.title ? `Now showing · ${feature.title}` : "All screens · All areas"}
            </p>
          </div>
          <div
            aria-hidden
            className="flex-shrink-0 rounded-[2px]"
            style={{
              width: "clamp(48px, 9vw, 76px)",
              height: "clamp(18px, 3vw, 26px)",
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 2px, transparent 2px 5px)",
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
