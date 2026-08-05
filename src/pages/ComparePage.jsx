/**
 * ComparePage — compact side-by-side film comparison.
 *
 * Route: /compare?a=FILM_ID&b=FILM_ID
 */

import React, { Suspense, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StarIcon from "@mui/icons-material/Star";

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
  const debounceRef           = useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetcher(`/search/movie?query=${encodeURIComponent(q)}&page=1`);
        setResults((data.results || []).slice(0, 5));
      } catch { 
        setResults([]); 
      } finally { 
        setLoading(false); 
      }
    }, 300);
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
          sx={{ fontSize: "1rem" }}
          className="absolute left-3 text-white/40 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/[0.04] border border-white/10 focus:border-gold/50 focus:bg-white/[0.07] text-white placeholder-white/30 font-body rounded-card outline-none transition-all duration-normal"
          style={{ padding: "0.55rem 2.25rem 0.55rem 2.25rem", fontSize: "clamp(0.75rem,1vw,0.85rem)" }}
          aria-label={placeholder}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 text-white/40 hover:text-white cursor-pointer"
            aria-label="Clear search"
          >
            <CloseIcon sx={{ fontSize: "0.9rem" }} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-card border border-white/12 bg-[#121212] overflow-hidden shadow-2xl backdrop-blur-md"
          role="listbox"
        >
          {results.map((film) => (
            <button
              key={film.id}
              onClick={() => pick(film)}
              role="option"
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/8 transition-colors duration-fast cursor-pointer text-left border-b border-white/5 last:border-none"
            >
              <div className="flex-shrink-0 rounded overflow-hidden bg-surface" style={{ width: "1.75rem", height: "2.6rem" }}>
                {film.poster_path ? (
                  <img
                    src={posterUrl(film.poster_path, "w92")}
                    alt={film.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-[0.5rem] text-muted">N/A</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-white text-xs truncate">{film.title}</p>
                {film.release_date && (
                  <p className="font-mono text-muted text-[0.65rem]">
                    {film.release_date.slice(0, 4)}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-[#121212] border border-white/10 rounded-card z-50">
          <p className="font-mono text-muted text-xs text-center animate-pulse">Searching films…</p>
        </div>
      )}
    </div>
  );
};

/* ── Compact Film Card Header ───────────────────────────────────── */
const FilmCardHeader = ({ id, onClear }) => {
  const navigate = useNavigate();
  const { data: film } = useSWR(id ? `/movie/${id}` : null, fetcher, { suspense: true });

  if (!film) return null;

  const poster = posterUrl(film.poster_path, "w185") ?? "/fallback-image-film.jpg";
  const year   = film.release_date?.slice(0, 4) ?? "—";

  return (
    <div className="relative flex items-center gap-3.5 p-3 rounded-card bg-white/[0.03] border border-white/10 group">
      {/* Compact Poster */}
      <div 
        className="relative flex-shrink-0 overflow-hidden rounded shadow-md bg-surface cursor-pointer" 
        style={{ width: "clamp(60px, 8vw, 80px)", aspectRatio: "2/3" }}
        onClick={() => navigate(`/film/${film.id}`)}
      >
        <LazyImage src={poster} alt={film.title} fallbackType="poster" className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pr-6">
        <span className="font-mono text-gold text-[0.65rem] tracking-wider uppercase">{year}</span>
        <h3 
          className="font-display font-bold text-white text-sm sm:text-base leading-tight truncate cursor-pointer hover:text-gold transition-colors"
          onClick={() => navigate(`/film/${film.id}`)}
        >
          {film.title}
        </h3>
        {film.tagline && (
          <p className="font-body italic text-muted text-[0.7rem] truncate mt-0.5">
            "{film.tagline}"
          </p>
        )}
        <button
          onClick={() => navigate(`/film/${film.id}`)}
          className="inline-flex items-center gap-1 font-mono text-[0.65rem] text-gold/80 hover:text-gold mt-1.5 transition-colors cursor-pointer"
        >
          Details <OpenInNewIcon sx={{ fontSize: "0.7rem" }} />
        </button>
      </div>

      {/* Clear button */}
      <button
        onClick={onClear}
        aria-label={`Remove ${film.title}`}
        className="absolute top-2.5 right-2.5 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-all cursor-pointer"
        style={{ width: "1.5rem", height: "1.5rem" }}
      >
        <CloseIcon sx={{ fontSize: "0.85rem" }} />
      </button>
    </div>
  );
};

/* ── Main Page ──────────────────────────────────────────────────── */
const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idA = searchParams.get("a") || "";
  const idB = searchParams.get("b") || "";

  const { data: filmA } = useSWR(idA ? `/movie/${idA}` : null, fetcher);
  const { data: filmB } = useSWR(idB ? `/movie/${idB}` : null, fetcher);

  const setId = (key, id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set(key, id); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const swap = () => {
    const next = new URLSearchParams();
    if (idB) next.set("a", idB);
    if (idA) next.set("b", idA);
    setSearchParams(next, { replace: true });
  };

  // Helper metrics formatted
  const formatRating = (film) => film?.vote_average ? film.vote_average.toFixed(1) : "—";
  const formatRuntime = (film) => film?.runtime ? `${film.runtime} min` : "—";
  const formatGenres = (film) => film?.genres?.map(g => g.name).join(", ") || "—";
  const formatLanguage = (film) => film?.original_language ? film.original_language.toUpperCase() : "—";
  const formatVotes = (film) => film?.vote_count ? film.vote_count.toLocaleString() : "—";

  // Comparison metric row helper
  const MetricRow = ({ label, valA, valB, highlightA = false, highlightB = false }) => (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3 border-b border-white/6 text-xs sm:text-sm">
      <div className={`text-right font-body ${highlightA ? "text-gold font-semibold" : "text-white/80"}`}>
        {valA || "—"}
      </div>
      <div className="px-2 font-mono text-[0.65rem] text-muted uppercase tracking-widest text-center min-w-[70px] sm:min-w-[100px]">
        {label}
      </div>
      <div className={`text-left font-body ${highlightB ? "text-gold font-semibold" : "text-white/80"}`}>
        {valB || "—"}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <BackButton fallbackRoute="/" />

      <div
        className="flex-1 center-container w-full max-w-4xl mx-auto px-4"
        style={{ paddingTop: "clamp(4rem,7vh,5.5rem)", paddingBottom: "clamp(2rem,4vh,3rem)" }}
      >
        {/* Compact Header */}
        <div className="text-center" style={{ marginBottom: "clamp(1.5rem,3vh,2.5rem)" }}>
          <span className="font-mono text-gold text-xs uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 inline-block mb-2">
            Comparison Tool
          </span>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight">
            Film Showdown
          </h1>
          <p className="font-body text-muted text-xs sm:text-sm mt-1">
            Compare two movies side-by-side to discover key specs and differences.
          </p>
        </div>

        {/* Film Selection Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6">
          {/* Slot A */}
          <div className="w-full">
            {idA ? (
              <ErrorBoundary>
                <Suspense fallback={<div className="h-20 rounded-card bg-white/5 animate-pulse" />}>
                  <FilmCardHeader id={idA} onClear={() => setId("a", "")} />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <div className="p-3 rounded-card bg-white/[0.02] border border-dashed border-white/15 flex flex-col justify-center gap-2">
                <span className="font-mono text-muted text-[0.65rem] uppercase tracking-wider">Film A</span>
                <FilmSearch onSelect={(film) => setId("a", film.id)} placeholder="Select first film…" />
              </div>
            )}
          </div>

          {/* Swap / VS Badge */}
          <div className="flex justify-center my-1 md:my-0">
            {idA && idB ? (
              <button
                onClick={swap}
                className="flex items-center justify-center gap-1 w-9 h-9 rounded-full bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold transition-all duration-normal cursor-pointer hover:scale-105"
                title="Swap Films"
                aria-label="Swap films"
              >
                <SwapHorizIcon sx={{ fontSize: "1.2rem" }} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[0.65rem] font-bold text-muted">
                VS
              </div>
            )}
          </div>

          {/* Slot B */}
          <div className="w-full">
            {idB ? (
              <ErrorBoundary>
                <Suspense fallback={<div className="h-20 rounded-card bg-white/5 animate-pulse" />}>
                  <FilmCardHeader id={idB} onClear={() => setId("b", "")} />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <div className="p-3 rounded-card bg-white/[0.02] border border-dashed border-white/15 flex flex-col justify-center gap-2">
                <span className="font-mono text-muted text-[0.65rem] uppercase tracking-wider">Film B</span>
                <FilmSearch onSelect={(film) => setId("b", film.id)} placeholder="Select second film…" />
              </div>
            )}
          </div>
        </div>

        {/* Structured Comparison Metrics Table */}
        {(idA || idB) && (
          <div className="rounded-card bg-white/[0.02] border border-white/8 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted border-b border-white/10 pb-3 mb-2 text-center">
              Direct Specification Breakdown
            </h2>

            {/* Rating */}
            <MetricRow
              label="Rating"
              valA={filmA?.vote_average ? <span className="inline-flex items-center gap-1 font-mono font-bold"><StarIcon sx={{ fontSize: "0.9rem" }} /> {formatRating(filmA)} / 10</span> : null}
              valB={filmB?.vote_average ? <span className="inline-flex items-center gap-1 font-mono font-bold"><StarIcon sx={{ fontSize: "0.9rem" }} /> {formatRating(filmB)} / 10</span> : null}
              highlightA={filmA?.vote_average > filmB?.vote_average}
              highlightB={filmB?.vote_average > filmA?.vote_average}
            />

            {/* Votes Count */}
            <MetricRow
              label="Vote Count"
              valA={formatVotes(filmA)}
              valB={formatVotes(filmB)}
              highlightA={filmA?.vote_count > filmB?.vote_count}
              highlightB={filmB?.vote_count > filmA?.vote_count}
            />

            {/* Release Year */}
            <MetricRow
              label="Release Year"
              valA={filmA?.release_date?.slice(0, 4)}
              valB={filmB?.release_date?.slice(0, 4)}
            />

            {/* Runtime */}
            <MetricRow
              label="Runtime"
              valA={formatRuntime(filmA)}
              valB={formatRuntime(filmB)}
            />

            {/* Genres */}
            <MetricRow
              label="Genres"
              valA={formatGenres(filmA)}
              valB={formatGenres(filmB)}
            />

            {/* Language */}
            <MetricRow
              label="Language"
              valA={formatLanguage(filmA)}
              valB={formatLanguage(filmB)}
            />

            {/* Overview Comparison */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted text-center mb-3">
                Plot Overview
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded bg-white/[0.02] border border-white/5 text-xs text-white/70 leading-relaxed">
                  <p className="font-semibold text-white/90 mb-1">{filmA?.title || "Film A"}</p>
                  {filmA?.overview || <span className="italic text-muted">Select Film A to view overview</span>}
                </div>
                <div className="p-3 rounded bg-white/[0.02] border border-white/5 text-xs text-white/70 leading-relaxed">
                  <p className="font-semibold text-white/90 mb-1">{filmB?.title || "Film B"}</p>
                  {filmB?.overview || <span className="italic text-muted">Select Film B to view overview</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state helper if neither is selected */}
        {!idA && !idB && (
          <div className="text-center py-10">
            <p className="font-body text-muted text-sm">
              Use the search inputs above to select two films and start comparing.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ComparePage;
