import { useState, useRef, useEffect, useCallback } from "react";
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
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="flex items-center justify-between px-[clamp(1rem,4vw,3rem)] py-[clamp(1rem,2.5vw,1.5rem)] bg-black/15 backdrop-blur-navbar">

        {/* ── Spacer left (balances right cluster) ─── */}
        <div className="w-[clamp(3rem,8vw,6rem)]" />

        {/* ── Logo center ─── */}
        <div
          onClick={() => navigate("/")}
          className="cursor-pointer select-none absolute left-1/2 -translate-x-1/2"
        >
          <span
            className="font-display font-bold text-white tracking-[0.04em]"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            CinemaScope
          </span>
        </div>

        {/* ── Right cluster: Search + Avatar ─── */}
        <div className="flex items-center gap-[clamp(0.5rem,1.5vw,1rem)]">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div
              className={`overflow-hidden transition-[width,opacity] ease-cinematic duration-search ${searchExpanded ? "w-[clamp(8rem,20vw,14rem)] opacity-100" : "w-0 opacity-0"}`}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Search films, people…"
                className="w-full bg-transparent border-b border-white/35 focus:border-white/80 text-white placeholder-white/35 pb-1 font-body outline-none transition-colors duration-normal"
                style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)" }}
              />
            </div>
            <button
              onClick={searchExpanded ? (searchQuery ? handleSearch : closeSearch) : openSearch}
              aria-label={searchExpanded ? "Close search" : "Open search"}
              className="text-white/50 hover:text-white transition-colors duration-fast cursor-pointer p-1"
            >
              {searchExpanded
                ? <CloseIcon sx={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }} />
                : <SearchIcon sx={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }} />}
            </button>
          </div>

          {/* Avatar */}
          <button
            onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
            className="flex-shrink-0 cursor-pointer"
          >
            {isAuthenticated && user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="rounded-full object-cover ring-1 ring-white/20 hover:ring-white/50 transition-all duration-normal"
                style={{ width: "clamp(1.75rem, 3vw, 2.25rem)", height: "clamp(1.75rem, 3vw, 2.25rem)" }}
              />
            ) : (
              <div
                className="rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/15 hover:ring-white/40 transition-all duration-normal"
                style={{ width: "clamp(1.75rem, 3vw, 2.25rem)", height: "clamp(1.75rem, 3vw, 2.25rem)" }}
              >
                <PersonOutlineIcon sx={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)", color: "rgba(255,255,255,0.45)" }} />
              </div>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
