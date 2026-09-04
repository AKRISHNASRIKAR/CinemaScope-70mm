import { useNavigate } from "react-router-dom";
import useSWR from "swr";

import { fetcher } from "@/lib/api/fetcher";
import LazyImage from "@/components/ui/LazyImage";
import ScrollRow from "@/components/ui/ScrollRow";
import SectionHeader from "@/components/ui/SectionHeader";
import { posterUrl } from "@/lib/utils/tmdbImage";

const CARD_WIDTH = "clamp(118px, 13vw, 190px)";

/**
 * TrendingRow — this week's most-watched films as a ranked strip.
 * Data comes from TMDB `/trending/movie/week`; suspends into TrendingRowSkeleton.
 */
const TrendingRow = () => {
  const navigate = useNavigate();
  const { data } = useSWR("/trending/movie/week", fetcher, { suspense: true });

  const films = (data?.results || []).filter((f) => f.poster_path).slice(0, 12);
  if (films.length === 0) return null;

  return (
    <section className="w-full bg-base" style={{ paddingTop: "clamp(1.5rem,3vw,2.5rem)", paddingBottom: "clamp(0.5rem,1vw,1rem)" }}>
      <div className="center-container">
        <SectionHeader
          eyebrow="This week"
          title="Trending Now"
          count={`${films.length} films`}
        />

        <ScrollRow
          showArrows={films.length > 4}
          scrollAmount={340}
          gap="clamp(0.75rem,1.5vw,1.25rem)"
          arrowSize="2.25rem"
          ariaLabel="Trending films"
        >
          {films.map((film, i) => (
            <div
              key={film.id}
              onClick={() => navigate(`/film/${film.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/film/${film.id}`); }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${film.title}, ranked ${i + 1} this week`}
              className="group flex-shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-card transition-all duration-300 hover:scale-[1.02]"
              style={{ width: CARD_WIDTH, scrollSnapAlign: "start" }}
            >
              <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
                <LazyImage
                  src={posterUrl(film.poster_path, "w185")}
                  alt={film.title}
                  fallbackType="poster"
                  className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Rank numeral */}
                <span
                  aria-hidden
                  className="absolute font-display font-bold leading-none select-none"
                  style={{
                    left: "clamp(0.3rem, 0.8vw, 0.6rem)",
                    bottom: "clamp(-0.15rem, 0vw, 0.1rem)",
                    fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
                    color: "rgba(9,9,9,0.55)",
                    WebkitTextStroke: "1.5px rgba(201,168,67,0.85)",
                  }}
                >
                  {i + 1}
                </span>
              </div>

              <p
                className="font-body font-medium line-clamp-1 leading-snug group-hover:text-gold transition-colors duration-fast"
                style={{ marginTop: "clamp(0.4rem,0.8vh,0.6rem)", fontSize: "clamp(0.65rem,1vw,0.82rem)" }}
              >
                {film.title}
              </p>
              <p className="font-mono text-muted line-clamp-1" style={{ fontSize: "clamp(0.5rem,0.85vw,0.65rem)", marginTop: "0.15rem" }}>
                {film.release_date ? film.release_date.slice(0, 4) : "—"}
                {film.vote_average > 0 && <span className="text-gold"> · ★ {film.vote_average.toFixed(1)}</span>}
              </p>
            </div>
          ))}
        </ScrollRow>
      </div>
    </section>
  );
};

export default TrendingRow;
