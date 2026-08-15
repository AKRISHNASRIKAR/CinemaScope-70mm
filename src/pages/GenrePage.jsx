import { useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import FilmGrid from "@/components/ui/FilmGrid";
import { monthYear } from "@/lib/utils/formatDate";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { FilmGridSkeleton } from "@/components/ui/Skeletons";
import { GENRE_MAP } from "@/lib/constants";
import { backdropUrl } from "@/lib/utils/tmdbImage";

/* ── Constants ────────────────────────────────────────────────── */
/* Every tab goes through /discover/movie.
   TMDB's curated list endpoints — /movie/now_playing, /movie/top_rated,
   /movie/upcoming — silently IGNORE `with_genres`. They used to back
   three of these tabs, which is why "In Theaters" on the Action page
   returned whatever was in cinemas, genre or not. /discover is the only
   endpoint that actually combines a genre with other criteria, so the
   date windows and vote thresholds those lists imply are rebuilt here. */

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

/** Builds the /discover query for a given tab + page. */
const buildUrl = (genreId, key, page = 1) => {
  const base = `/discover/movie?page=${page}&with_genres=${genreId}`;
  switch (key) {
    case "theaters":
      return (
        `${base}&sort_by=popularity.desc&with_release_type=${RELEASE_TYPE_IN_THEATERS}` +
        `&primary_release_date.gte=${monthsAgo(1)}&primary_release_date.lte=${today()}`
      );
    case "top":
      return `${base}&sort_by=vote_average.desc&vote_count.gte=${TOP_RATED_MIN_VOTES}`;
    case "upcoming":
      return `${base}&sort_by=popularity.desc&primary_release_date.gte=${today()}`;
    default:
      return `${base}&sort_by=popularity.desc`;
  }
};

/* ── 1. Genre Hero ────────────────────────────────────────────── */
/* Reads the same SWR key as the grid, so the artwork comes from cache
   rather than a second network request. */
const GenreHero = ({ genreName, url, navHeight }) => {
  const { data } = useSWR(url, fetcher);
  const [artLoaded, setArtLoaded] = useState(false);

  const feature = data?.results?.find((f) => f.backdrop_path) ?? null;
  const art = backdropUrl(feature?.backdrop_path);
  const total = data?.total_results;

  return (
    <header
      className="relative w-full overflow-hidden"
      style={{ paddingTop: navHeight, minHeight: "clamp(260px, 42vh, 460px)" }}
    >
      {/* Full-bleed backdrop */}
      {art && (
        <img
          src={art}
          alt=""
          aria-hidden
          loading="eager"
          fetchpriority="high"
          onLoad={() => setArtLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: "center 20%",
            filter: "blur(6px) saturate(1.15)",
            transform: "scale(1.06)",
            opacity: artLoaded ? 0.5 : 0,
            transition: "opacity 900ms ease",
          }}
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-base/50" />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(70% 90% at 0% 100%, rgba(201,168,67,0.14) 0%, rgba(9,9,9,0) 65%)" }}
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

      <div
        className="relative center-container flex flex-col justify-end"
        style={{ paddingTop: "clamp(2rem, 6vh, 4rem)", paddingBottom: "clamp(1.5rem, 4vh, 2.5rem)" }}
      >
        <p
          className="font-mono text-gold uppercase"
          style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.68rem)", letterSpacing: "0.32em" }}
        >
          Browse genre
        </p>
        <h1
          className="font-display font-bold text-white leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(2.2rem, 6.5vw, 5.5rem)", marginTop: "clamp(0.4rem, 1vh, 0.75rem)" }}
        >
          {genreName}
        </h1>
        <p
          className="font-body text-white/45"
          style={{ fontSize: "clamp(0.68rem, 1.1vw, 0.875rem)", marginTop: "clamp(0.5rem, 1.2vh, 0.85rem)" }}
        >
          {total ? `${total.toLocaleString()} films` : "Curated from TMDB"}
          {feature?.title ? ` · Featuring ${feature.title}` : ""}
        </p>
      </div>
    </header>
  );
};

