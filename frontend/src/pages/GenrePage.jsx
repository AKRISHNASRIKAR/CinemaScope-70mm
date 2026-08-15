import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import { CircularProgress } from "@mui/material";

import FilmCard from "@/components/ui/FilmCard";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SEO from "@/components/seo/SEO";
import { FilmGridSkeleton } from "@/components/ui/Skeletons";
import { GENRE_MAP } from "@/lib/constants";
import { posterUrl } from "@/lib/utils/tmdbImage";

/* ── Constants ────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc", voteCt: false },
  { label: "Rating", value: "vote_average.desc", voteCt: true },
  { label: "Newest", value: "release_date.desc", voteCt: false },
  { label: "Oldest", value: "release_date.asc", voteCt: false },
];
const DEFAULT_SORT = SORT_OPTIONS[0];

/* Every tab goes through /discover/movie.
   TMDB's curated list endpoints — /movie/now_playing, /movie/top_rated,
   /movie/upcoming — silently IGNORE `with_genres`. They used to back
   three of these tabs, which is why "In Theaters" on the Action page
   returned whatever was in cinemas, genre or not. /discover is the only
   endpoint that combines a genre with other criteria, so the date
   windows and vote thresholds those lists imply are rebuilt here. */

const iso = (d) => d.toISOString().slice(0, 10);
const today = () => iso(new Date());
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return iso(d);
};

/* Theatrical (2) or Digital (3) — %7C is an encoded `|`, TMDB's OR. */
const RELEASE_TYPE_IN_THEATERS = "2%7C3";
/* Keeps "Top Rated" off obscure titles with a handful of 10/10 votes. */
const TOP_RATED_MIN_VOTES = 300;

const FILTER_TABS = [
  { label: "All", key: "all" },
  { label: "In Theaters", key: "theaters" },
  { label: "Top Rated", key: "top" },
  { label: "Coming Soon", key: "upcoming" },
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

  /* Builds the /discover query for a given tab + page.
     The tab supplies the *criteria*; the sort dropdown still supplies the
     ordering, so "Top Rated + Newest" means newest among well-rated films
     rather than the tab silently overriding the user's choice. */
  const getUrl = useCallback((p) => {
    const base = `/discover/movie?page=${p}&with_genres=${genreId}&sort_by=${sortBy.value}`;
    // A vote floor is needed whenever rating drives the order, and always
    // on the Top Rated tab — otherwise one 10/10 vote tops the list.
    const voteFloor = sortBy.voteCt || filterTab.key === "top"
      ? `&vote_count.gte=${TOP_RATED_MIN_VOTES}`
      : "";

    switch (filterTab.key) {
      case "theaters":
        return (
          `${base}${voteFloor}&with_release_type=${RELEASE_TYPE_IN_THEATERS}` +
          `&primary_release_date.gte=${monthsAgo(1)}&primary_release_date.lte=${today()}`
        );
      case "top":
        return `${base}${voteFloor}`;
      case "upcoming":
        return `${base}${voteFloor}&primary_release_date.gte=${today()}`;
      default:
        return `${base}${voteFloor}`;
    }
  }, [filterTab.key, genreId, sortBy.value, sortBy.voteCt]);

  const initialUrl = useMemo(() => getUrl(1), [getUrl]);
  const { data } = useSWR(initialUrl, fetcher, { suspense: true });
  
  useEffect(() => {
    // Reset when filters change
    setPage(1);
    setExtraFilms([]);
    if (data?.results) {
      setTotalPages(data.total_pages);
      const urls = data.results
        .filter((f) => f.poster_path)
        .slice(0, 8)
        .map((f) => posterUrl(f.poster_path, "w342"));
      setHeroPosterUrls(urls);
    }
  }, [data, genreId, sortBy, filterTab, setHeroPosterUrls]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const moreData = await fetcher(getUrl(nextPage));
      setExtraFilms((prev) => [...prev, ...(moreData?.results ?? [])]);
      setPage(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [getUrl, page]);

  const allFilms = useMemo(() => [...(data?.results || []), ...extraFilms], [data?.results, extraFilms]);

  if (allFilms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="font-body text-muted">No films found for this combination.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid justify-center" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(clamp(130px, 18vw, 200px), 1fr))", gap: "clamp(0.75rem, 2vw, 1.5rem)", justifyContent: "center" }}>
        {allFilms.map((film) => (
          <li key={film.id}>
            <FilmCard 
              film={film} 
              subtitle={film.release_date ? new Date(film.release_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : undefined} 
            />
          </li>
        ))}
      </ul>
      
      {page < totalPages && (
        <div className="flex justify-center" style={{ marginTop: "clamp(2rem, 4vw, 3rem)" }}>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            aria-busy={loadingMore}
            className="flex items-center gap-3 font-body font-medium tracking-[0.15em] uppercase rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/35 transition-all duration-normal cursor-pointer disabled:opacity-50"
            style={{ padding: "0.75rem 2.5rem" }}
          >
            {loadingMore && <CircularProgress size={14} sx={{ color: "var(--color-gold)" }} />}
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

  const sortBy = DEFAULT_SORT;
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
      <SEO
        title={`${genreName} Movies`}
        description={`Browse ${genreName} movies on CinemaScope, including popular, top rated, upcoming, and theatrical releases.`}
        canonicalPath={`/genre/${genreId}`}
      />
      <BackButton fallbackRoute="/" />
      <GenreHero genreName={genreName} heroPosterUrls={heroPosterUrls} navHeight={NAV_HEIGHT} />

      <div 
        className={`${isSticky ? "sticky" : "relative"} bg-base border-b border-white/5 w-full transition-all duration-200`} 
        style={{ top: isSticky ? "var(--navbar-height, 4rem)" : "auto", zIndex: 30 }}
      >
        <div className="center-container">
          <div className="flex items-center justify-between flex-wrap" style={{ gap: "clamp(0.5rem, 1vw, 1rem)", padding: "clamp(0.75rem, 1.5vh, 1rem) 0" }}>
            
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className="flex items-center overflow-x-auto scrollbar-hide flex-1 sm:flex-none"
                style={{ gap: "clamp(0.25rem, 0.8vw, 0.5rem)" }}
                aria-label={`${genreName} movie filters`}
              >
                {FILTER_TABS.map((tab) => (
                  <button
                    type="button"
                    key={tab.label}
                    onClick={() => setFilterTab(tab)}
                    aria-pressed={filterTab.label === tab.label}
                    className={`flex-shrink-0 font-body font-medium tracking-[0.12em] uppercase transition-all duration-fast cursor-pointer pb-2 border-b-2 text-[10px] whitespace-nowrap ${filterTab.label === tab.label ? "text-gold border-gold" : "bg-transparent text-white/40 border-transparent hover:text-white"}`}
                    style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="center-container w-full py-10">
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
