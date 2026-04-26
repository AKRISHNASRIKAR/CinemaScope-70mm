/**
 * ComparePage — side-by-side film comparison.
 *
 * Route: /compare?a=FILM_ID&b=FILM_ID
 *
 * Users can:
 *  - Search for two films using the inline search inputs
 *  - Compare poster, rating, runtime, genres, release year, overview
 *  - Navigate to either film's detail page
 *
 * Data: SWR + TMDB /movie/{id} endpoint (no new dependencies).
 * State: film IDs stored in URL search params so the comparison is shareable.
 */

import React, { Suspense, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import LazyImage from "@/components/ui/LazyImage";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { posterUrl } from "@/lib/utils/tmdbImage";

/* ── Inline film search ─────────────────────────────────────────── */
const FilmSearch = ({ onSelect, placeholder = "Search a film…" }) => {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef           = React.useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetcher(`/search/movie?query=${encodeURIComponent(q)}&page=1`);
        setResults((data.results || []).slice(0, 6));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
  }, []);

  const pick = (film) => {
    onSelect(film);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <SearchIcon
          sx={{ fontSize: "clamp(0.9rem,1.4vw,1.1rem)" }}
          className="absolute left-3 text-white/30 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface border border-white/10 focus:border-gold/40 focus:ring-1 focus:ring-gold/20 text-white placeholder-white/25 font-body rounded-card outline-none"
          style={{ padding: "0.6rem 2.5rem 0.6rem 2.25rem", fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}
          aria-label={placeholder}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 text-white/30 hover:text-white/70 cursor-pointer"
            aria-label="Clear search"
          >
            <CloseIcon sx={{ fontSize: "clamp(0.8rem,1.2vw,1rem)" }} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-card border border-white/10 bg-elevated overflow-hidden shadow-card-hover"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((film) => (
            <button
              key={film.id}
              onClick={() => pick(film)}
              role="option"
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors duration-fast cursor-pointer text-left"
              style={{ fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}
            >
              <div className="flex-shrink-0 rounded overflow-hidden bg-surface" style={{ width: "2rem", height: "3rem" }}>
                {film.poster_path ? (
                  <img
                    src={posterUrl(film.poster_path, "w92")}
                    alt={film.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-white line-clamp-1">{film.title}</p>
                {film.release_date && (
                  <p className="font-mono text-muted" style={{ fontSize: "clamp(0.55rem,0.85vw,0.65rem)" }}>
                    {film.release_date.slice(0, 4)}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <p className="absolute top-full left-0 mt-1 font-body text-muted" style={{ fontSize: "clamp(0.6rem,0.9vw,0.75rem)" }}>
          Searching…
        </p>
      )}
    </div>
  );
};

/* ── Single film column ─────────────────────────────────────────── */
const FilmColumn = ({ id, onClear }) => {
  const navigate = useNavigate();
  const { data: film } = useSWR(id ? `/movie/${id}` : null, fetcher, { suspense: true });

  if (!film) return null;

  const poster = posterUrl(film.poster_path, "w342") ?? "/fallback-image-film.jpg";
  const year   = film.release_date?.slice(0, 4) ?? "—";
  const genres = film.genres?.map((g) => g.name).join(", ") || "—";
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "—";
  const runtime = film.runtime ? `${film.runtime} min` : "—";

  return (
    <div className="flex flex-col" style={{ gap: "clamp(1rem,2vh,1.5rem)" }}>
      {/* Poster */}
      <div className="relative group">
        <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card-hover">
          <LazyImage src={poster} alt={film.title} fallbackType="poster" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-normal" />
        </div>
        {/* Clear button */}
        <button
          onClick={onClear}
          aria-label={`Remove ${film.title}`}
          className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-black/60 border border-white/10 text-white/60 hover:text-white hover:bg-black/80 transition-all duration-fast cursor-pointer opacity-0 group-hover:opacity-100"
          style={{ width: "1.75rem", height: "1.75rem" }}
        >
          <CloseIcon sx={{ fontSize: "0.85rem" }} />
        </button>
      </div>

      {/* Title */}
      <div style={{ minHeight: "clamp(2.5rem,5vh,3.5rem)" }}>
        <h2
          className="font-display font-bold text-white leading-tight tracking-tight"
          style={{ fontSize: "clamp(1.1rem,2vw,1.6rem)" }}
        >
          {film.title}
        </h2>
        {film.tagline && (
          <p className="font-body italic text-muted mt-1" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
            {film.tagline}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col" style={{ gap: "clamp(0.5rem,1vh,0.75rem)" }}>
        {[
          ["Rating",  <span className="text-gold font-semibold">{rating}</span>, "/ 10"],
          ["Year",    year],
          ["Runtime", runtime],
          ["Genres",  genres],
        ].map(([label, value, suffix]) => (
          <div key={label} className="flex items-baseline justify-between border-b border-white/6 pb-2">
            <span className="font-mono text-muted uppercase tracking-[0.12em]" style={{ fontSize: "clamp(0.5rem,0.75vw,0.6rem)" }}>
              {label}
            </span>
            <span className="font-body text-white/80 text-right ml-4" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
              {value}{suffix && <span className="text-muted ml-1">{suffix}</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Overview */}
      {film.overview && (
        <p className="font-body text-white/55 leading-relaxed line-clamp-4" style={{ fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}>
          {film.overview}
        </p>
      )}

      {/* View full page */}
      <button
        onClick={() => navigate(`/film/${film.id}`)}
        className="flex items-center gap-2 font-body font-medium text-gold border border-gold/30 hover:bg-gold/10 hover:border-gold/60 rounded-card transition-all duration-normal cursor-pointer self-start"
        style={{ padding: "0.6rem 1.25rem", fontSize: "clamp(0.65rem,1vw,0.8rem)" }}
      >
        View Full Page <OpenInNewIcon sx={{ fontSize: "0.85rem" }} />
      </button>
    </div>
  );
};

/* ── Empty slot ─────────────────────────────────────────────────── */
const EmptySlot = ({ label, onSelect }) => (
  <div className="flex flex-col" style={{ gap: "clamp(1rem,2vh,1.5rem)" }}>
    {/* Poster placeholder */}
    <div
      className="rounded-card aspect-[2/3] bg-surface border border-white/8 flex flex-col items-center justify-center"
      style={{ gap: "0.75rem" }}
    >
      <SearchIcon sx={{ fontSize: "clamp(1.5rem,3vw,2.5rem)", color: "rgba(255,255,255,0.12)" }} />
      <p className="font-body text-muted text-center px-4" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
        Search for a film to compare
      </p>
    </div>
    <FilmSearch onSelect={(film) => onSelect(film.id)} placeholder={label} />
  </div>
);

/* ── Main Page ──────────────────────────────────────────────────── */
const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idA = searchParams.get("a") || "";
  const idB = searchParams.get("b") || "";

  const setId = (key, id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set(key, id); else next.delete(key);
    setSearchParams(next);
  };

  const swap = () => {
    const next = new URLSearchParams();
    if (idB) next.set("a", idB);
    if (idA) next.set("b", idA);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <BackButton fallbackRoute="/" />

      <div
        className="flex-1 center-container px-4 sm:px-6 lg:px-12"
        style={{ paddingTop: "clamp(5rem,10vh,7rem)", paddingBottom: "clamp(2rem,4vh,3rem)" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "clamp(1.5rem,3vh,2.5rem)" }}>
          <p className="font-mono text-gold uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.5rem,0.8vw,0.65rem)", marginBottom: "0.4rem" }}>
            Compare
          </p>
          <h1 className="font-display font-bold text-white leading-none tracking-tight" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            Film Comparison
          </h1>
          <p className="font-body text-muted mt-2" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>
            Pick two films to compare side by side.
          </p>
        </div>

        {/* Swap button — only when both slots filled */}
        {idA && idB && (
          <div className="flex justify-center" style={{ padding: "clamp(1rem,2vh,1.5rem) 0" }}>
            <button
              onClick={swap}
              className="flex items-center gap-2 font-body font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-full transition-all duration-normal cursor-pointer"
              style={{ padding: "0.5rem 1.25rem", fontSize: "clamp(0.65rem,1vw,0.8rem)" }}
            >
              <SwapHorizIcon sx={{ fontSize: "1rem" }} /> Swap
            </button>
          </div>
        )}

        {/* Two-column comparison grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "clamp(1.5rem,4vw,3rem)" }}>
          {/* Column A */}
          {idA ? (
            <ErrorBoundary>
              <Suspense fallback={
                <div className="aspect-[2/3] rounded-card skeleton" />
              }>
                <FilmColumn id={idA} onClear={() => setId("a", "")} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <EmptySlot label="Search film A…" onSelect={(id) => setId("a", id)} />
          )}

          {/* Column B */}
          {idB ? (
            <ErrorBoundary>
              <Suspense fallback={
                <div className="aspect-[2/3] rounded-card skeleton" />
              }>
                <FilmColumn id={idB} onClear={() => setId("b", "")} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <EmptySlot label="Search film B…" onSelect={(id) => setId("b", id)} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ComparePage;
