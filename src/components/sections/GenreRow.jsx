import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilmCard from "@/components/ui/FilmCard";
import FilterTabs from "@/components/ui/FilterTabs";
import BrowseMoreLink from "@/components/ui/BrowseMoreLink";
import PaginationDots from "@/components/ui/PaginationDots";

const FILMS_PER_PAGE = 4;

/* ──────────────────────────────────────────────────────────────────
   GenreRow — reusable alternating genre section.

   Props:
     genre      string   — "DRAMA & ROMANCE"
     tagline    string   — short descriptor below heading
     films      array    — TMDB movie objects
     alignment  "left"|"right"  — which side the heading sits on
     theme      "dark"|"light"|"mid"  — section background
────────────────────────────────────────────────────────────────── */
const GenreRow = ({
  genre = "",
  tagline = "",
  films = [],
  alignment = "left",
  theme = "dark",
}) => {
  const [activeTab, setActiveTab] = useState("FEATURED");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const isDark  = theme !== "light";
  const isMid   = theme === "mid";

  /* ── background ─── */
  const bgClass = theme === "light"
    ? "bg-section-light"
    : theme === "mid"
      ? "bg-section-mid"
      : "bg-section-dark";

  /* ── text colours ─── */
  const headingColor = isDark ? "text-white"    : "text-ink";
  const taglineColor = isDark ? "text-muted"    : "text-ink-muted";

  /* ── paginated films ─── */
  const totalPages  = Math.ceil(films.length / FILMS_PER_PAGE);
  const visibleFilms = films.slice(page * FILMS_PER_PAGE, page * FILMS_PER_PAGE + FILMS_PER_PAGE);

  /* ── heading column ─── */
  const HeadingCol = () => (
    <div className={`
      flex flex-col justify-between py-12
      ${alignment === "left" ? "pr-8 pl-10 lg:pl-16" : "pl-8 pr-10 lg:pr-16"}
      min-w-[220px] w-[26%] flex-shrink-0
    `}>
      <div>
        <h2
          className={`font-display font-bold leading-[0.92] tracking-tight ${headingColor}`}
          style={{ fontSize: "clamp(1.8rem, 3vw, 3.5rem)" }}
        >
          {genre}
        </h2>
        <p className={`font-body font-light text-sm mt-3 leading-relaxed ${taglineColor}`}>
          {tagline}
        </p>
      </div>
      <BrowseMoreLink
        genre={genre.split(" & ")[0]}
        onClick={() => navigate("/search/" + genre.toLowerCase().replace(/ & /g, "-"))}
        dark={isDark}
      />
    </div>
  );

  /* ── grid column ─── */
  const GridCol = () => (
    <div className="flex-1 py-10 px-4 min-w-0">
      <FilterTabs active={activeTab} onChange={setActiveTab} dark={isDark} />

      <div className="grid grid-cols-4 gap-4 mt-6">
        {visibleFilms.map((film) => (
          <div key={film.id} className={isDark ? "text-white" : "text-ink"}>
            <FilmCard
              film={film}
              subtitle={film.release_date
                ? new Date(film.release_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : undefined
              }
            />
          </div>
        ))}
        {/* Fill empty slots to keep grid stable */}
        {Array.from({ length: Math.max(0, FILMS_PER_PAGE - visibleFilms.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-[2/3]" />
        ))}
      </div>
    </div>
  );

  return (
    <section className={`w-full ${bgClass}`}>
      <div className="flex items-stretch">

        {alignment === "left"  && <HeadingCol />}

        <GridCol />

        {alignment === "right" && <HeadingCol />}

        {/* Pagination dots — always far right */}
        {totalPages > 1 && (
          <PaginationDots
            total={totalPages}
            current={page}
            onChange={setPage}
            dark={isDark}
          />
        )}
      </div>
    </section>
  );
};

export default GenreRow;
