import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MovieCreationOutlinedIcon from "@mui/icons-material/MovieCreationOutlined";

import { fetcher } from "@/lib/api/fetcher";
import { posterUrl, profileUrl } from "@/lib/utils/tmdbImage";

const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 6;

const Header = () => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const navbarRef = useRef(null);
  const searchWrapRef = useRef(null);

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
    setSuggestions([]);
    setSuggestOpen(false);
    setActiveIndex(-1);
  }, []);

  /* ── Debounced live suggestions ─────────────────────────────── */
  useEffect(() => {
    const q = searchQuery.trim();
    if (!searchExpanded || q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await fetcher(`/search/multi?query=${encodeURIComponent(q)}&page=1`);
        if (cancelled) return;
        const results = (data?.results || [])
          .filter((r) => r.media_type === "movie" || r.media_type === "person")
          .slice(0, MAX_SUGGESTIONS);
        setSuggestions(results);
        setSuggestOpen(results.length > 0);
        setActiveIndex(-1);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestOpen(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery, searchExpanded]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      closeSearch();
    }
  }, [searchQuery, navigate, closeSearch]);

  const goToSuggestion = useCallback((item) => {
    navigate(item.media_type === "person" ? `/person/${item.id}` : `/film/${item.id}`);
    closeSearch();
  }, [navigate, closeSearch]);

  const handleSearchKey = (e) => {
    if (e.key === "ArrowDown" && suggestOpen) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp" && suggestOpen) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter") {
      if (suggestOpen && activeIndex >= 0) goToSuggestion(suggestions[activeIndex]);
      else handleSearch();
      return;
    }
    if (e.key === "Escape") closeSearch();
  };

  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") closeSearch(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [closeSearch]);

  /* ── Close on outside click ─────────────────────────────────── */
  useEffect(() => {
    if (!searchExpanded) return;
    const onDown = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) closeSearch();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [searchExpanded, closeSearch]);

  return (
    <header ref={navbarRef} className="absolute top-0 left-0 right-0 z-50">
      {/* Translucent glassmorphism bar */}
      <div className="w-full bg-black/20 backdrop-blur-md border-b border-white/[0.06]">
        <div className="center-container">
          <nav
            className="flex items-center justify-between"
            style={{ height: "clamp(2.75rem, 5vw, 3.5rem)" }}
          >

            {/* ── LEFT: Search capsule + suggestions ────────────── */}
            <div className="flex items-center" style={{ flex: "1" }}>
              <div ref={searchWrapRef} className="relative">
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
                    role="combobox"
                    aria-expanded={suggestOpen}
                    aria-controls="navbar-search-suggestions"
                    aria-autocomplete="list"
                    aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
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

                {/* ── Suggestions dropdown ──────────────────────── */}
                {searchExpanded && suggestOpen && (
                  <ul
                    id="navbar-search-suggestions"
                    role="listbox"
                    aria-label="Search suggestions"
                    className="absolute left-0 rounded-card border border-white/10 bg-elevated/95 backdrop-blur-md overflow-hidden"
                    style={{
                      top: "calc(100% + 0.5rem)",
                      width: "clamp(240px, 32vw, 380px)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.75)",
                      zIndex: 60,
                    }}
                  >
                    {suggestions.map((item, i) => {
                      const isPerson = item.media_type === "person";
                      const img = isPerson
                        ? profileUrl(item.profile_path, "w92")
                        : posterUrl(item.poster_path, "w92");
                      const sub = isPerson
                        ? item.known_for_department || "Person"
                        : item.release_date
                          ? item.release_date.slice(0, 4)
                          : "Film";

                      return (
                        <li
                          key={`${item.media_type}-${item.id}`}
                          id={`suggestion-${i}`}
                          role="option"
                          aria-selected={i === activeIndex}
                          onMouseEnter={() => setActiveIndex(i)}
                          onMouseDown={(e) => { e.preventDefault(); goToSuggestion(item); }}
                          className="flex items-center cursor-pointer transition-colors duration-fast"
                          style={{
                            gap: "clamp(0.5rem, 1vw, 0.75rem)",
                            padding: "clamp(0.4rem, 0.8vw, 0.6rem) clamp(0.6rem, 1.2vw, 0.9rem)",
                            background: i === activeIndex ? "rgba(255,255,255,0.07)" : "transparent",
                          }}
                        >
                          <div
                            className="flex-shrink-0 overflow-hidden rounded-card bg-surface flex items-center justify-center"
                            style={{ width: "clamp(1.75rem, 2.6vw, 2.25rem)", height: "clamp(2.5rem, 3.9vw, 3.35rem)" }}
                          >
                            {img ? (
                              <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : isPerson ? (
                              <PersonOutlineIcon sx={{ fontSize: "1rem", color: "rgba(255,255,255,0.2)" }} />
                            ) : (
                              <MovieCreationOutlinedIcon sx={{ fontSize: "1rem", color: "rgba(255,255,255,0.2)" }} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="font-body font-medium text-white/90 line-clamp-1"
                              style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}
                            >
                              {item.title || item.name}
                            </p>
                            <p
                              className="font-mono text-muted line-clamp-1"
                              style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.65rem)", marginTop: "2px" }}
                            >
                              {isPerson ? "Person" : "Film"} · {sub}
                            </p>
                          </div>

                          {!isPerson && item.vote_average > 0 && (
                            <span
                              className="font-mono text-gold flex-shrink-0"
                              style={{ fontSize: "clamp(0.55rem, 0.85vw, 0.7rem)" }}
                            >
                              {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </li>
                      );
                    })}

                    <li
                      onMouseDown={(e) => { e.preventDefault(); handleSearch(); }}
                      className="cursor-pointer border-t border-white/[0.06] text-center font-body text-muted hover:text-gold transition-colors duration-fast"
                      style={{
                        padding: "clamp(0.4rem, 0.8vw, 0.6rem)",
                        fontSize: "clamp(0.55rem, 0.85vw, 0.7rem)",
                      }}
                    >
                      See all results for “{searchQuery.trim()}”
                    </li>
                  </ul>
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
              <button
                onClick={() => navigate("/compare")}
                className="font-body text-white/40 hover:text-white transition-colors duration-fast cursor-pointer"
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
