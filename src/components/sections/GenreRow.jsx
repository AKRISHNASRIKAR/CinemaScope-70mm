import React, { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import FilmCard from "@/components/ui/FilmCard";
import FilterTabs from "@/components/ui/FilterTabs";
import BrowseMoreLink from "@/components/ui/BrowseMoreLink";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { GenreRowSkeleton } from "@/components/ui/Skeletons";

const FILMS_PER_PAGE = 4;

/* ── Data-driven Content Component ────────────────────────────── */
const GenreRowContent = ({ genreIds, activeTab, theme, isDark, goToGenrePage }) => {
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

  const { data } = useSWR(endpoint, fetcher, { suspense: true });
  const visible = (data.results || []).slice(0, FILMS_PER_PAGE);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)", marginTop: "clamp(0.75rem, 1.5vh, 1rem)" }}>
      {visible.map((film) => (
        <div key={film.id} className={isDark ? "text-white" : "text-ink"}>
          <FilmCard
            film={film}
            subtitle={film.release_date ? new Date(film.release_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : undefined}
          />
        </div>
      ))}
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
      <div className="center-container px-4 sm:px-6 lg:px-12">
        <div className={`flex flex-col lg:flex-row ${alignment === "right" ? "lg:flex-row-reverse" : ""}`} style={{ gap: "clamp(1.5rem, 3vw, 3rem)" }}>
          
          <div className="lg:w-[28%] flex flex-col justify-between flex-shrink-0">
            <div>
              <h2
                className={`font-display font-bold leading-[0.92] tracking-tight cursor-pointer transition-colors duration-fast ${headingColor} ${isDark ? "hover:text-gold" : "hover:text-ink-muted"}`}
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 3.5rem)" }}
                onClick={goToGenrePage}
              >
                {genre}
              </h2>
              <p className={`font-body font-light leading-relaxed ${taglineColor}`} style={{ marginTop: "clamp(0.5rem, 1vh, 0.75rem)", fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)" }}>
                {tagline}
              </p>
            </div>
            <div className="mt-6 hidden lg:block">
              <BrowseMoreLink genre={genre.split(" & ")[0]} dark={isDark} onClick={goToGenrePage} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <FilterTabs active={activeTab} onChange={setActiveTab} dark={isDark} />
            
            <ErrorBoundary>
              <Suspense fallback={<GenreRowSkeleton />}>
                <GenreRowContent 
                  genreIds={genreIds} 
                  activeTab={activeTab} 
                  theme={theme} 
                  isDark={isDark} 
                  goToGenrePage={goToGenrePage} 
                />
              </Suspense>
            </ErrorBoundary>

            <div className="mt-6 lg:hidden">
              <BrowseMoreLink genre={genre.split(" & ")[0]} dark={isDark} onClick={goToGenrePage} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenreRow;
