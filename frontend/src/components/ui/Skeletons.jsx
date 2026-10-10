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

/* ── Home Hero Skeleton (full viewport — matches Hero section height) ───── */
export const HomeHeroSkeleton = () => (
  <div className="relative min-h-screen w-full overflow-hidden bg-base" style={{ minHeight: "100svh" }}>
    <Shimmer className="absolute inset-0" />
    <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
  </div>
);

/* ── Film page section heading placeholder (ruled eyebrow + title) ─ */
const SectionHeadingSkeleton = ({ width = "12rem" }) => (
  <div
    className="border-y border-white/10"
    style={{ padding: "clamp(0.9rem, 2vw, 1.25rem) 0", marginBottom: "clamp(1.25rem, 3vw, 2rem)" }}
  >
    <div className="skeleton rounded" style={{ height: "0.6rem", width: "5rem", marginBottom: "clamp(0.6rem, 1.3vw, 0.9rem)" }} />
    <div className="skeleton rounded" style={{ height: "clamp(1.55rem, 3.95vw, 3.35rem)", width, maxWidth: "70%" }} />
  </div>
);

const FILM_SECTION_PADDING = { paddingTop: "clamp(2rem, 5vw, 4rem)", paddingBottom: "clamp(1rem, 2.5vw, 2rem)" };

/* ── Film Detail Hero Skeleton (matches FilmHero: poster rail + text column) ─ */
export const FilmDetailHeroSkeleton = () => (
  <section
    className="bg-base"
    style={{
      paddingTop: "calc(var(--navbar-height, 3.5rem) + clamp(2rem, 4.5vw, 4rem))",
      paddingBottom: "clamp(1.5rem, 4vw, 3rem)",
    }}
  >
    <div className="center-container">
      <div className="film-hero-grid">
        <div className="film-hero-poster">
          <div
            className="rounded-card border border-white/10 bg-white/[0.035]"
            style={{ padding: "clamp(0.6rem, 1.2vw, 0.9rem)" }}
          >
            <div className="aspect-[2/3] rounded-card bg-white/5">
              <Shimmer showIcon />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="skeleton rounded" style={{ height: "0.6rem", width: "11rem", marginBottom: "clamp(0.75rem, 1.6vw, 1.1rem)" }} />
          <div className="skeleton rounded" style={{ height: "clamp(1.85rem, 4.9vw, 4.4rem)", width: "70%" }} />
          <div
            className="border-y border-white/10"
            style={{ padding: "clamp(0.8rem, 1.6vw, 1.05rem) 0", marginTop: "clamp(1.1rem, 2.4vw, 1.75rem)" }}
          >
            <div className="skeleton rounded" style={{ height: "clamp(1.5rem, 2.6vw, 2.1rem)", width: "14rem", maxWidth: "80%" }} />
          </div>
          <div style={{ marginTop: "clamp(1.1rem, 2.4vw, 1.75rem)", maxWidth: "68ch" }}>
            <div className="skeleton rounded" style={{ height: "0.85rem", width: "100%", marginBottom: "0.6rem" }} />
            <div className="skeleton rounded" style={{ height: "0.85rem", width: "100%", marginBottom: "0.6rem" }} />
            <div className="skeleton rounded" style={{ height: "0.85rem", width: "70%" }} />
          </div>
        </div>

        <div className="film-hero-actions rounded-card border border-white/10 bg-white/[0.035]" style={{ height: "15rem" }}>
          <Shimmer />
        </div>
      </div>
    </div>
  </section>
);

/* ── Cast Section Skeleton ─────────────────────────────────────── */
/*
 * Real card: aspect-[4/5] portrait + name + character lines,
 * in a 2 / 4 / 8 column grid. Initial cast shown: INITIAL_CAST = 8
 */
export const CastSectionSkeleton = () => (
  <div className="center-container" style={FILM_SECTION_PADDING}>
    <SectionHeadingSkeleton width="7rem" />
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8" style={{ gap: "clamp(0.85rem, 1.8vw, 1.35rem)" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="min-w-0">
          <div className="aspect-[4/5] rounded-card bg-white/5">
            <Shimmer />
          </div>
          <div className="skeleton rounded mt-3" style={{ height: "0.75rem", width: "80%" }} />
          <div className="skeleton rounded mt-1" style={{ height: "0.6rem", width: "55%" }} />
        </div>
      ))}
    </div>
  </div>
);

/* ── Genre Row Carousel Skeleton ───────────────────────────────── */
/*
 * Used inside GenreRow — matches the wide editorial carousel treatment.
 */
