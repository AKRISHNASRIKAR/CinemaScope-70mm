import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import PersonCard from "@/components/ui/PersonCard";
import SEO from "@/components/seo/SEO";
import { FilmGridSkeleton } from "@/components/ui/Skeletons";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/* ── Search Results ─────────────────────────────── */
const SearchResults = ({ term }) => {
  const { data } = useSWR(term ? `/search/multi?query=${encodeURIComponent(term)}&page=1` : null, fetcher, { suspense: true });

  const { movies, people } = useMemo(() => ({
    movies: (data?.results || []).filter((r) => r.media_type === "movie"),
    people: (data?.results || []).filter((r) => r.media_type === "person"),
  }), [data?.results]);
  const totalResults = movies.length + people.length;

  if (totalResults === 0 && term) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <SearchOffIcon sx={{ fontSize: "clamp(3rem, 6vw, 5rem)", color: "rgba(255,255,255,0.12)" }} />
        <h2 className="font-display font-bold text-white/30 mt-4" style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>No results found for &quot;{term}&quot;</h2>
        <p className="font-body text-muted mt-2" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}>Try a different search term</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: "clamp(1.5rem, 3vh, 2rem)" }} aria-live="polite">
        <h1 className="font-display font-bold text-white" style={{ fontSize: "clamp(1.3rem, 2.5vw, 2rem)" }}>Results for &quot;{term}&quot;</h1>
        <p className="font-body text-muted mt-1" style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>{totalResults} result{totalResults !== 1 ? "s" : ""} found</p>
      </div>

      {movies.length > 0 && (
        <section aria-labelledby="search-movies-heading" style={{ marginBottom: "clamp(2.5rem, 5vh, 4rem)" }}>
          <h2 id="search-movies-heading" className="font-display font-bold text-white/80" style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>Movies</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
            {movies.map((m) => (
              <li key={m.id}>
                <FilmCard
                  film={m}
                  subtitle={[m.release_date?.slice(0, 4), m.vote_average > 0 ? `Rating ${m.vote_average.toFixed(1)}` : null].filter(Boolean).join(" · ")}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {people.length > 0 && (
        <section aria-labelledby="search-people-heading" style={{ marginBottom: "clamp(2.5rem, 5vh, 4rem)" }}>
          <h2 id="search-people-heading" className="font-display font-bold text-white/80" style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>People</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center transition-all duration-slow overflow-hidden" style={{ gap: "clamp(1rem,2vw,1.5rem)" }}>
            {people.map((p, i) => (
              <li key={p.id} className="w-full">
                <PersonCard person={p} subtitle={p.known_for_department} index={i} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};

/* ── Search Page ───────────────────────────────────────── */
const SearchPage = () => {
  const { query: routeQuery } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);

  const initialQ = routeQuery?.replace(/-/g, " ") || searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const debouncedInput = useDebouncedValue(inputValue, 500);

  useEffect(() => {
    const next = debouncedInput.trim();
    setSearchTerm(next);
    setSearchParams(next ? { q: next } : {}, { replace: true });
  }, [debouncedInput, setSearchParams]);

  const handleInputChange = useCallback((val) => {
    setInputValue(val);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const next = inputValue.trim();
    if (!next) return;
    setSearchTerm(next);
    setSearchParams({ q: next });
  }, [inputValue, setSearchParams]);

  const clearSearch = useCallback(() => {
    setInputValue("");
    setSearchTerm("");
    setSearchParams({});
    inputRef.current?.focus();
  }, [setSearchParams]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") clearSearch();
  }, [clearSearch]);

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <SEO
        title={searchTerm ? `Search results for ${searchTerm}` : "Search"}
        description={
          searchTerm
            ? `Search CinemaScope for films, actors, and directors matching ${searchTerm}.`
            : "Search CinemaScope for films, actors, directors, and cinematic recommendations."
        }
        canonicalPath={searchTerm ? `/search?q=${encodeURIComponent(searchTerm)}` : "/search"}
      />
      <div className="flex-1" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>
        <div className="center-container">

          <form
            role="search"
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto"
            style={{ marginBottom: "clamp(2rem, 4vh, 3rem)" }}
          >
            <div className="relative flex items-center">
              <SearchIcon sx={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)" }} className="absolute text-white/30 left-4" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search films, actors, directors..."
                aria-label="Search films, actors, and directors"
                className="w-full bg-surface border border-white/10 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 text-white placeholder-white/25 font-body rounded-card outline-none px-12 py-4"
              />
              {inputValue && (
                <button type="button" onClick={clearSearch} aria-label="Clear search" className="absolute text-white/30 hover:text-white/70 right-4">
                  <CloseIcon sx={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)" }} />
                </button>
              )}
            </div>
          </form>

          {searchTerm ? (
            <ErrorBoundary>
              <Suspense fallback={<FilmGridSkeleton count={10} />}>
                <SearchResults term={searchTerm} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 opacity-40">
              <p className="font-body mt-4 text-center">Search for films, actors, and directors</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
