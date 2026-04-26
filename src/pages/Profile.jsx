import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";

/* ── Main Page ─────────────────────────────────────────────────── */
const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth0();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-muted" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)" }}>
            You are not logged in.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 font-body font-medium text-black bg-gold hover:bg-gold-lt rounded-card transition-colors duration-normal cursor-pointer"
            style={{ padding: "0.65rem 2rem", fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const memberSince = user?.updated_at
    ? new Date(user.updated_at).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <BackButton fallbackRoute="/" />

      {/* ── Hero backdrop ──────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(220px,35vh,320px)" }}>
        {/* Blurred avatar as backdrop */}
        {user.picture && (
          <img
            src={user.picture}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: "blur(40px) saturate(0.6) brightness(0.35)" }}
          />
        )}
        {/* Gradient fade to base */}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        {/* Film grain */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "150px 150px",
          }}
        />
      </div>

      {/* ── Profile card — overlaps the backdrop ──────────────── */}
      <div className="flex-1 center-container" style={{ marginTop: "clamp(-5rem,-10vh,-4rem)" }}>

        {/* Avatar + name row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end" style={{ gap: "clamp(1rem,2.5vw,1.75rem)" }}>
          {/* Avatar */}
          <div className="relative flex-shrink-0" style={{ zIndex: 10 }}>
            <div
              className="rounded-full overflow-hidden ring-4 ring-base shadow-card-hover"
              style={{ width: "clamp(5rem,12vw,8rem)", height: "clamp(5rem,12vw,8rem)" }}
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online dot */}
            <span
              className="absolute bottom-1 right-1 rounded-full bg-green-400 ring-2 ring-base"
              style={{ width: "clamp(0.6rem,1.2vw,0.85rem)", height: "clamp(0.6rem,1.2vw,0.85rem)" }}
            />
          </div>

          {/* Name + meta */}
          <div className="text-center sm:text-left pb-1" style={{ zIndex: 10 }}>
            <p className="font-mono text-gold uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.5rem,0.8vw,0.65rem)", marginBottom: "0.3rem" }}>
              Member since {memberSince}
            </p>
            <h1
              className="font-display font-bold text-white leading-none tracking-tight"
              style={{ fontSize: "clamp(1.6rem,4vw,3rem)" }}
            >
              {user.name}
            </h1>
            <p className="font-body text-muted mt-1" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className="border-t border-white/8" style={{ marginTop: "clamp(1.5rem,3vh,2.5rem)" }} />

        {/* ── Stats row — commented out until watch history feature is built ── */}
        {/*
        <div
          className="grid grid-cols-3"
          style={{ gap: "clamp(0.75rem,2vw,1.25rem)", marginTop: "clamp(1.5rem,3vh,2.5rem)" }}
        >
          <StatCard
            icon={<MovieIcon sx={{ fontSize: "clamp(1.1rem,1.8vw,1.4rem)" }} />}
            value="—"
            label="Films Watched"
          />
          <StatCard
            icon={<StarIcon sx={{ fontSize: "clamp(1.1rem,1.8vw,1.4rem)" }} />}
            value="—"
            label="Reviews"
          />
          <StatCard
            icon={<FavoriteIcon sx={{ fontSize: "clamp(1.1rem,1.8vw,1.4rem)" }} />}
            value="—"
            label="Favourites"
          />
        </div>
        */}

        {/* ── Account section ─────────────────────────────────── */}
        <div
          className="rounded-card border border-white/8 bg-white/[0.02]"
          style={{ marginTop: "clamp(1.5rem,3vh,2.5rem)", padding: "clamp(1.25rem,3vw,2rem)" }}
        >
          <h2
            className="font-display font-bold text-white"
            style={{ fontSize: "clamp(0.9rem,1.5vw,1.2rem)", marginBottom: "clamp(1rem,2vh,1.5rem)" }}
          >
            Account
          </h2>

          <div className="flex flex-col" style={{ gap: "clamp(0.5rem,1vh,0.75rem)" }}>
            {/* Auth provider badge */}
            <div className="flex items-center justify-between py-3 border-b border-white/6">
              <span className="font-body text-muted" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
                Signed in via
              </span>
              <span className="font-mono text-white/70 uppercase tracking-[0.1em]" style={{ fontSize: "clamp(0.6rem,0.9vw,0.75rem)" }}>
                Auth0
              </span>
            </div>
            {/* Email */}
            <div className="flex items-center justify-between py-3 border-b border-white/6">
              <span className="font-body text-muted" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
                Email
              </span>
              <span className="font-body text-white/70" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
                {user.email}
              </span>
            </div>
            {/* Email verified */}
            <div className="flex items-center justify-between py-3">
              <span className="font-body text-muted" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
                Email verified
              </span>
              <span
                className={`font-mono uppercase tracking-[0.1em] ${user.email_verified ? "text-green-400" : "text-red-400"}`}
                style={{ fontSize: "clamp(0.55rem,0.85vw,0.7rem)" }}
              >
                {user.email_verified ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Action buttons ───────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row"
          style={{ gap: "clamp(0.75rem,1.5vw,1rem)", marginTop: "clamp(1.5rem,3vh,2.5rem)", marginBottom: "clamp(2rem,4vh,3rem)" }}
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 font-body font-medium text-white/80 hover:text-white bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 rounded-card transition-all duration-normal cursor-pointer flex-1"
            style={{ padding: "0.75rem 1.5rem", fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}
          >
            <HomeIcon sx={{ fontSize: "1rem" }} />
            Back to Home
          </button>
          <button
            onClick={() => logout({ returnTo: `${window.location.origin}/` })}
            className="flex items-center justify-center gap-2 font-body font-medium text-gold border border-gold/30 hover:bg-gold/10 hover:border-gold/60 rounded-card transition-all duration-normal cursor-pointer flex-1"
            style={{ padding: "0.75rem 1.5rem", fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}
          >
            <LogoutIcon sx={{ fontSize: "1rem" }} />
            Sign Out
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