/* ── 2. Filter pills ──────────────────────────────────────────── */
const FilterBar = ({ active, onChange }) => (
  <div
    className="sticky top-0 w-full border-b border-white/[0.06]"
    style={{
      zIndex: 30,
      background: "rgba(9,9,9,0.82)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}
  >
    <div className="center-container">
      <div
        className="flex items-center overflow-x-auto scrollbar-hide"
        style={{ gap: "clamp(0.35rem, 1vw, 0.6rem)", padding: "clamp(0.6rem, 1.4vh, 0.9rem) 0" }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = active.label === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => onChange(tab)}
              aria-pressed={isActive}
              className={`flex-shrink-0 font-body font-medium uppercase whitespace-nowrap rounded-full border transition-all duration-300 hover:scale-[1.03] cursor-pointer ${
                isActive
                  ? "bg-gold text-black border-gold"
                  : "bg-white/[0.04] text-white/55 border-white/10 hover:text-white hover:border-white/25"
              }`}
              style={{
                fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)",
                letterSpacing: "0.14em",
                padding: "0.5rem 1.15rem",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

/* ── 3. Data-driven grid ──────────────────────────────────────── */
/* Mounted with key={url} by the page, so switching tabs remounts this
   component and pagination state resets without an effect. */
const GenreGrid = ({ genreId, tabKey, url }) => {
  const { data } = useSWR(url, fetcher, { suspense: true });
  const [extraPages, setExtraPages] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const page = extraPages.length + 1;
  const totalPages = data?.total_pages ?? 1;

  // Later pages can repeat titles from earlier ones — dedupe by id.
  const films = Array.from(
    new Map(
      [...(data?.results || []), ...extraPages.flat()].map((f) => [f.id, f])
    ).values()
  );

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await fetcher(buildUrl(genreId, tabKey, page + 1));
      setExtraPages((prev) => [...prev, next.results || []]);
    } catch (e) {
      console.error("Failed to load more films", e);
    } finally {
      setLoadingMore(false);
    }
  };

  if (films.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ padding: "clamp(3rem, 10vh, 6rem) 0" }}>
        <p className="font-display font-bold text-white/30" style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)" }}>
          No films in this selection
        </p>
        <p className="font-body text-muted" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)", marginTop: "0.5rem" }}>
          Try another filter above.
        </p>
      </div>
    );
  }

  return (
    <>
      <FilmGrid films={films} subtitleFor={(f) => monthYear(f.release_date)} />

      {page < totalPages && (
        <div className="flex justify-center" style={{ marginTop: "clamp(2rem, 4vw, 3rem)" }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-3 font-body font-medium tracking-[0.15em] uppercase rounded-full border border-gold/40 text-white/70 hover:text-white hover:bg-gold/10 hover:border-gold/70 transition-all duration-300 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            style={{ padding: "0.85rem 2.5rem", fontSize: "clamp(0.6rem, 0.95vw, 0.75rem)" }}
          >
            {loadingMore && (
              <span
                aria-hidden
                className="rounded-full border-2 border-gold border-t-transparent"
                style={{ width: "0.85rem", height: "0.85rem", animation: "spin 0.8s linear infinite" }}
              />
            )}
            {loadingMore ? "Loading…" : "Load more"}
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

  const [filterTab, setFilterTab] = useState(FILTER_TABS[0]);
  const url = buildUrl(genreId, filterTab.key, 1);

  const NAV_HEIGHT = "var(--navbar-height, 3.5rem)";

  return (
    <div className="min-h-screen bg-base text-white">
      <BackButton fallbackRoute="/" />

      <GenreHero genreName={genreName} url={url} navHeight={NAV_HEIGHT} />

      <FilterBar active={filterTab} onChange={setFilterTab} />

      <div className="center-container" style={{ paddingTop: "clamp(1.5rem, 4vh, 2.5rem)", paddingBottom: "clamp(3rem, 8vh, 5rem)" }}>
        <ErrorBoundary>
          <Suspense fallback={<FilmGridSkeleton />}>
            <GenreGrid key={url} genreId={genreId} tabKey={filterTab.key} url={url} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <Footer />
    </div>
  );
};

export default GenrePage;
