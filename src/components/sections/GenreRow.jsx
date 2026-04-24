import { useState, useEffect, useCallback } from "react";
import FilmCard from "@/components/ui/FilmCard";
import FilterTabs from "@/components/ui/FilterTabs";
import BrowseMoreLink from "@/components/ui/BrowseMoreLink";

const FILMS_PER_PAGE = 4;
const BASE = import.meta.env.VITE_BASE_URL;
const KEY  = import.meta.env.VITE_API_KEY;

/* Skeleton placeholder while loading */
const SkeletonCard = () => (
  <div className="flex flex-col animate-pulse">
    <div className="aspect-[2/3] rounded-card bg-white/5" />
    <div className="h-3 rounded bg-white/5 mt-3 w-3/4" />
    <div className="h-2 rounded bg-white/5 mt-1.5 w-1/2" />
  </div>
);

const GenreRow = ({
  genre = "",
  tagline = "",
  genreIds = [],
  alignment = "left",
  theme = "dark",
}) => {
  const [activeTab, setActiveTab] = useState("FEATURED");
  const [films,     setFilms]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  const isDark = theme !== "light";

  /* ── TMDB endpoint per tab ─── */
  const fetchFilms = useCallback(async (tab) => {
    setLoading(true);
    try {
      const genreParam = genreIds.length ? `&with_genres=${genreIds.join(",")}` : "";
      let url;
      switch (tab) {
        case "IN THEATERS":
          url = `${BASE}/movie/now_playing?api_key=${KEY}&language=en-US${genreParam}`;
          break;
        case "TOP RATED":
          url = `${BASE}/movie/top_rated?api_key=${KEY}&language=en-US${genreParam}`;
          break;
        default: // FEATURED
          url = `${BASE}/discover/movie?api_key=${KEY}&language=en-US&sort_by=popularity.desc${genreParam}`;
      }
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      setFilms(data.results || []);
    } catch (e) {
      console.error("GenreRow fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [genreIds]);

  useEffect(() => { fetchFilms(activeTab); }, [activeTab, fetchFilms]);

  const onTabChange = (tab) => setActiveTab(tab);

  const bgClass = theme === "light" ? "bg-section-light" : theme === "mid" ? "bg-section-mid" : "bg-section-dark";
  const headingColor = isDark ? "text-white"  : "text-ink";
  const taglineColor = isDark ? "text-muted"  : "text-ink-muted";

  const visible = films.slice(0, FILMS_PER_PAGE);

  return (
    <section className={`w-full ${bgClass}`} style={{ padding: "clamp(2rem, 5vw, 4rem) 0" }}>
      <div style={{ padding: "0 clamp(1.5rem, 4vw, 4rem)" }}>

        {/* Row: Heading left + Content right (or flipped) */}
        <div className={`flex flex-col lg:flex-row ${alignment === "right" ? "lg:flex-row-reverse" : ""}`} style={{ gap: "clamp(1.5rem, 3vw, 3rem)" }}>

          {/* ── Heading column ─── */}
          <div className="lg:w-[28%] flex flex-col justify-between flex-shrink-0">
            <div>
              <h2
                className={`font-display font-bold leading-[0.92] tracking-tight ${headingColor}`}
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 3.5rem)" }}
              >
                {genre}
              </h2>
              <p
                className={`font-body font-light leading-relaxed ${taglineColor}`}
                style={{ marginTop: "clamp(0.5rem, 1vh, 0.75rem)", fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)" }}
              >
                {tagline}
              </p>
            </div>
            <div className="mt-6 hidden lg:block">
              <BrowseMoreLink genre={genre.split(" & ")[0]} dark={isDark} />
            </div>
          </div>

          {/* ── Grid column ─── */}
          <div className="flex-1 min-w-0">
            <FilterTabs active={activeTab} onChange={onTabChange} dark={isDark} />

            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)", marginTop: "clamp(0.75rem, 1.5vh, 1rem)" }}
            >
              {loading
                ? Array.from({ length: FILMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)
                : visible.map((film) => (
                    <div key={film.id} className={isDark ? "text-white" : "text-ink"}>
                      <FilmCard
                        film={film}
                        subtitle={film.release_date
                          ? new Date(film.release_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                          : undefined}
                      />
                    </div>
                  ))
              }
            </div>

            {/* Mobile browse link */}
            <div className="mt-6 lg:hidden">
              <BrowseMoreLink genre={genre.split(" & ")[0]} dark={isDark} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenreRow;
