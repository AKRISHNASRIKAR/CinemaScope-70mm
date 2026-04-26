import React, { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import { CircularProgress } from "@mui/material";

import FilmCard from "@/components/ui/FilmCard";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { FilmGridSkeleton } from "@/components/ui/Skeletons";
import { GENRE_MAP } from "@/lib/constants";

/* ── Constants ────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc", voteCt: false },
  { label: "Rating", value: "vote_average.desc", voteCt: true },
  { label: "Newest", value: "release_date.desc", voteCt: false },
  { label: "Oldest", value: "release_date.asc", voteCt: false },
];

const FILTER_TABS = [
  { label: "All", endpoint: "discover" },
  { label: "In Theaters", endpoint: "now_playing" },
  { label: "Top Rated", endpoint: "top_rated" },
  { label: "Coming Soon", endpoint: "upcoming" },
];

/* ── 1. Genre Hero Section (Stateless) ────────────────────────── */
const GenreHero = ({ genreName, heroPosterUrls, navHeight }) => (
  <div className="relative w-full overflow-hidden" style={{ paddingTop: navHeight, minHeight: "clamp(220px, 35vh, 360px)" }}>
    {heroPosterUrls.length > 0 && (
      <div className="absolute inset-0 flex" style={{ gap: 0, filter: "blur(18px)", transform: "scale(1.1)" }} aria-hidden>
        {heroPosterUrls.map((url, i) => (
          <div key={i} className="flex-1 bg-center bg-cover" style={{ backgroundImage: `url(${url})` }} />
        ))}
      </div>
    )}
    <div className="absolute inset-0 bg-black/80" />
    <div className="relative z-10 flex flex-col justify-end" style={{ padding: "clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 4rem)", paddingBottom: "clamp(2rem, 4vh, 3rem)" }}>
      <p className="font-mono tracking-[0.3em] text-white/40 uppercase" style={{ fontSize: "clamp(0.55rem, 1vw, 0.7rem)", marginBottom: "clamp(0.4rem, 1vh, 0.75rem)" }}>Browse</p>
      <h1 className="font-display font-bold text-white leading-none tracking-tight" style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}>{genreName.toUpperCase()}</h1>
      <p className="font-body text-white/40 mt-2" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.875rem)" }}>Curated from TMDB · {genreName} films</p>
    </div>
  </div>
);

/* ── 2. Data-driven Grid Component ────────────────────────────── */
const GenreGrid = ({ genreId, sortBy, filterTab, setHeroPosterUrls }) => {
  const [page, setPage] = useState(1);
  const [extraFilms, setExtraFilms] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Initial URL for page 1
  const getUrl = (p) => {
    const genreParam = `&with_genres=${genreId}`;
    const sortParam = `&sort_by=${sortBy.value}`;
    const voteParam = sortBy.voteCt ? "&vote_count.gte=200" : "";
    if (filterTab.endpoint === "discover") {
      return `/discover/movie?page=${p}${genreParam}${sortParam}${voteParam}`;
    }
    return `/movie/${filterTab.endpoint}?page=${p}${genreParam}`;
  };

  const { data } = useSWR(getUrl(1), fetcher, { suspense: true });
  
  useEffect(() => {
    // Reset when filters change
    setPage(1);
    setExtraFilms([]);
    if (data?.results) {
      setTotalPages(data.total_pages);
      const urls = data.results
        .filter((f) => f.poster_path)
        .slice(0, 8)
        .map((f) => `https://image.tmdb.org/t/p/w342${f.poster_path}`);
      setHeroPosterUrls(urls);
    }
  }, [genreId, sortBy, filterTab, data, setHeroPosterUrls]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const moreData = await fetcher(getUrl(nextPage));
      setExtraFilms((prev) => [...prev, ...moreData.results]);
      setPage(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const allFilms = [...(data?.results || []), ...extraFilms];

  if (allFilms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="font-body text-muted">No films found for this combination.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid justify-center" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(clamp(130px, 18vw, 200px), 1fr))", gap: "clamp(0.75rem, 2vw, 1.5rem)", justifyContent: "center" }}>
        {allFilms.map((film) => (
          <FilmCard 
            key={`${film.id}-${page}`} 
            film={film} 
            subtitle={film.release_date ? new Date(film.release_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : undefined} 
          />
        ))}
      </div>
      
      {page < totalPages && (
        <div className="flex justify-center" style={{ marginTop: "clamp(2rem, 4vw, 3rem)" }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-3 font-body font-medium tracking-[0.15em] uppercase rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/35 transition-all duration-normal cursor-pointer disabled:opacity-50"
            style={{ padding: "0.75rem 2.5rem" }}
          >
            {loadingMore && <CircularProgress size={14} sx={{ color: "#c9a843" }} />}
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </>
  );
};

/* ── Main Page Container ───────────────────────────────────────── */
const GenrePage = () => {
  const { id } = useParams();
  const genreId = parseInt(id, 10);
  const genreName = GENRE_MAP[genreId] ?? "Genre";

  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [filterTab, setFilterTab] = useState(FILTER_TABS[0]);
  const [heroPosterUrls, setHeroPosterUrls] = useState([]);
  const [isSticky, setIsSticky] = useState(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { rootMargin: "0px", threshold: 0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const NAV_HEIGHT = "var(--navbar-height, 3.5rem)";

  return (
    <div className="min-h-screen bg-base relative">
      <BackButton fallbackRoute="/" />
      <GenreHero genreName={genreName} heroPosterUrls={heroPosterUrls} navHeight={NAV_HEIGHT} />

      <div 
        className={`${isSticky ? 'sticky' : 'relative'} bg-[#090909] border-b border-white/5 w-full transition-all duration-200`} 
        style={{ top: isSticky ? "var(--navbar-height, 4rem)" : "auto", zIndex: 30 }}
      >
        <div className="center-container px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between flex-wrap" style={{ gap: "clamp(0.5rem, 1vw, 1rem)", padding: "clamp(0.75rem, 1.5vh, 1rem) 0" }}>
            
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center overflow-x-auto scrollbar-hide flex-1 sm:flex-none" style={{ gap: "clamp(0.25rem, 0.8vw, 0.5rem)" }}>
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.label}
                    onClick={() => setFilterTab(tab)}
                    className={`flex-shrink-0 font-body font-medium tracking-[0.12em] uppercase transition-all duration-fast cursor-pointer pb-2 border-b-2 text-[10px] whitespace-nowrap ${filterTab.label === tab.label ? "text-gold border-gold" : "bg-transparent text-white/40 border-transparent hover:text-white"}`}
                    style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-white/30 text-[10px] uppercase hidden sm:inline">Sort</span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt)}
                    className={`flex-shrink-0 font-body font-medium tracking-[0.1em] uppercase transition-all duration-fast cursor-pointer pb-2 border-b-2 text-[9px] whitespace-nowrap ${sortBy.value === opt.value ? "text-gold border-gold" : "bg-transparent text-white/30 border-transparent hover:text-white"}`}
                    style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="center-container w-full px-4 sm:px-6 lg:px-12 py-10">
        <ErrorBoundary>
          <Suspense fallback={<FilmGridSkeleton />}>
            <GenreGrid 
              genreId={genreId} 
              sortBy={sortBy} 
              filterTab={filterTab} 
              setHeroPosterUrls={setHeroPosterUrls} 
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="w-full h-1" />

      <Footer />
    </div>
  );
};

export default GenrePage;
