import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import ScrollRow from "@/components/ui/ScrollRow";
import FilmCard from "@/components/ui/FilmCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
/* ── Main Page ─────────────────────────────────────────────────── */
const Profile = () => {
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const { recentFilms, clearRecent } = useRecentlyViewed();
  const [activeTab, setActiveTab] = useState("recent");

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

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start" style={{ gap: "clamp(1.5rem,3vw,2.5rem)", marginTop: "clamp(1.5rem,3vh,2.5rem)" }}>
          <div className="text-center sm:text-left">
            <p className="font-display font-bold text-white leading-none" style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)" }}>
              {recentFilms.length}
            </p>
            <p className="font-mono text-muted uppercase tracking-[0.1em] mt-1" style={{ fontSize: "clamp(0.55rem,0.8vw,0.65rem)" }}>
              Films Viewed
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center sm:text-left">
            <p className="font-display font-bold text-white leading-none" style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)" }}>
              0
            </p>
            <p className="font-mono text-muted uppercase tracking-[0.1em] mt-1" style={{ fontSize: "clamp(0.55rem,0.8vw,0.65rem)" }}>
              Watchlist
            </p>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 border-b border-white/10" style={{ marginTop: "clamp(2rem,4vh,3.5rem)" }}>
          {[
            { id: "recent", label: "Recently Viewed" },
            { id: "watchlist", label: "Watchlist" },
            { id: "favorites", label: "Favorites" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 font-body font-medium uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                activeTab === tab.id ? "text-gold border-b-2 border-gold" : "text-white/40 hover:text-white"
              }`}
              style={{ fontSize: "clamp(0.6rem,0.9vw,0.75rem)" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────────────── */}
        <div style={{ minHeight: "250px", marginTop: "clamp(1.5rem,3vh,2.5rem)" }}>
          {activeTab === "recent" && (
            recentFilms.length > 0 ? (
              <div className="w-full">
                <SectionHeader
                  title=""
                  action={
                    <button
                      onClick={clearRecent}
                      className="font-body text-muted hover:text-white/80 transition-colors duration-fast cursor-pointer"
                      style={{ fontSize: "clamp(0.55rem,0.85vw,0.7rem)" }}
                    >
                      Clear Recently Viewed
                    </button>
                  }
                />
                <ScrollRow
                  showArrows={recentFilms.length > 5}
                  scrollAmount={280}
                  gap="clamp(0.75rem,1.5vw,1.25rem)"
                  arrowSize="2.25rem"
                  ariaLabel="Recently viewed films"
                >
                  {recentFilms.map((film) => (
                    <div
                      key={film.id}
                      className="flex-shrink-0 transition-all duration-300 hover:scale-[1.02]"
                      style={{ width: "clamp(110px,12vw,160px)", scrollSnapAlign: "start" }}
                    >
                      <FilmCard film={film} />
                    </div>
                  ))}
                </ScrollRow>
              </div>
            ) : (
              <p className="font-body text-muted text-center py-8">You haven&apos;t viewed any films recently. Start exploring!</p>
            )
          )}
          
          {activeTab === "watchlist" && (
            <p className="font-body text-muted text-center py-8">You haven&apos;t added any films to your watchlist yet.</p>
          )}

          {activeTab === "favorites" && (
            <p className="font-body text-muted text-center py-8">You haven&apos;t favorited any films yet.</p>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default Profile;
