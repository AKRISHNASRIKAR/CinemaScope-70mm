import { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import InTheatersCarousel from "@/components/sections/InTheatersCarousel";
import FilterTabs from "@/components/ui/FilterTabs";
import BrowseMoreLink from "@/components/ui/BrowseMoreLink";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { GenreRowSkeleton } from "@/components/ui/Skeletons";

const FILMS_PER_ROW = 8;
const RELEASE_TYPE_IN_THEATERS = "2%7C3";
const TOP_RATED_MIN_VOTES = 300;

const iso = (date) => date.toISOString().slice(0, 10);
const today = () => iso(new Date());
const monthsAgo = (count) => {
  const date = new Date();
  date.setMonth(date.getMonth() - count);
  return iso(date);
};

/* ── Data-driven Content Component ────────────────────────────── */
const GenreRowContent = ({ genreIds, activeTab, genre, isDark }) => {
  const genreParam = genreIds.length ? `&with_genres=${genreIds.join(",")}` : "";
  let endpoint;
  switch (activeTab) {
    case "IN THEATERS":
      endpoint = (
        `/discover/movie?sort_by=popularity.desc&region=US&with_release_type=${RELEASE_TYPE_IN_THEATERS}` +
        `&primary_release_date.gte=${monthsAgo(1)}&primary_release_date.lte=${today()}${genreParam}`
      );
      break;
    case "TOP RATED":
      endpoint = `/discover/movie?sort_by=vote_average.desc&vote_count.gte=${TOP_RATED_MIN_VOTES}${genreParam}`;
      break;
    default: // FEATURED
      endpoint = `/discover/movie?sort_by=popularity.desc${genreParam}`;
  }

  const { data } = useSWR(endpoint, fetcher, { suspense: true, keepPreviousData: true });
  const results = data?.results ?? [];
  const films = results.filter((film) => film.backdrop_path || film.poster_path).slice(0, FILMS_PER_ROW);

  return (
    <div className={isDark ? "text-white" : "text-ink"} style={{ marginTop: "clamp(1rem, 2vh, 1.5rem)" }}>
      <InTheatersCarousel
        films={films}
        isDark={isDark}
        showHeading={false}
        compact
        badgeLabel={activeTab}
        ariaLabel={`${genre} ${activeTab.toLowerCase()} carousel`}
        emptyMessage="No films found for this selection."
      />
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
const GenreRow = ({
  genre = "",
  tagline = "",
  genreIds = [],
  genreId = null,
  alignment = "left",
  theme = "dark",
}) => {
  const [activeTab, setActiveTab] = useState("FEATURED");
  const navigate = useNavigate();

  const isDark = theme !== "light";
  const bgClass = theme === "light" ? "bg-section-light" : theme === "mid" ? "bg-section-mid" : "bg-section-dark";
  const headingColor = isDark ? "text-white" : "text-ink";
  const taglineColor = isDark ? "text-muted" : "text-ink-muted";
  const alignRight = alignment === "right";

  const goToGenrePage = () => {
    const id = genreId ?? genreIds[0];
    if (id) navigate(`/genre/${id}`);
  };

  return (
    <section className={`relative w-full overflow-hidden ${bgClass}`} style={{ padding: "clamp(2.5rem, 6vw, 5rem) 0" }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.13 : 0.055,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
      <div aria-hidden className={`absolute inset-x-0 top-0 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />

      <div className="center-container relative">
        <div
          className={`flex flex-wrap items-end justify-between ${alignRight ? "text-right" : "text-left"}`}
          style={{
            gap: "clamp(1.2rem, 3vw, 2.5rem)",
          }}
        >
          <div className={alignRight ? "ml-auto" : ""} style={{ flex: "1 1 clamp(18rem, 48vw, 46rem)", minWidth: 0 }}>
            <p
              className={`font-mono uppercase ${isDark ? "text-gold" : "text-gold-ink"}`}
              style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.68rem)", letterSpacing: "0.3em", marginBottom: "clamp(0.45rem, 1vw, 0.7rem)" }}
            >
              Genre lane
            </p>
            <h2
              className={`font-wordmark font-black uppercase leading-[0.86] ${headingColor}`}
              style={{ fontSize: "clamp(2.1rem, 6.8vw, 5.8rem)", letterSpacing: "-0.06em" }}
            >
              <button
                type="button"
                className={`text-left cursor-pointer transition-colors duration-fast outline-none ${
                  isDark ? "hover:text-gold focus-visible:text-gold" : "hover:text-ink-muted focus-visible:text-ink-muted"
                }`}
                onClick={goToGenrePage}
              >
                {genre}
              </button>
            </h2>

            <p
              className={`font-body font-light leading-relaxed ${taglineColor}`}
              style={{ marginTop: "clamp(0.5rem, 1vh, 0.75rem)", fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)" }}
            >
              {tagline}
            </p>
          </div>

          <div className="flex-shrink-0" style={{ marginBottom: "clamp(0.1rem, 0.5vw, 0.45rem)" }}>
            <BrowseMoreLink genre={genre.split(" & ")[0]} dark={isDark} onClick={goToGenrePage} />
          </div>
        </div>

        <div
          className={`flex flex-wrap items-center justify-between border-y ${isDark ? "border-white/10" : "border-black/10"}`}
          style={{
            gap: "clamp(0.75rem, 2vw, 1.5rem)",
            marginTop: "clamp(1.3rem, 3vw, 2rem)",
            padding: "clamp(0.65rem, 1.4vw, 0.9rem) 0",
          }}
        >
          <FilterTabs active={activeTab} onChange={setActiveTab} dark={isDark} />
          <span
            className={`font-mono uppercase ${isDark ? "text-white/35" : "text-ink-muted"}`}
            style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.62rem)", letterSpacing: "0.18em" }}
          >
            {activeTab} / {genre}
          </span>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<GenreRowSkeleton />}>
            <GenreRowContent genreIds={genreIds} activeTab={activeTab} genre={genre} isDark={isDark} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </section>
  );
};

export default GenreRow;
