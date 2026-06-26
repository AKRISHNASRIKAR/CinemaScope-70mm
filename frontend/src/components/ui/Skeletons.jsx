import React from "react";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";

/* ── Base Shimmer ──────────────────────────────────────────────── */
const Shimmer = ({ className = "", style = {}, showIcon = false }) => (
  <div
    className={`skeleton rounded-[inherit] relative flex items-center justify-center ${className}`}
    style={{ width: "100%", height: "100%", ...style }}
  >
    {showIcon && (
      <MovieCreationIcon
        sx={{ color: "rgba(255,255,255,0.05)", fontSize: "clamp(2rem, 4vw, 3rem)" }}
      />
    )}
  </div>
);

/* ── Home Hero Skeleton (90vh — matches Hero section height) ───── */
export const HomeHeroSkeleton = () => (
  <div className="relative w-full overflow-hidden bg-base" style={{ height: "90vh", minHeight: "560px" }}>
    <Shimmer className="absolute inset-0" />
    <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
  </div>
);

/* ── Film Detail Hero Skeleton (matches FilmPage backdrop height) ─ */
export const FilmDetailHeroSkeleton = () => (
  <div
    className="relative w-full overflow-hidden bg-base"
    style={{ height: "clamp(40vh, 55vh, 65vh)" }}
  >
    <Shimmer className="absolute inset-0" />
    <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
  </div>
);

/* ── Cast Section Skeleton ─────────────────────────────────────── */
/*
 * Real card: max-w-[clamp(110px,14vw,160px)], aspect-[3/4],
 *            white bg, padding clamp(6px,0.8vw,10px) on sides/top
 *            and clamp(18px,2.5vw,28px) on bottom (polaroid caption space).
 * Initial cast shown: INITIAL_CAST = 8
 */
export const CastSectionSkeleton = () => (
  <div
    className="center-container"
    style={{ marginTop: "clamp(2.5rem,5vh,4rem)", paddingBottom: "clamp(2rem,4vh,3rem)" }}
  >
    <div
      className="relative rounded-card overflow-hidden"
      style={{ padding: "clamp(1.5rem,3vw,2.5rem)", background: "#0c0c0c" }}
    >
      {/* "Cast" heading placeholder */}
      <div
        className="skeleton rounded mx-auto"
        style={{
          height: "clamp(1.2rem,2vw,1.6rem)",
          width: "4rem",
          marginBottom: "clamp(1.5rem,3vh,2rem)",
        }}
      />

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center"
        style={{ gap: "clamp(1rem,2vw,1.5rem)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          /* Outer wrapper matches real card max-width */
          <div
            key={i}
            className="w-full mx-auto"
            style={{ maxWidth: "clamp(110px,14vw,160px)" }}
          >
            {/* White polaroid shell */}
            <div
              className="bg-white/90 flex flex-col"
              style={{
                padding: `clamp(6px,0.8vw,10px) clamp(6px,0.8vw,10px) clamp(18px,2.5vw,28px)`,
                borderRadius: "2px",
                boxShadow: "3px 4px 14px rgba(0,0,0,0.35)",
              }}
            >
              {/* Photo area — aspect-[3/4] */}
              <div className="w-full aspect-[3/4]">
                <Shimmer style={{ borderRadius: "1px" }} />
              </div>
              {/* Caption lines */}
              <div style={{ paddingTop: "clamp(6px,0.8vw,10px)" }}>
                <div className="skeleton rounded" style={{ height: "0.5rem", width: "80%" }} />
                <div className="skeleton rounded mt-1" style={{ height: "0.4rem", width: "55%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Genre Row Grid Skeleton ───────────────────────────────────── */
/*
 * Used inside GenreRow — matches the 2/3/4 column grid of GenreRowContent.
 * Shows exactly 4 cards (FILMS_PER_PAGE).
 */
export const GenreRowSkeleton = () => (
  <div
    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
    style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)", marginTop: "clamp(0.75rem, 1.5vh, 1rem)" }}
  >
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex flex-col">
        <div className="aspect-[2/3] rounded-card bg-white/5">
          <Shimmer showIcon />
        </div>
        <div className="skeleton rounded mt-2" style={{ height: "0.75rem", width: "75%" }} />
        <div className="skeleton rounded mt-1" style={{ height: "0.6rem", width: "45%" }} />
      </div>
    ))}
  </div>
);

/* ── Film Row Skeleton ─────────────────────────────────────────── */
/*
 * Used for: SimilarMovies (FilmPage) and FilmographyRow (Person page).
 * Real filmography card width: clamp(100px, 12vw, 180px), aspect-[2/3].
 */
export const FilmRowSkeleton = ({ count = 5 }) => (
  <div className="flex overflow-hidden pb-4" style={{ gap: "clamp(0.75rem, 1.5vw, 1.25rem)" }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0 flex flex-col"
        style={{ width: "clamp(100px, 12vw, 180px)" }}
      >
        <div className="aspect-[2/3] rounded-card bg-white/5">
          <Shimmer showIcon />
        </div>
        <div className="skeleton rounded mt-2" style={{ height: "0.75rem", width: "75%" }} />
        <div className="skeleton rounded mt-1" style={{ height: "0.6rem", width: "40%" }} />
      </div>
    ))}
  </div>
);