export const GenreRowSkeleton = () => (
  <div
    className="flex overflow-hidden"
    style={{
      gap: "clamp(0.75rem, 2vw, 1.25rem)",
      marginTop: "clamp(1rem, 2vh, 1.5rem)",
    }}
  >
    {Array.from({ length: 2 }).map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0"
        style={{ width: "clamp(230px, 38vw, 460px)" }}
      >
        <div className="aspect-[16/9] overflow-hidden rounded-card bg-white/5">
          <Shimmer showIcon />
        </div>
        <div className="skeleton rounded mt-2" style={{ height: "0.75rem", width: "74%" }} />
        <div className="skeleton rounded mt-1" style={{ height: "0.55rem", width: "30%" }} />
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
 * Used for SimilarMovies section — 6 cards in a grid,
 * matching grid-cols-2 sm:3 lg:6 with aspect-[2/3].
 */
export const SimilarMoviesSkeleton = () => (
  <div
    className="center-container"
    style={{ ...FILM_SECTION_PADDING, paddingBottom: "clamp(3rem, 7vw, 6rem)" }}
  >
    <SectionHeadingSkeleton width="16rem" />
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
      style={{ gap: "clamp(0.85rem, 2vw, 1.45rem)" }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
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

/* ── Ported from the standalone frontend ──────────────────────── */
export const TrendingRowSkeleton = ({ count = 6 }) => (
  <section className="w-full bg-base" style={{ paddingTop: "clamp(1.5rem,3vw,2.5rem)", paddingBottom: "clamp(0.5rem,1vw,1rem)" }}>
    <div className="center-container">
      <div
        className="border-b border-white/[0.08]"
        style={{ paddingBottom: "clamp(0.5rem,1vh,0.75rem)", marginBottom: "clamp(0.85rem,1.8vh,1.25rem)" }}
      >
        <div className="skeleton rounded" style={{ height: "0.6rem", width: "4rem", marginBottom: "0.5rem" }} />
        <div className="skeleton rounded" style={{ height: "clamp(1.1rem,2vw,1.6rem)", width: "9rem" }} />
      </div>

      <div className="flex overflow-hidden pb-2" style={{ gap: "clamp(0.75rem,1.5vw,1.25rem)" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col" style={{ width: "clamp(118px, 13vw, 190px)" }}>
            <div className="aspect-[2/3] rounded-card bg-white/5">
              <Shimmer showIcon />
            </div>
            <div className="skeleton rounded" style={{ height: "0.7rem", width: "75%", marginTop: "clamp(0.4rem,0.8vh,0.6rem)" }} />
            <div className="skeleton rounded mt-1" style={{ height: "0.55rem", width: "45%" }} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const SearchResultsSkeleton = ({ rows = 5, people = 4 }) => (
  <div className="flex flex-wrap items-start" style={{ gap: "clamp(1.5rem, 4vw, 3.5rem)" }}>
    {/* Films column */}
    <div style={{ flex: "3 1 clamp(300px, 45vw, 620px)", minWidth: 0 }}>
      <div
        className="skeleton rounded"
        style={{ height: "clamp(1rem,1.8vw,1.4rem)", width: "6rem", marginBottom: "clamp(0.85rem,1.8vh,1.25rem)" }}
      />
      <div className="flex flex-col" style={{ gap: "clamp(0.5rem, 1.2vh, 0.85rem)" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-stretch rounded-card border border-white/[0.06] bg-white/[0.02]"
            style={{ gap: "clamp(0.75rem, 1.6vw, 1.25rem)", padding: "clamp(0.5rem, 1vw, 0.75rem)" }}
          >
            <div
              className="flex-shrink-0 rounded-card bg-white/5"
              style={{ width: "clamp(58px, 8vw, 92px)", aspectRatio: "2 / 3" }}
            >
              <Shimmer />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ gap: "0.5rem" }}>
              <div className="skeleton rounded" style={{ height: "clamp(0.9rem,1.6vw,1.25rem)", width: "55%" }} />
              <div className="skeleton rounded" style={{ height: "0.6rem", width: "30%" }} />
              <div className="skeleton rounded" style={{ height: "0.55rem", width: "90%" }} />
              <div className="skeleton rounded" style={{ height: "0.55rem", width: "70%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* People column */}
    <div style={{ flex: "1 1 clamp(240px, 24vw, 320px)", minWidth: 0 }}>
      <div
        className="skeleton rounded"
        style={{ height: "clamp(1rem,1.8vw,1.4rem)", width: "5rem", marginBottom: "clamp(0.85rem,1.8vh,1.25rem)" }}
      />
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(clamp(96px, 12vw, 132px), 1fr))",
          gap: "clamp(0.9rem, 2vw, 1.4rem)",
        }}
      >
        {Array.from({ length: people }).map((_, i) => (
          <div
            key={i}
            className="bg-white/90 flex flex-col"
            style={{
              padding: "clamp(6px,0.8vw,10px) clamp(6px,0.8vw,10px) clamp(18px,2.5vw,28px)",
              borderRadius: "2px",
              boxShadow: "3px 4px 14px rgba(0,0,0,0.35)",
            }}
          >
            <div className="w-full aspect-[3/4]">
              <Shimmer style={{ borderRadius: "1px" }} />
            </div>
            <div style={{ paddingTop: "clamp(6px,0.8vw,10px)" }}>
              <div className="skeleton rounded" style={{ height: "0.5rem", width: "80%" }} />
              <div className="skeleton rounded mt-1" style={{ height: "0.4rem", width: "55%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
