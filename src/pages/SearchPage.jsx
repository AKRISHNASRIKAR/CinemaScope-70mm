import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { SearchResultsSkeleton } from "@/components/ui/Skeletons";
import { posterUrl, profileUrl } from "@/lib/utils/tmdbImage";
import { GENRE_MAP } from "@/lib/constants";

/* Polaroid tilt angles — kept intentionally irregular */
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 1.5, -1, 2.5, -3, 0.5];

/* ── Movie result — horizontal list card ─────────────────────────── */
const MovieRow = ({ film }) => {
  const navigate = useNavigate();
  const go = () => navigate(`/film/${film.id}`);
  const genres = (film.genre_ids || []).map((g) => GENRE_MAP[g]).filter(Boolean).slice(0, 3);

  return (
    <div
      onClick={go}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }}
      role="button"
      tabIndex={0}
      aria-label={film.title}
      className="group flex items-stretch cursor-pointer rounded-card border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-gold/30 transition-all duration-normal outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      style={{ gap: "clamp(0.75rem, 1.6vw, 1.25rem)", padding: "clamp(0.5rem, 1vw, 0.75rem)" }}
    >
      {/* Poster thumbnail */}
      <div
        className="flex-shrink-0 relative overflow-hidden rounded-card bg-surface"
        style={{ width: "clamp(58px, 8vw, 92px)", aspectRatio: "2 / 3" }}
      >
        <LazyImage
          src={posterUrl(film.poster_path, "w185")}
          alt={film.title}
          fallbackType="poster"
          className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105"
        />
      </div>

      {/* Metadata */}
      <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ gap: "clamp(0.25rem, 0.6vh, 0.45rem)" }}>
        <div className="flex items-baseline flex-wrap" style={{ gap: "clamp(0.35rem, 0.8vw, 0.6rem)" }}>
          <h3
            className="font-display font-bold text-white group-hover:text-gold transition-colors duration-fast line-clamp-1"
            style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.25rem)" }}
          >
            {film.title}
          </h3>
          {film.release_date && (
            <span className="font-mono text-muted" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)" }}>
              {film.release_date.slice(0, 4)}
            </span>
          )}
          {film.vote_average > 0 && (
            <span className="font-mono text-gold" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)" }}>
              ★ {film.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        {genres.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: "clamp(0.25rem, 0.5vw, 0.4rem)" }}>
            {genres.map((g) => (
              <span
                key={g}
                className="font-mono uppercase text-white/45 border border-white/10 rounded-full"
                style={{
                  fontSize: "clamp(0.45rem, 0.7vw, 0.6rem)",
                  letterSpacing: "0.1em",
                  padding: "0.15rem 0.5rem",
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {film.overview && (
          <p
            className="font-body text-white/40 leading-snug line-clamp-2"
            style={{ fontSize: "clamp(0.6rem, 0.95vw, 0.78rem)" }}
          >
            {film.overview}
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Person result — polaroid (kept from the original design) ────── */
const PersonPolaroid = ({ person, index }) => {
  const navigate = useNavigate();
  const rot = ROTATIONS[index % ROTATIONS.length];
  const go = () => navigate(`/person/${person.id}`);
  const imgSrc = profileUrl(person.profile_path, "w185");

  return (
    <div
      onClick={go}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }}
      role="button"
      tabIndex={0}
      aria-label={person.name}
      className="cursor-pointer w-full outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      style={{ transform: `rotate(${rot}deg)`, transition: "transform 200ms ease, box-shadow 200ms ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "rotate(0deg) translateY(-4px)";
        e.currentTarget.style.boxShadow = "4px 6px 20px rgba(0,0,0,0.55)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rot}deg)`;
        e.currentTarget.style.boxShadow = "3px 4px 14px rgba(0,0,0,0.35)";
      }}
    >
      <div
        className="bg-white/95 flex flex-col"
        style={{
          padding: "clamp(6px,0.8vw,10px) clamp(6px,0.8vw,10px) clamp(18px,2.5vw,28px)",
          boxShadow: "3px 4px 14px rgba(0,0,0,0.35)",
          borderRadius: "2px",
        }}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ borderRadius: "1px" }}>
          {imgSrc ? (
            <LazyImage src={imgSrc} alt={person.name} fallbackType="person" className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-[#ddd] flex items-center justify-center">
              <PersonOutlineIcon sx={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#aaa" }} />
            </div>
          )}
        </div>
        <div style={{ paddingTop: "clamp(6px,0.8vw,10px)" }}>
          <p
            className="font-mono font-medium text-ink uppercase leading-tight line-clamp-1"
            style={{ fontSize: "clamp(0.45rem,0.7vw,0.6rem)", letterSpacing: "0.08em" }}
          >
            {person.name}
          </p>
          {person.known_for_department && (
            <p
              className="font-body text-ink-muted leading-tight line-clamp-1"
              style={{ fontSize: "clamp(0.4rem,0.6vw,0.5rem)", marginTop: "2px" }}
            >
              {person.known_for_department}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Column heading ──────────────────────────────────────────────── */
const ColumnHeading = ({ label, count }) => (
  <div
    className="flex items-baseline border-b border-white/[0.08]"
    style={{ gap: "0.6rem", paddingBottom: "clamp(0.5rem,1vh,0.75rem)", marginBottom: "clamp(0.85rem,1.8vh,1.25rem)" }}
  >
    <h2
      className="font-display font-bold text-white"
      style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)" }}
    >
      {label}
    </h2>
    <span className="font-mono text-muted" style={{ fontSize: "clamp(0.55rem, 0.85vw, 0.7rem)" }}>
      {count}
    </span>
  </div>
);

/* ── Search Results ──────────────────────────────────────────────── */
const SearchResults = ({ term }) => {
  const { data } = useSWR(
    term ? `/search/multi?query=${encodeURIComponent(term)}&page=1` : null,
    fetcher,
    { suspense: true }
  );

  const results = data?.results || [];
  const movies = results.filter((r) => r.media_type === "movie");
  const people = results.filter((r) => r.media_type === "person");

  if (movies.length + people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ padding: "clamp(3rem, 10vh, 6rem) 0" }}>
        <SearchOffIcon sx={{ fontSize: "clamp(3rem, 6vw, 5rem)", color: "rgba(255,255,255,0.12)" }} />
        <h2 className="font-display font-bold text-white/30" style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", marginTop: "1rem" }}>
          Nothing found for “{term}”
        </h2>
        <p className="font-body text-muted" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)", marginTop: "0.5rem" }}>
          Try a different title, actor, or director
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start" style={{ gap: "clamp(1.5rem, 4vw, 3.5rem)" }}>
      {/* MAIN: films */}
      {movies.length > 0 && (
        <section style={{ flex: "3 1 clamp(300px, 45vw, 620px)", minWidth: 0 }}>
          <ColumnHeading label="Films" count={`${movies.length} result${movies.length !== 1 ? "s" : ""}`} />
          <div className="flex flex-col" style={{ gap: "clamp(0.5rem, 1.2vh, 0.85rem)" }}>
            {movies.map((m) => <MovieRow key={m.id} film={m} />)}
          </div>
        </section>
      )}

      {/* ASIDE: people */}
      {people.length > 0 && (
        <aside style={{ flex: "1 1 clamp(240px, 24vw, 320px)", minWidth: 0 }}>
          <ColumnHeading label="People" count={`${people.length} result${people.length !== 1 ? "s" : ""}`} />
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(clamp(96px, 12vw, 132px), 1fr))",
              gap: "clamp(0.9rem, 2vw, 1.4rem)",
            }}
          >
            {people.map((p, i) => <PersonPolaroid key={p.id} person={p} index={i} />)}
          </div>
        </aside>
      )}
    </div>
  );
};

/* ── Empty / idle state ──────────────────────────────────────────── */
const IdleState = () => (
  <div className="flex flex-col items-center justify-center text-center" style={{ padding: "clamp(3rem, 12vh, 7rem) 0" }}>
    <LocalMoviesIcon
      sx={{ fontSize: "clamp(3.5rem, 8vw, 6rem)", color: "rgba(201,168,67,0.18)" }}
      style={{ animation: "spin 9s linear infinite" }}
    />
    <h2 className="font-display font-bold text-white/40" style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)", marginTop: "clamp(1rem, 2vh, 1.5rem)" }}>
      Search the archive
    </h2>
    <p className="font-body text-muted" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)", marginTop: "0.5rem", maxWidth: "34ch" }}>
      Films, actors and directors — start typing and results appear as you go.
    </p>
  </div>
);