/* ── Similar Movies Row Skeleton ───────────────────────────────── */
/*
 * Used for SimilarMovies section — 5 cards in a grid,
 * matching grid-cols-2 sm:3 lg:4 xl:5 with aspect-[2/3].
 */
export const SimilarMoviesSkeleton = () => (
  <div
    className="center-container"
    style={{ marginTop: "4rem", paddingBottom: "3rem" }}
  >
    {/* Section heading placeholder */}
    <div className="skeleton rounded" style={{ height: "clamp(1.2rem,2vw,1.6rem)", width: "10rem", marginBottom: "1.5rem" }} />
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[2/3] rounded-card bg-white/5">
            <Shimmer showIcon />
          </div>
          <div className="skeleton rounded mt-2" style={{ height: "0.75rem", width: "75%" }} />
          <div className="skeleton rounded mt-1" style={{ height: "0.6rem", width: "45%" }} />
        </div>
      ))}
    </div>
  </div>
);

/* ── Person Header Skeleton ────────────────────────────────────── */
/*
 * Real layout: flex-col sm:flex-row, left col sm:w-[38%] lg:w-[35%],
 * portrait aspect-[2/3], right col has name + bio lines.
 * Wrapped in center-container with paddingTop matching the page.
 */
export const PersonHeaderSkeleton = () => (
  <div className="flex flex-col sm:flex-row" style={{ gap: "clamp(1.5rem, 4vw, 3rem)" }}>
    {/* Left: portrait */}
    <div className="sm:w-[38%] lg:w-[35%] flex-shrink-0">
      <div
        className="w-full aspect-[2/3] bg-white/5"
        style={{ borderRadius: "8px" }}
      >
        <Shimmer />
      </div>
    </div>

    {/* Right: text */}
    <div className="flex-1 min-w-0" style={{ paddingTop: "clamp(1rem,2vh,1.5rem)" }}>
      {/* Department label */}
      <div className="skeleton rounded" style={{ height: "0.6rem", width: "5rem", marginBottom: "clamp(0.5rem,1vh,0.75rem)" }} />
      {/* Name */}
      <div className="skeleton rounded" style={{ height: "clamp(2rem,5vw,4rem)", width: "70%" }} />
      {/* Bio lines */}
      <div style={{ marginTop: "clamp(1.5rem,3vh,2.5rem)" }}>
        <div className="skeleton rounded" style={{ height: "0.85rem", width: "100%", marginBottom: "0.6rem" }} />
        <div className="skeleton rounded" style={{ height: "0.85rem", width: "100%", marginBottom: "0.6rem" }} />
        <div className="skeleton rounded" style={{ height: "0.85rem", width: "100%", marginBottom: "0.6rem" }} />
        <div className="skeleton rounded" style={{ height: "0.85rem", width: "80%", marginBottom: "0.6rem" }} />
        <div className="skeleton rounded" style={{ height: "0.85rem", width: "65%" }} />
      </div>
    </div>
  </div>
);

/* ── Film Grid Skeleton ────────────────────────────────────────── */
/*
 * Used for GenrePage grid and SearchPage results.
 * Matches: gridTemplateColumns auto-fill minmax(clamp(130px,18vw,200px),1fr)
 */
export const FilmGridSkeleton = ({ count = 12 }) => (
  <div
    className="grid"
    style={{
      gridTemplateColumns: "repeat(auto-fill, minmax(clamp(130px, 18vw, 200px), 1fr))",
      gap: "clamp(0.75rem, 2vw, 1.5rem)",
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col">
        <div className="aspect-[2/3] rounded-card bg-white/5">
          <Shimmer showIcon />
        </div>
        <div className="skeleton rounded mt-2" style={{ height: "0.75rem", width: "75%" }} />
        <div className="skeleton rounded mt-1" style={{ height: "0.6rem", width: "45%" }} />
      </div>
    ))}
  </div>
);
