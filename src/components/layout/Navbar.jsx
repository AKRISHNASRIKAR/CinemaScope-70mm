import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { logoURL } from "@/lib/constants";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

const NAV_LINKS = ["MOVIES", "TV", "AT HOME", "CORPORATE"];

const Header = () => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth0();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  /* ── Search handlers ─────────────────────────────────────────── */
  const openSearch = () => {
    setSearchExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 20);
  };

  const closeSearch = useCallback(() => {
    setSearchExpanded(false);
    setSearchQuery("");
  }, []);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search/${q.split(" ").join("-")}`);
      closeSearch();
    }
  }, [searchQuery, navigate, closeSearch]);

  const handleSearchKey = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") closeSearch();
  };

  /* ── ESC anywhere collapses search ──────────────────────────── */
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        closeSearch();
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [closeSearch]);

  /* ── Click-outside closes profile menu ──────────────────────── */
  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="
          flex items-center justify-between
          px-8 md:px-12 py-4
          bg-black/15 backdrop-blur-md
          shadow-navbar
        "
      >
        {/* ── Logo ────────────────────────────────────────────── */}
        <div
          onClick={() => navigate("/")}
          className="cursor-pointer flex-shrink-0"
        >
          <img
            src={logoURL}
            alt="CinemaScope"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* ── Center nav links (desktop) ───────────────────────── */}
        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <button
              key={link}
              className="
                font-body font-medium uppercase
                tracking-[0.18em] text-nav
                text-white/60 hover:text-white
                transition-colors duration-normal
                cursor-pointer bg-transparent border-none
              "
            >
              {link}
            </button>
          ))}
        </div>

        {/* ── Right: Search + Profile ──────────────────────────── */}
        <div className="flex items-center gap-3">

          {/* Search row */}
          <div className="flex items-center gap-2">
            {/* Expandable input */}
            <div
              className={`
                overflow-hidden transition-[width,opacity]
                ease-cinematic duration-search
                ${searchExpanded ? "w-44 opacity-100" : "w-0 opacity-0"}
              `}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Search films, people…"
                className="
                  w-full bg-transparent
                  border-b border-white/35 focus:border-white/80
                  text-white text-sm placeholder-white/35
                  pb-1 font-body
                  outline-none transition-colors duration-normal
                "
              />
            </div>

            {/* Search / Close icon */}
            <button
              onClick={searchExpanded ? (searchQuery ? handleSearch : closeSearch) : openSearch}
              aria-label={searchExpanded ? "Close search" : "Open search"}
              className="
                text-white/60 hover:text-white
                transition-colors duration-fast p-1
                cursor-pointer
              "
            >
              {searchExpanded
                ? <CloseIcon sx={{ fontSize: 18 }} />
                : <SearchIcon sx={{ fontSize: 18 }} />
              }
            </button>
          </div>

          {/* Profile avatar */}
          {isAuthenticated && (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  className="
                    w-8 h-8 rounded-circle object-cover
                    ring-1 ring-white/20 group-hover:ring-white/60
                    transition-all duration-normal
                  "
                />
              </button>

              {/* Dropdown */}
              {isProfileMenuOpen && (
                <div
                  className="
                    absolute right-0 top-full mt-3
                    w-36 bg-elevated rounded-card
                    shadow-card border border-border
                    overflow-hidden z-50
                  "
                >
                  <button
                    onClick={() => { navigate("/profile"); setIsProfileMenuOpen(false); }}
                    className="
                      w-full text-left px-4 py-2.5
                      text-caption text-white/75 hover:text-white
                      hover:bg-white/5 transition-colors duration-fast
                      font-body
                    "
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { logout({ returnTo: window.location.origin }); setIsProfileMenuOpen(false); }}
                    className="
                      w-full text-left px-4 py-2.5
                      text-caption text-white/75 hover:text-white
                      hover:bg-white/5 transition-colors duration-fast
                      border-t border-border font-body
                    "
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sign in (unauthenticated) */}
          {!isAuthenticated && (
            <button
              onClick={() => navigate("/login")}
              className="
                font-body font-medium uppercase
                tracking-[0.15em] text-nav
                text-white/60 hover:text-white
                transition-colors duration-normal
              "
            >
              SIGN IN
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
