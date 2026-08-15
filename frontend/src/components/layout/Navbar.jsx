import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useSession } from "@/hooks/useSession";

const Header = () => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const navbarRef = useRef(null);

  /* ── Expose navbar height as CSS var for offset calculations ── */
  useEffect(() => {
    const update = () => {
      if (navbarRef.current) {
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${navbarRef.current.offsetHeight}px`
        );
      }
    };
    update();
    if (!navbarRef.current || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(navbarRef.current);
    return () => observer.disconnect();
  }, []);

  const openSearch = () => {
    setSearchExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 60);
  };

  const closeSearch = useCallback(() => {
    setSearchExpanded(false);
    setSearchQuery("");
  }, []);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      closeSearch();
    }
  }, [searchQuery, navigate, closeSearch]);

  const handleSearchKey = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") closeSearch();
  };

  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") closeSearch(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [closeSearch]);

  return (
    <header ref={navbarRef} className="absolute top-0 left-0 right-0 z-50">
      {/* Translucent glassmorphism bar */}
      <div className="w-full bg-black/20 backdrop-blur-md border-b border-white/[0.06]">
        <div className="center-container">
          <nav
            className="flex items-center justify-between"
            style={{ height: "clamp(2.75rem, 5vw, 3.5rem)" }}
          >

            {/* ── LEFT: Search capsule ──────────────────────────── */}
            <div className="flex items-center" style={{ flex: "1" }}>
              <div
                className="relative flex items-center rounded-full border border-white/10 bg-white/[0.06] overflow-hidden"
                role="search"
                style={{
                  height: "clamp(2rem, 3.5vw, 2.5rem)",
                  width: searchExpanded ? "clamp(200px, 28vw, 340px)" : "clamp(2rem, 3.5vw, 2.5rem)",
                  transition: "width var(--duration-search) var(--ease-cinematic), box-shadow var(--duration-normal) var(--ease-cinematic)",
                  boxShadow: searchExpanded ? "0 0 0 1px rgba(255,255,255,0.15)" : "none",
                }}
                onClick={!searchExpanded ? openSearch : undefined}
              >
                {/* Search icon — always visible, left-anchored */}
                <button
                  type="button"
                  onClick={searchExpanded ? handleSearch : openSearch}
                  aria-label={searchExpanded ? "Submit search" : "Open search"}
                  aria-expanded={searchExpanded}
                  className="flex-shrink-0 flex items-center justify-center text-white/50 hover:text-white transition-colors duration-fast cursor-pointer"
                  style={{
                    width: "clamp(2rem, 3.5vw, 2.5rem)",
                    height: "clamp(2rem, 3.5vw, 2.5rem)",
                  }}
                >
                  <SearchIcon sx={{ fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)" }} />
                </button>

                {/* Input — slides in when expanded */}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKey}
                  placeholder="Search films, people…"
                  aria-label="Search"
                  className="flex-1 min-w-0 bg-transparent text-white placeholder-white/30 outline-none font-body"
                  style={{
                    fontSize: "clamp(0.75rem, 1.2vw, 0.875rem)",
                    opacity: searchExpanded ? 1 : 0,
                    pointerEvents: searchExpanded ? "auto" : "none",
                    transition: "opacity 200ms ease",
                    paddingRight: searchExpanded ? "0.25rem" : 0,
                  }}
                />

                {/* Close button */}
                {searchExpanded && (
                  <button
                    type="button"
                    onClick={closeSearch}
                    aria-label="Close search"
                    className="flex-shrink-0 flex items-center justify-center text-white/30 hover:text-white/80 transition-colors duration-fast cursor-pointer"
                    style={{
                      width: "clamp(1.75rem, 3vw, 2.25rem)",
                      height: "clamp(2rem, 3.5vw, 2.5rem)",
                    }}
                  >
                    <CloseIcon sx={{ fontSize: "clamp(0.8rem, 1.3vw, 1rem)" }} />
                  </button>
                )}
              </div>
            </div>

            {/* ── CENTER: Wordmark ──────────────────────────────── */}
            <Link
              to="/"
              aria-label="CinemaScope home"
              className="flex-shrink-0 select-none absolute left-1/2 -translate-x-1/2 rounded-sm"
            >
              <span
                className="font-wordmark font-black italic text-white hover:text-white/80 transition-colors duration-fast tracking-tight"
                style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)" }}
              >
                CinemaScope
              </span>
            </Link>

            {/* ── RIGHT: Compare link + Avatar ──────────────────── */}
            <div className="flex items-center justify-end gap-3" style={{ flex: "1" }}>
              {/* Compare link — hidden on mobile to save space */}
              <Link
                to="/compare"
                className="hidden sm:block font-body text-white/40 hover:text-white transition-colors duration-fast cursor-pointer"
                style={{ fontSize: "clamp(0.6rem,0.9vw,0.75rem)" }}
                aria-label="Compare films"
              >
                Compare
              </Link>

              <Link
                to="/compare"
                className="sm:hidden flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-normal"
                style={{
                  width: "clamp(1.75rem, 3vw, 2.25rem)",
                  height: "clamp(1.75rem, 3vw, 2.25rem)",
                }}
                aria-label="Compare films"
              >
                <CompareArrowsOutlinedIcon sx={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)" }} />
              </Link>

              <Link
                to={isAuthenticated ? "/profile" : "/login"}
                aria-label={isAuthenticated ? "Go to profile" : "Sign in"}
                className="transition-all duration-normal hover:scale-105 active:scale-95 rounded-full"
              >
                {isAuthenticated && user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name || user.email || "Profile"}
                    className="rounded-full object-cover ring-2 ring-white/15 hover:ring-white/40 transition-all duration-normal"
                    style={{
                      width: "clamp(1.75rem, 3vw, 2.25rem)",
                      height: "clamp(1.75rem, 3vw, 2.25rem)",
                    }}
                  />
                ) : (
                  <div
                    className="rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-normal"
                    style={{
                      width: "clamp(1.75rem, 3vw, 2.25rem)",
                      height: "clamp(1.75rem, 3vw, 2.25rem)",
                    }}
                  >
                    <PersonOutlineIcon sx={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)" }} />
                  </div>
                )}
              </Link>
            </div>

          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
