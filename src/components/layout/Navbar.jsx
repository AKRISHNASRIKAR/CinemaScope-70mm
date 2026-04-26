import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

const Header = () => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth0();
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
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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
                className="relative flex items-center rounded-full border border-white/10 bg-white/[0.06] overflow-hidden cursor-pointer"
                style={{
                  height: "clamp(2rem, 3.5vw, 2.5rem)",
                  width: searchExpanded ? "clamp(200px, 28vw, 340px)" : "clamp(2rem, 3.5vw, 2.5rem)",
                  transition: "width 350ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 200ms ease",
                  boxShadow: searchExpanded ? "0 0 0 1px rgba(255,255,255,0.15)" : "none",
                }}
                onClick={!searchExpanded ? openSearch : undefined}
              >
                {/* Search icon — always visible, left-anchored */}
                <button
                  onClick={searchExpanded ? handleSearch : openSearch}
                  aria-label={searchExpanded ? "Submit search" : "Open search"}
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
            <div
              onClick={() => navigate("/")}
              className="flex-shrink-0 cursor-pointer select-none absolute left-1/2 -translate-x-1/2"
            >
              <span
                className="font-wordmark font-black italic text-white hover:text-white/80 transition-colors duration-fast tracking-tight"
                style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)" }}
              >
                CinemaScope
              </span>
            </div>

            {/* ── RIGHT: Compare link + Avatar ──────────────────── */}
            <div className="flex items-center justify-end gap-3" style={{ flex: "1" }}>
              {/* Compare link — hidden on mobile to save space */}
              <button
                onClick={() => navigate("/compare")}
                className="hidden sm:block font-body text-white/40 hover:text-white transition-colors duration-fast cursor-pointer"
                style={{ fontSize: "clamp(0.6rem,0.9vw,0.75rem)" }}
                aria-label="Compare films"
              >
                Compare
              </button>

              <button
                onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
                aria-label={isAuthenticated ? "Go to profile" : "Sign in"}
                className="cursor-pointer transition-all duration-normal hover:scale-105 active:scale-95"
              >
                {isAuthenticated && user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
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
              </button>
            </div>

          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
