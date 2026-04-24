import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import Footer from "@/components/layout/Footer";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_KEY  = import.meta.env.VITE_API_KEY;

/* ── Skeleton ─── */
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-[2/3] rounded-card bg-white/5" />
    <div className="h-3 rounded bg-white/5 mt-3 w-3/4" />
    <div className="h-2 rounded bg-white/5 mt-1.5 w-1/2" />
  </div>
);

const SkeletonPerson = () => (
  <div className="animate-pulse flex flex-col items-center">
    <div className="rounded-full bg-white/5" style={{ width: "clamp(60px, 8vw, 100px)", height: "clamp(60px, 8vw, 100px)" }} />
    <div className="h-3 rounded bg-white/5 mt-3 w-3/4" />
    <div className="h-2 rounded bg-white/5 mt-1.5 w-1/2" />
  </div>
);

/* ── Page ─── */
const SearchPage = () => {
  const { query: routeQuery } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Resolve initial query from route param, then ?q= param
  const initialQ = routeQuery?.replace(/-/g, " ") || searchParams.get("q") || "";

  const [inputValue, setInputValue]   = useState(initialQ);
  const [searchTerm, setSearchTerm]   = useState(initialQ);
  const [movies, setMovies]           = useState([]);
  const [people, setPeople]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError]             = useState(null);

  /* ── Fetch from TMDB /search/multi ─── */
  const runSearch = useCallback(async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(term)}&page=1`
      );
      const results = res.data.results || [];
      setMovies(results.filter((r) => r.media_type === "movie"));
      setPeople(results.filter((r) => r.media_type === "person"));
    } catch (e) {
      setError("Something went wrong. Try again.");
      setMovies([]);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Run on mount if query exists ─── */
  useEffect(() => {
    if (initialQ) runSearch(initialQ);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Debounced search on typing ─── */
  const handleInputChange = (val) => {
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        setSearchTerm(val.trim());
        setSearchParams({ q: val.trim() });
        runSearch(val.trim());
      }
    }, 500);
  };

  /* ── Enter key ─── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      clearTimeout(debounceRef.current);
      setSearchTerm(inputValue.trim());
      setSearchParams({ q: inputValue.trim() });
      runSearch(inputValue.trim());
    }
  };

  /* ── Clear ─── */
  const clearSearch = () => {
    setInputValue("");
    setSearchTerm("");
    setMovies([]);
    setPeople([]);
    setHasSearched(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  const totalResults = movies.length + people.length;

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <div className="flex-1" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>
        <div className="max-w-screen-xl mx-auto" style={{ padding: "0 clamp(1.5rem, 4vw, 4rem)" }}>

          {/* ══════════════════════════════════════
              SEARCH BAR
          ══════════════════════════════════════ */}
          <div className="max-w-2xl mx-auto" style={{ marginBottom: "clamp(2rem, 4vh, 3rem)" }}>
            <div className="relative flex items-center">
              {/* Icon */}
              <SearchIcon
                sx={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)" }}
                className="absolute text-white/30"
                style={{ left: "clamp(0.75rem, 1.5vw, 1rem)" }}
              />
              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search films, actors, directors..."
                className="
                  w-full bg-surface border border-white/10
                  focus:border-gold/50 focus:ring-1 focus:ring-gold/20
                  text-white placeholder-white/25
                  font-body rounded-card outline-none
                  transition-all duration-normal
                "
                style={{
                  fontSize: "clamp(0.9rem, 1.8vw, 1.15rem)",
                  padding: "clamp(0.75rem, 1.5vh, 1rem) clamp(2.5rem, 4vw, 3rem)",
                }}
              />
              {/* Clear button */}
              {inputValue && (
                <button
                  onClick={clearSearch}
                  className="absolute text-white/30 hover:text-white/70 transition-colors duration-fast cursor-pointer"
                  style={{ right: "clamp(0.75rem, 1.5vw, 1rem)" }}
                >
                  <CloseIcon sx={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)" }} />
                </button>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════
              RESULTS
          ══════════════════════════════════════ */}

          {/* Loading */}
          {loading && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
                {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="font-body text-red-400" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>{error}</p>
              <button
                onClick={() => runSearch(searchTerm)}
                className="mt-4 font-body font-medium text-gold border border-gold/40 hover:bg-gold/10 rounded-card transition-colors duration-normal cursor-pointer"
                style={{ padding: "clamp(0.4rem, 0.8vh, 0.6rem) clamp(1rem, 2vw, 1.5rem)", fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && !error && hasSearched && (
            <>
              {/* Header */}
              <div style={{ marginBottom: "clamp(1.5rem, 3vh, 2rem)" }}>
                <h1 className="font-display font-bold text-white" style={{ fontSize: "clamp(1.3rem, 2.5vw, 2rem)" }}>
                  Results for "{searchTerm}"
                </h1>
                <p className="font-body text-muted mt-1" style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>
                  {totalResults} result{totalResults !== 1 ? "s" : ""} found
                </p>
              </div>

              {/* Movies */}
              {movies.length > 0 && (
                <section style={{ marginBottom: "clamp(2.5rem, 5vh, 4rem)" }}>
                  <h2 className="font-display font-bold text-white/80" style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>Movies</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
                    {movies.map((m) => (
                      <div key={m.id} onClick={() => navigate(`/film/${m.id}`)} className="group cursor-pointer">
                        <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
                          <img
                            src={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "/fallback-image-film.jpg"}
                            alt={m.title} loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105 group-hover:brightness-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-normal" />
                        </div>
                        <p className="font-body font-medium line-clamp-1 group-hover:text-gold transition-colors duration-fast" style={{ marginTop: "clamp(0.4rem, 0.8vh, 0.6rem)", fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}>
                          {m.title}
                        </p>
                        <div className="flex items-center font-mono text-muted" style={{ gap: "clamp(0.3rem, 0.5vw, 0.4rem)", marginTop: "2px", fontSize: "clamp(0.55rem, 0.85vw, 0.65rem)" }}>
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

              {/* People */}
              {people.length > 0 && (
                <section style={{ marginBottom: "clamp(2.5rem, 5vh, 4rem)" }}>
                  <h2 className="font-display font-bold text-white/80" style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>People</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
                    {people.map((p) => (
                      <div key={p.id} onClick={() => navigate(`/person/${p.id}`)} className="group cursor-pointer text-center">
                        <div className="mx-auto overflow-hidden rounded-full bg-surface shadow-card aspect-square" style={{ width: "clamp(60px, 8vw, 100px)" }}>
                          <img
                            src={p.profile_path ? `https://image.tmdb.org/t/p/w200${p.profile_path}` : "/fallback-image.jpg"}
                            alt={p.name} loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-110 group-hover:brightness-110"
                          />
                        </div>
                        <p className="font-body font-medium line-clamp-1 group-hover:text-gold transition-colors duration-fast" style={{ marginTop: "clamp(0.4rem, 0.8vh, 0.6rem)", fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>
                          {p.name}
                        </p>
                        {p.known_for_department && (
                          <p className="font-mono text-muted uppercase tracking-[0.1em]" style={{ fontSize: "clamp(0.45rem, 0.7vw, 0.55rem)", marginTop: "2px" }}>
                            {p.known_for_department}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Empty */}
              {totalResults === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <SearchOffIcon sx={{ fontSize: "clamp(3rem, 6vw, 5rem)", color: "rgba(255,255,255,0.12)" }} />
                  <h2 className="font-display font-bold text-white/30 mt-4" style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>
                    No results found for "{searchTerm}"
                  </h2>
                  <p className="font-body text-muted mt-2" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}>
                    Try a different search term
                  </p>
                </div>
              )}
            </>
          )}

          {/* Initial state — no search yet */}
          {!loading && !error && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-16">
              <SearchIcon sx={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "rgba(255,255,255,0.08)" }} />
              <p className="font-body text-white/25 mt-4" style={{ fontSize: "clamp(0.8rem, 1.3vw, 1rem)" }}>
                Search for films, actors, and directors
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
