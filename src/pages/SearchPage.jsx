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
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 1.5, -1, 2.5, -3, 0.5];

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center transition-all duration-slow overflow-hidden" style={{ gap: "clamp(1rem,2vw,1.5rem)" }}>
            {people.map((p, i) => {
              const rot = ROTATIONS[i % ROTATIONS.length];
              const imgSrc = p.profile_path ? `https://image.tmdb.org/t/p/w200${p.profile_path}` : null;
              
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/person/${p.id}`)}
                  className="cursor-pointer w-full max-w-[clamp(110px,14vw,160px)] mx-auto group"
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
                  <div className="bg-white/95 flex flex-col" style={{ padding: "clamp(6px,0.8vw,10px) clamp(6px,0.8vw,10px) clamp(18px,2.5vw,28px)", boxShadow: "3px 4px 14px rgba(0,0,0,0.35)", borderRadius: "2px" }}>
                    <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ borderRadius: "1px" }}>
                      {imgSrc ? (
                        <LazyImage src={imgSrc} alt={p.name} fallbackType="person" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full bg-[#ddd] flex items-center justify-center">
                          <PersonOutlineIcon sx={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#aaa" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ paddingTop: "clamp(6px,0.8vw,10px)" }}>
                      <p className="font-mono font-medium text-ink uppercase leading-tight line-clamp-1" style={{ fontSize: "clamp(0.45rem,0.7vw,0.6rem)", letterSpacing: "0.08em" }}>{p.name}</p>
                      {p.known_for_department && <p className="font-body text-ink-muted leading-tight line-clamp-1" style={{ fontSize: "clamp(0.4rem,0.6vw,0.5rem)", marginTop: "2px" }}>{p.known_for_department}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
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
        <div className="center-container">

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