/* ── Search Page ─────────────────────────────────────────────────── */
const SearchPage = () => {
  const { query: routeQuery } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const sentinelRef = useRef(null);

  const initialQ = routeQuery?.replace(/-/g, " ") || searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [stuck, setStuck] = useState(false);

  /* Detect when the search bar has pinned to the top of the viewport */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const commit = (val) => {
    const q = val.trim();
    setSearchTerm(q);
    setSearchParams(q ? { q } : {});
  };

  const handleInputChange = (val) => {
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(val), 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      clearTimeout(debounceRef.current);
      commit(inputValue);
    }
  };

  const clearSearch = () => {
    clearTimeout(debounceRef.current);
    setInputValue("");
    commit("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      {/* ── Cinematic header ──────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{ paddingTop: "clamp(5rem, 11vh, 8rem)" }}>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(120% 80% at 50% 0%, rgba(201,168,67,0.10) 0%, rgba(9,9,9,0) 65%)" }}
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

        <div className="center-container relative" style={{ paddingBottom: "clamp(1rem, 2.5vh, 1.75rem)" }}>
          <p
            className="font-mono text-gold uppercase"
            style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.68rem)", letterSpacing: "0.32em" }}
          >
            Discover
          </p>
          <h1
            className="font-display font-bold text-white leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)", marginTop: "clamp(0.4rem, 1vh, 0.75rem)" }}
          >
            {searchTerm ? `“${searchTerm}”` : "Find your next film"}
          </h1>
        </div>
      </header>

      {/* Sentinel — tells us when the bar below has pinned */}
      <div ref={sentinelRef} aria-hidden style={{ height: "1px" }} />

      {/* ── Sticky search bar ─────────────────────────────────── */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: stuck ? "rgba(9,9,9,0.85)" : "transparent",
          backdropFilter: stuck ? "blur(12px)" : "none",
          borderBottom: stuck ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          transition: "background 250ms ease, border-color 250ms ease",
        }}
      >
        <div className="center-container" style={{ paddingTop: "clamp(0.6rem, 1.5vh, 1rem)", paddingBottom: "clamp(0.6rem, 1.5vh, 1rem)" }}>
          <div className="relative flex items-center">
            <SearchIcon
              sx={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)" }}
              className="absolute text-white/30 pointer-events-none"
              style={{ left: "clamp(0.9rem, 1.8vw, 1.25rem)" }}
            />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search films, actors, directors…"
              aria-label="Search films, actors and directors"
              className="w-full bg-surface border border-white/10 focus:border-gold/50 text-white placeholder-white/25 font-body rounded-full outline-none transition-colors duration-normal"
              style={{
                fontSize: "clamp(0.8rem, 1.3vw, 1rem)",
                padding: "clamp(0.7rem, 1.6vh, 1.05rem) clamp(2.6rem, 4.5vw, 3.25rem)",
              }}
            />
            {inputValue && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute text-white/30 hover:text-white/70 transition-colors duration-fast cursor-pointer"
                style={{ right: "clamp(0.9rem, 1.8vw, 1.25rem)" }}
              >
                <CloseIcon sx={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)" }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      <div className="flex-1 center-container" style={{ paddingTop: "clamp(1rem, 3vh, 2rem)", paddingBottom: "clamp(3rem, 8vh, 5rem)" }}>
        {searchTerm ? (
          <ErrorBoundary>
            <Suspense fallback={<SearchResultsSkeleton />}>
              <SearchResults term={searchTerm} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <IdleState />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SearchPage;
