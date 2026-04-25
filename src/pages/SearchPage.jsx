import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { FilmGridSkeleton } from "@/components/ui/Skeletons";

/* ── 1. Search Results Component (Data-driven) ─────────────────── */
const SearchResults = ({ term }) => {
  const navigate = useNavigate();
  const { data } = useSWR(term ? `/search/multi?query=${encodeURIComponent(term)}&page=1` : null, fetcher, { suspense: true });

  const results = data?.results || [];
  const movies = results.filter((r) => r.media_type === "movie");
  const people = results.filter((r) => r.media_type === "person");
  const totalResults = movies.length + people.length;

  if (totalResults === 0 && term) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <SearchOffIcon sx={{ fontSize: "clamp(3rem, 6vw, 5rem)", color: "rgba(255,255,255,0.12)" }} />
        <h2 className="font-display font-bold text-white/30 mt-4" style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>No results found for "{term}"</h2>
        <p className="font-body text-muted mt-2" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}>Try a different search term</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: "clamp(1.5rem, 3vh, 2rem)" }}>
        <h1 className="font-display font-bold text-white" style={{ fontSize: "clamp(1.3rem, 2.5vw, 2rem)" }}>Results for "{term}"</h1>
        <p className="font-body text-muted mt-1" style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>{totalResults} result{totalResults !== 1 ? "s" : ""} found</p>
      </div>

      {movies.length > 0 && (
        <section style={{ marginBottom: "clamp(2.5rem, 5vh, 4rem)" }}>
          <h2 className="font-display font-bold text-white/80" style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
            {movies.map((m) => (
              <div key={m.id} onClick={() => navigate(`/film/${m.id}`)} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
                  <LazyImage src={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null} alt={m.title} fallbackType="poster" className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105 group-hover:brightness-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-normal" />
                </div>
                <p className="font-body font-medium line-clamp-1 group-hover:text-gold transition-colors duration-fast mt-2" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}>{m.title}</p>
                <div className="flex items-center font-mono text-muted mt-1" style={{ gap: "clamp(0.3rem, 0.5vw, 0.4rem)", fontSize: "clamp(0.55rem, 0.85vw, 0.65rem)" }}>
                  {m.release_date && <span>{m.release_date.slice(0, 4)}</span>}
                  {m.vote_average > 0 && (
                    <>
                      {m.release_date && <span className="text-white/15">·</span>}
                      <span className="text-gold">⭐ {m.vote_average.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section style={{ marginBottom: "clamp(2.5rem, 5vh, 4rem)" }}>
          <h2 className="font-display font-bold text-white/80" style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>People</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
            {people.map((p) => (
              <div key={p.id} onClick={() => navigate(`/person/${p.id}`)} className="group cursor-pointer text-center">
                <div className="mx-auto overflow-hidden rounded-full bg-surface shadow-card aspect-square" style={{ width: "clamp(60px, 8vw, 100px)" }}>
                  <LazyImage src={p.profile_path ? `https://image.tmdb.org/t/p/w200${p.profile_path}` : null} alt={p.name} fallbackType="person" className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-110 group-hover:brightness-110" />
                </div>
                <p className="font-body font-medium line-clamp-1 group-hover:text-gold transition-colors duration-fast mt-2" style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>{p.name}</p>
                {p.known_for_department && <p className="font-mono text-muted uppercase tracking-[0.1em] text-[10px] mt-1">{p.known_for_department}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

/* ── Main Page Container ───────────────────────────────────────── */
const SearchPage = () => {
  const { query: routeQuery } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const initialQ = routeQuery?.replace(/-/g, " ") || searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [searchTerm, setSearchTerm] = useState(initialQ);

  const handleInputChange = (val) => {
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        setSearchTerm(val.trim());
        setSearchParams({ q: val.trim() });
      } else {
        setSearchTerm("");
        setSearchParams({});
      }
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      clearTimeout(debounceRef.current);
      setSearchTerm(inputValue.trim());
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchTerm("");
    setSearchParams({});
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <div className="flex-1" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>
        <div className="max-w-screen-xl mx-auto" style={{ padding: "0 clamp(1.5rem, 4vw, 4rem)" }}>

          <div className="max-w-2xl mx-auto" style={{ marginBottom: "clamp(2rem, 4vh, 3rem)" }}>
            <div className="relative flex items-center">
              <SearchIcon sx={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)" }} className="absolute text-white/30 left-4" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search films, actors, directors..."
                className="w-full bg-surface border border-white/10 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 text-white placeholder-white/25 font-body rounded-card outline-none px-12 py-4"
              />
              {inputValue && (
                <button onClick={clearSearch} className="absolute text-white/30 hover:text-white/70 right-4">
                  <CloseIcon sx={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)" }} />
                </button>
              )}
            </div>
          </div>

          {searchTerm ? (
            <ErrorBoundary>
              <Suspense fallback={<FilmGridSkeleton count={10} />}>
                <SearchResults term={searchTerm} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 opacity-40">
              <SearchIcon sx={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }} />
              <p className="font-body mt-4">Search for films, actors, and directors</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
