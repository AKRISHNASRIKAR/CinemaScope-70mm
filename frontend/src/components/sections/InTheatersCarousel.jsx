import { memo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import LazyImage from "@/components/ui/LazyImage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { backdropUrl, posterUrl } from "@/lib/utils/tmdbImage";

const imageFor = (film) =>
  backdropUrl(film.backdrop_path, "w780") ??
  posterUrl(film.poster_path, "w500") ??
  "/fallback-image-film.jpg";

const titleFor = (film) => film.title || film.name || "Untitled film";

const InTheatersCarousel = ({
  films = [],
  isDark = true,
  title = "IN THEATERS",
  badgeLabel = "IN THEATERS",
  ariaLabel = "In theaters carousel",
  scrollLabel = title,
  emptyMessage = "No theatrical releases available right now.",
  getHref = (film) => `/film/${film.id}`,
  getAriaLabel,
  external = false,
  showHeading = true,
  compact = false,
}) => {
  const stripRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const scrollBy = useCallback((direction) => {
    const strip = stripRef.current;
    if (!strip) return;

    const amount = Math.min(strip.clientWidth * 0.86, compact ? 520 : 760);
    strip.scrollBy({
      left: amount * direction,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [compact, reduceMotion]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollBy(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollBy(1);
    }
  }, [scrollBy]);

  if (!films.length) {
    return (
      <div
        className={`rounded-card border text-center ${isDark ? "border-white/10 text-white/45" : "border-black/10 text-ink-muted"}`}
        style={{ padding: "clamp(1.5rem, 4vw, 3rem)" }}
      >
        <p className="font-body" style={{ fontSize: "clamp(0.75rem, 1.1vw, 0.9rem)" }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  const textColor = isDark ? "text-white" : "text-ink";
  const mutedColor = isDark ? "text-white/55" : "text-ink-muted";
  const arrowClass = isDark
    ? "border-white/10 bg-white/[0.06] text-white/55 hover:border-white/25 hover:bg-white/10 hover:text-white"
    : "border-black/10 bg-black/[0.04] text-black/55 hover:border-black/25 hover:bg-black/[0.08] hover:text-black";

  return (
    <div className="w-full">
      {showHeading && (
        <div
          className="flex items-end justify-between"
          style={{ gap: "clamp(1rem, 3vw, 2rem)", marginBottom: "clamp(0.85rem, 1.8vw, 1.4rem)" }}
        >
          <h2
            className={`font-wordmark font-black uppercase leading-none ${textColor}`}
            style={{
              fontSize: compact ? "clamp(1.2rem, 2.5vw, 2rem)" : "clamp(2.2rem, 7vw, 6.25rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {title}
          </h2>

          <div className="hidden sm:flex items-center" style={{ gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className={`flex items-center justify-center rounded-full border transition-all duration-normal hover:scale-[1.06] active:scale-[0.98] ${arrowClass}`}
              style={{ width: "2.35rem", height: "2.35rem" }}
              aria-label={`Scroll ${scrollLabel.toLowerCase()} left`}
            >
              <ChevronLeftIcon sx={{ fontSize: "1.1rem" }} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className={`flex items-center justify-center rounded-full border transition-all duration-normal hover:scale-[1.06] active:scale-[0.98] ${arrowClass}`}
              style={{ width: "2.35rem", height: "2.35rem" }}
              aria-label={`Scroll ${scrollLabel.toLowerCase()} right`}
            >
              <ChevronRightIcon sx={{ fontSize: "1.1rem" }} />
            </button>
          </div>
        </div>
      )}

      <div
        ref={stripRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex overflow-x-auto scrollbar-hide outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          gap: "clamp(0.9rem, 2vw, 1.4rem)",
          scrollSnapType: "x mandatory",
          scrollPaddingInline: "0.125rem",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "0.65rem",
        }}
      >
        {films.map((film) => {
          const titleText = titleFor(film);
          const href = getHref(film);
          const isExternal = typeof external === "function" ? external(film) : external;
          const label = getAriaLabel?.(film) ?? `Open ${titleText}`;
          const card = (
            <>
              <div
                className="relative aspect-[16/9] overflow-hidden rounded-card bg-surface shadow-card"
                style={{ boxShadow: isDark ? "0 22px 60px rgba(0,0,0,0.42)" : "0 20px 55px rgba(0,0,0,0.16)" }}
              >
                <LazyImage
                  src={imageFor(film)}
                  alt=""
                  fallbackType="backdrop"
                  className="h-full w-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-[1.035]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 transition-opacity duration-normal group-hover:opacity-100"
                  style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.02) 42%, rgba(0,0,0,0.24))" }}
                />
                <span
                  className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-3 py-1 font-mono text-white backdrop-blur-md"
                  style={{ fontSize: "clamp(0.48rem, 0.8vw, 0.62rem)", letterSpacing: "0.16em" }}
                >
                  {badgeLabel}
                </span>
              </div>

              <div
                className="flex items-baseline justify-between"
                style={{ gap: "clamp(0.65rem, 1.4vw, 1rem)", marginTop: "clamp(0.55rem, 1.2vw, 0.8rem)" }}
              >
                <h3
                  className={`min-w-0 truncate font-wordmark font-black uppercase transition-colors duration-fast group-hover:text-gold ${textColor}`}
                  style={{ fontSize: compact ? "clamp(0.72rem, 1.25vw, 0.92rem)" : "clamp(0.86rem, 1.45vw, 1.15rem)" }}
                >
                  {titleText}
                </h3>
                {film.release_date && (
                  <span
                    className={`flex-shrink-0 font-mono ${mutedColor}`}
                    style={{ fontSize: "clamp(0.5rem, 0.82vw, 0.62rem)" }}
                    aria-hidden
                  >
                    {film.release_date.slice(0, 4)}
                  </span>
                )}
              </div>
            </>
          );

          return isExternal ? (
            <a
              key={film.id}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="group flex-shrink-0 outline-none"
              style={{
                width: compact ? "clamp(230px, 38vw, 460px)" : "clamp(280px, 56vw, 680px)",
                scrollSnapAlign: "start",
              }}
            >
              {card}
            </a>
          ) : (
            <Link
              key={film.id}
              to={href}
              aria-label={label}
              className="group flex-shrink-0 outline-none"
              style={{
                width: compact ? "clamp(230px, 38vw, 460px)" : "clamp(280px, 56vw, 680px)",
                scrollSnapAlign: "start",
              }}
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default memo(InTheatersCarousel);
