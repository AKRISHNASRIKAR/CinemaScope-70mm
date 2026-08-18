import { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import FilmGrid from "@/components/ui/FilmGrid";
import { monthYear } from "@/lib/utils/formatDate";
import FilterTabs from "@/components/ui/FilterTabs";
import BrowseMoreLink from "@/components/ui/BrowseMoreLink";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { GenreRowSkeleton } from "@/components/ui/Skeletons";

const FILMS_PER_PAGE = 4;

/* ── Data-driven Content Component ────────────────────────────── */
const GenreRowContent = ({ genreIds, activeTab, isDark }) => {
  const genreParam = genreIds.length ? `&with_genres=${genreIds.join(",")}` : "";
  let endpoint;
  switch (activeTab) {
    case "IN THEATERS":
      endpoint = `/movie/now_playing?${genreParam}`;
      break;
    case "TOP RATED":
      endpoint = `/movie/top_rated?${genreParam}`;
      break;
    default: // FEATURED
      endpoint = `/discover/movie?sort_by=popularity.desc${genreParam}`;
  }

  const { data } = useSWR(endpoint, fetcher, { suspense: true, keepPreviousData: true });
  const visible = (data.results || []).slice(0, FILMS_PER_PAGE);

  return (
    <div className={isDark ? "text-white" : "text-ink"} style={{ marginTop: "clamp(0.75rem, 1.5vh, 1rem)" }}>
      <FilmGrid
        films={visible}
        minCard="clamp(120px, 15vw, 190px)"
        gap="clamp(0.75rem, 2vw, 1.25rem)"
        subtitleFor={(f) => monthYear(f.release_date)}
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

  const goToGenrePage = () => {
    const id = genreId ?? genreIds[0];
    if (id) navigate(`/genre/${id}`);
  };

  return (
    <section className={`w-full ${bgClass}`} style={{ padding: "clamp(2rem, 5vw, 4rem) 0" }}>
      <div className="center-container">
        {/* Fluid two-column row: the copy column wraps above the grid on
            narrow viewports purely through flex-basis — no breakpoints. */}
        <div
          className="flex flex-wrap items-start"
          style={{
            flexDirection: alignment === "right" ? "row-reverse" : "row",
            gap: "clamp(1.5rem, 3vw, 3rem)",
          }}
        >
          {/* ── Copy column ─────────────────────────────────── */}
          <div style={{ flex: "1 1 clamp(220px, 22vw, 320px)", minWidth: 0 }}>
            <h2
              className={`font-display font-bold leading-[0.92] tracking-tight ${headingColor}`}
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 3.5rem)" }}
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

            <div style={{ marginTop: "clamp(1rem, 2.5vh, 1.75rem)" }}>
              <BrowseMoreLink genre={genre.split(" & ")[0]} dark={isDark} onClick={goToGenrePage} />
            </div>
          </div>

          {/* ── Films column ────────────────────────────────── */}
          <div style={{ flex: "4 1 clamp(280px, 52vw, 800px)", minWidth: 0 }}>
            <FilterTabs active={activeTab} onChange={setActiveTab} dark={isDark} />

            <ErrorBoundary>
              <Suspense fallback={<GenreRowSkeleton />}>
                <GenreRowContent genreIds={genreIds} activeTab={activeTab} isDark={isDark} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenreRow;
