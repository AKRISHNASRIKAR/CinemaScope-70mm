import { Fragment, Suspense, useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher, parallelFetcher } from "@/lib/api/fetcher";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import TvIcon from "@mui/icons-material/Tv";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StarIcon from "@mui/icons-material/Star";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import { FilmDetailHeroSkeleton, CastSectionSkeleton, SimilarMoviesSkeleton } from "@/components/ui/Skeletons";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { posterUrl, backdropUrl, profileUrl } from "@/lib/utils/tmdbImage";
import { ShareCardButton } from "@/features/share-card";

const INITIAL_CAST = 8;
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 1.5, -1, 2.5, -3, 0.5];

/* ── Key crew ──────────────────────────────────────────────────────
   Director only for now. Kept as a table because TMDB spells roles
   several ways and adding writer/composer later is one more row.
─────────────────────────────────────────────────────────────────── */
const CREW_ROLES = [
  { label: "Directed by", jobs: ["Director"] },
];

/** Some films credit eight writers — show three and count the rest. */
const MAX_CREW_NAMES = 3;

/**
 * Pull the key crew out of TMDB's flat `crew` array.
 * Dedupes by person id, because TMDB frequently lists the same person
 * twice under different job titles (Villeneuve is Director *and* Screenplay).
 */
function keyCrew(crew = []) {
  return CREW_ROLES.map(({ label, jobs }) => {
    const people = [
      ...new Map(
        crew.filter((c) => jobs.includes(c.job)).map((c) => [c.id, c])
      ).values(),
    ];
    if (!people.length) return null;
    return { label, people: people.slice(0, MAX_CREW_NAMES), extra: people.length - MAX_CREW_NAMES };
  }).filter(Boolean);
}

/* ── Key crew block ───────────────────────────────────────────────
   Fetched with the SAME SWR key as <CastSection/>, so the two share one
   cache entry and one network request. Deliberately NOT suspense: the
   hero's title and poster shouldn't wait on a credits call. Space is
   reserved while it loads so the panel doesn't shift underneath.
─────────────────────────────────────────────────────────────────── */
const KeyCrew = ({ id }) => {
  const { data: credits } = useSWR(`/movie/${id}/credits`, fetcher);
  const navigate = useNavigate();

  const rows = credits ? keyCrew(credits.crew) : [];
  const loading = !credits;

  // Nothing to show and nothing coming — collapse entirely.
  if (!loading && rows.length === 0) return null;

  const labelStyle = {
    fontSize: "clamp(0.45rem, 0.72vw, 0.58rem)",
    letterSpacing: "0.22em",
  };
  const valueStyle = { fontSize: "clamp(0.68rem, 1.02vw, 0.85rem)" };

  return (
    /* Stacked on phones, two-column from `sm` up — a genuine layout *change*
       rather than continuous scaling, so a breakpoint beats clamp() here:
       beside the poster at 390px the metadata column is only ~220px. */
    <dl
      className="grid items-baseline grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)]"
      style={{
        columnGap: "clamp(0.6rem, 1.4vw, 1.1rem)",
        rowGap: "clamp(0.15rem, 0.4vh, 0.3rem)",
        marginTop: "clamp(0.6rem, 1.5vh, 1rem)",
        /* Reserve the row height so the rating and pills below don't
           jump when credits land. */
        minHeight: loading ? "clamp(1rem, 2vh, 1.3rem)" : undefined,
      }}
    >
      {loading
        ? [0].map((i) => (
            <Fragment key={i}>
              <dt className="skeleton rounded-sm" style={{ height: "0.55rem", width: "clamp(3.5rem,6vw,5rem)" }} aria-hidden />
              <dd className="skeleton rounded-sm" style={{ height: "0.55rem", width: "42%" }} aria-hidden />
            </Fragment>
          ))
        : rows.map(({ label, people, extra }) => (
            <Fragment key={label}>
              {/* mt on mobile separates stacked pairs; reset once two-column */}
              <dt
                className="font-mono text-muted uppercase whitespace-nowrap mt-[0.5rem] first:mt-0 sm:mt-0"
                style={labelStyle}
              >
                {label}
              </dt>
              <dd className="font-body text-white/80 min-w-0" style={valueStyle}>
                {people.map((p, i) => (
                  <Fragment key={p.id}>
                    {i > 0 && <span className="text-faint">, </span>}
                    <button
                      type="button"
                      onClick={() => navigate(`/person/${p.id}`)}
                      className="text-left hover:text-gold focus-visible:text-gold transition-colors duration-fast cursor-pointer bg-transparent border-0 p-0"
                      style={{ font: "inherit", color: "inherit" }}
                    >
                      {p.name}
                    </button>
                  </Fragment>
                ))}
                {extra > 0 && (
                  <span className="text-faint" style={{ marginLeft: "0.3rem" }}>
                    +{extra} more
                  </span>
                )}
              </dd>
            </Fragment>
          ))}
    </dl>
  );
};

/* ── Metadata pill ────────────────────────────────────────────── */
const Pill = ({ children, accent = false }) => (
  <span
    className={`font-mono uppercase rounded-full whitespace-nowrap ${
      accent ? "text-gold border-gold/40 bg-gold/[0.08]" : "text-white/55 border-white/10 bg-white/[0.04]"
    } border`}
    style={{
      fontSize: "clamp(0.5rem, 0.8vw, 0.68rem)",
      letterSpacing: "0.1em",
      padding: "clamp(0.2rem,0.45vh,0.35rem) clamp(0.55rem,1.1vw,0.85rem)",
    }}
  >
    {children}
  </span>
);

/* ── Film Hero Section ────────────────────────── */
const FilmHero = ({ id }) => {
  const { data } = useSWR([`/movie/${id}`, `/movie/${id}/release_dates`], parallelFetcher, { suspense: true });
  const [film, releaseDates] = data;
  const { addFilm } = useRecentlyViewed();

  // Record this film as recently viewed on mount
  useEffect(() => { addFilm(film); }, [film, addFilm]);

  const us = releaseDates.results?.find((e) => e.iso_3166_1 === "US");
  const certification = us?.release_dates?.[0]?.certification || null;

  const backdrop = backdropUrl(film.backdrop_path);
  const posterSrc = posterUrl(film.poster_path, "w500") ?? "/fallback-image-film.jpg";

  const year = film.release_date ? film.release_date.slice(0, 4) : null;
  const runtime = film.runtime
    ? `${Math.floor(film.runtime / 60)}h ${film.runtime % 60}m`
    : null;

  return (
    <>
      {/* ── Full-bleed backdrop ─────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(42vh, 58vh, 72vh)" }}>
        {backdrop && (
          <>
            {/* Blurred, over-scaled bed — fills the frame at any aspect ratio */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${backdrop})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(36px) saturate(1.3)",
                transform: "scale(1.15)",
                opacity: 0.55,
              }}
            />
            <img
              src={backdrop}
              alt={film.title}
              loading="eager"
              fetchpriority="high"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "top center" }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/55 to-base/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-base/85 via-transparent to-base/40" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat", backgroundSize: "150px 150px",
          }}
        />
      </section>

      {/* ── Overlapping detail panel ────────────────────────── */}
      <div
        className="relative z-10 center-container"
        style={{ marginTop: "calc(-1 * clamp(5rem, 14vh, 11rem))" }}
      >
        <div
          className="rounded-card border border-white/[0.07]"
          style={{
            background: "rgba(9,9,9,0.62)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "clamp(1rem, 2.5vw, 2.25rem)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.75)",
          }}
        >
          <div className="flex items-start" style={{ gap: "clamp(1rem, 3vw, 2.5rem)" }}>
            {/* Poster — scales with the panel, never wraps */}
            <div style={{ flex: "0 0 clamp(120px, 26%, 280px)" }}>
              <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card-hover">
                <img
                  src={posterSrc}
                  alt={film.title}
                  loading="eager"
                  fetchpriority="high"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Metadata */}
            <div style={{ flex: "1 1 0%", minWidth: 0 }}>
              <h1
                className="font-display font-bold text-white leading-[0.95] tracking-tight"
                style={{ fontSize: "clamp(1.4rem, 4.2vw, 3.5rem)" }}
              >
                {film.title}
              </h1>

              {film.tagline && (
                <p
                  className="font-body italic text-muted"
                  style={{ fontSize: "clamp(0.68rem, 1.2vw, 1rem)", marginTop: "clamp(0.35rem, 0.8vh, 0.6rem)" }}
                >
                  {film.tagline}
                </p>
              )}

              {/* Key crew — director, writer, composer, cinematographer */}
              <KeyCrew id={id} />

              {/* Rating */}
              <div className="flex items-center" style={{ gap: "0.4rem", marginTop: "clamp(0.6rem, 1.6vh, 1.1rem)" }}>
                <StarIcon sx={{ fontSize: "clamp(1rem, 1.8vw, 1.5rem)", color: "#c9a843" }} />
                <span className="font-mono font-semibold text-gold" style={{ fontSize: "clamp(1rem, 2vw, 1.6rem)" }}>
                  {film.vote_average ? film.vote_average.toFixed(1) : "—"}
                </span>
                <span className="font-mono text-muted" style={{ fontSize: "clamp(0.55rem, 0.95vw, 0.8rem)" }}>
                  / 10
                </span>
                {film.vote_count > 0 && (
                  <span className="font-mono text-faint" style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.68rem)" }}>
                    · {film.vote_count.toLocaleString()} votes
                  </span>
                )}
              </div>

              {/* Pill badges */}
              <div
                className="flex flex-wrap items-center"
                style={{ gap: "clamp(0.3rem, 0.7vw, 0.5rem)", marginTop: "clamp(0.7rem, 1.8vh, 1.15rem)" }}
              >
                {certification && <Pill accent>{certification}</Pill>}
                {year && <Pill>{year}</Pill>}
                {runtime && <Pill>{runtime}</Pill>}
                {film.original_language && <Pill>{film.original_language}</Pill>}
                {film.genres?.map((g) => <Pill key={g.id}>{g.name}</Pill>)}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center" style={{ gap: "0.75rem", marginTop: "clamp(0.9rem, 2.2vh, 1.5rem)" }}>
                <ShareCardButton film={film} />
              </div>

            </div>
          </div>

          {/* ── Synopsis — full panel width ──────────────────────
              Deliberately outside the poster/metadata row. In the metadata
              column it was reading at ~200px wide on a phone; full width it
              gets a proper measure, capped at 78ch so it doesn't sprawl on
              a wide desktop. */}
          {film.overview && (
            <div style={{ marginTop: "clamp(1.25rem, 3vh, 2rem)" }}>
              <p
                className="font-mono text-gold uppercase"
                style={{ fontSize: "clamp(0.45rem, 0.75vw, 0.6rem)", letterSpacing: "0.28em", marginBottom: "clamp(0.35rem,0.8vh,0.6rem)" }}
              >
                Synopsis
              </p>
              <p
                className="font-body text-white/70 leading-relaxed"
                style={{ fontSize: "clamp(0.72rem, 1.1vw, 0.95rem)", maxWidth: "78ch" }}
              >
                {film.overview}
              </p>
            </div>
          )}

          {film.release_date && (
            <p
              className="font-mono text-faint"
              style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.68rem)", marginTop: "clamp(0.75rem, 1.8vh, 1.25rem)" }}
            >
              Released {new Date(film.release_date).toDateString()}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Cast Section — polaroid wall ─────────────── */
const CastSection = ({ id }) => {
  const { data: credits } = useSWR(`/movie/${id}/credits`, fetcher, { suspense: true });
  const navigate = useNavigate();
  const [showAllCast, setShowAllCast] = useState(false);
  const [castInView, setCastInView] = useState(false);
  const castSectionRef = useRef(null);

  const cast = credits.cast || [];
  const visibleCast = showAllCast ? cast : cast.slice(0, INITIAL_CAST);

  useEffect(() => {
    const el = castSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setCastInView(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cast.length]);

  if (cast.length === 0) return null;

  return (
    <div
      ref={castSectionRef}
      className="center-container"
      style={{ marginTop: "clamp(2.5rem,5vh,4rem)", paddingBottom: "clamp(2rem,4vh,3rem)" }}
    >
      <div
        className="relative rounded-card overflow-hidden"
        style={{
          padding: "clamp(1.5rem,3vw,2.5rem)",
          background: "#0c0c0c",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      >
        <h2 className="font-display font-bold text-white text-center" style={{ fontSize: "clamp(1.2rem,2vw,1.6rem)", marginBottom: "clamp(1.5rem,3vh,2rem)" }}>
          Cast
        </h2>

        <div
          className="grid justify-items-center transition-all duration-slow overflow-hidden"
          style={{
            /* Fluid equivalent of the old 2 / 3 / 4 column grid */
            gridTemplateColumns: "repeat(auto-fill, minmax(clamp(140px, 22vw, 240px), 1fr))",
            gap: "clamp(1rem,2vw,1.5rem)",
          }}
        >
          {visibleCast.map((member, i) => {
            const rot = ROTATIONS[i % ROTATIONS.length];
            const imgSrc = member.profile_path ? profileUrl(member.profile_path, "w200") : null;

            return (
              <div
                key={`${member.id}-${member.credit_id}`}
                onClick={() => navigate(`/person/${member.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/person/${member.id}`); } }}
                role="button"
                tabIndex={0}
                aria-label={member.name}
                className="cursor-pointer w-full max-w-[clamp(110px,14vw,160px)] mx-auto outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                style={{ transform: `rotate(${rot}deg)`, transition: "transform 200ms ease, box-shadow 200ms ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "rotate(0deg) translateY(-4px)";
                  e.currentTarget.style.boxShadow = "4px 6px 20px rgba(0,0,0,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${rot}deg)`;
                  e.currentTarget.style.boxShadow = "3px 4px 14px rgba(0,0,0,0.35)";
                }}
              >
                <div className="bg-white/95 flex flex-col" style={{ padding: "clamp(6px,0.8vw,10px) clamp(6px,0.8vw,10px) clamp(18px,2.5vw,28px)", boxShadow: "3px 4px 14px rgba(0,0,0,0.35)", borderRadius: "2px" }}>
                  <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ borderRadius: "1px" }}>
                    {castInView ? (
                      imgSrc ? (
                        <LazyImage src={imgSrc} alt={member.name} fallbackType="person" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full bg-[#ddd] flex items-center justify-center">
                          <PersonOutlineIcon sx={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#aaa" }} />
                        </div>
                      )
                    ) : (
                      <div className="skeleton w-full h-full" aria-hidden />
                    )}
                  </div>
                  <div style={{ paddingTop: "clamp(6px,0.8vw,10px)" }}>
                    <p className="font-mono font-medium text-ink uppercase leading-tight line-clamp-1" style={{ fontSize: "clamp(0.45rem,0.7vw,0.6rem)", letterSpacing: "0.08em" }}>{member.name}</p>
                    {member.character && <p className="font-body text-ink-muted leading-tight line-clamp-1" style={{ fontSize: "clamp(0.4rem,0.6vw,0.5rem)", marginTop: "2px" }}>{member.character}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {cast.length > INITIAL_CAST && (
          <div className="flex justify-center" style={{ marginTop: "clamp(1.5rem,3vh,2rem)" }}>
            <button
              onClick={() => setShowAllCast((v) => !v)}
              className="flex items-center gap-2 font-body font-medium uppercase tracking-[0.15em] border border-gold/40 text-white/60 hover:bg-gold/10 hover:text-white hover:border-gold/70 transition-all duration-normal cursor-pointer bg-transparent rounded-card"
              style={{ fontSize: "clamp(0.6rem,0.9vw,0.75rem)", padding: "0.75rem 2rem" }}
            >
              {showAllCast ? <>Show Less <KeyboardArrowUpIcon /></> : <>View Full Cast <KeyboardArrowDownIcon /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Watch Providers ───────────────────────────────────────────── */
const WatchProviders = ({ id }) => {
  const { data } = useSWR(`/movie/${id}/watch/providers`, fetcher, { suspense: true });
  // Use US region; fall back to first available region
  const regions = data?.results ?? {};
  const us = regions["US"];
  const regionData = us ?? Object.values(regions)[0] ?? null;

  if (!regionData) return null;

  const flatrate = regionData.flatrate ?? [];  // streaming
  const rent     = regionData.rent     ?? [];  // rent
  const buy      = regionData.buy      ?? [];  // buy

  if (!flatrate.length && !rent.length && !buy.length) return null;

  /* Provider pill — logo + name on one capsule */
  const ProviderPill = ({ p }) => (
    <div
      className="flex items-center rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-gold/30 transition-colors duration-normal"
      style={{ gap: "clamp(0.4rem,0.8vw,0.6rem)", padding: "clamp(0.25rem,0.5vw,0.35rem) clamp(0.6rem,1.2vw,0.9rem) clamp(0.25rem,0.5vw,0.35rem) clamp(0.25rem,0.5vw,0.35rem)" }}
      title={p.provider_name}
    >
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: "clamp(1.35rem,2.4vw,1.9rem)", height: "clamp(1.35rem,2.4vw,1.9rem)" }}
      >
        <img
          src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
          alt={p.provider_name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <span
        className="font-body text-white/70 whitespace-nowrap"
        style={{ fontSize: "clamp(0.55rem,0.9vw,0.75rem)" }}
      >
        {p.provider_name}
      </span>
    </div>
  );

  const Group = ({ label, list }) =>
    list.length === 0 ? null : (
      <div className="flex flex-wrap items-center" style={{ gap: "clamp(0.5rem,1.2vw,0.85rem)" }}>
        <p
          className="font-mono text-muted uppercase"
          style={{ fontSize: "clamp(0.45rem,0.75vw,0.6rem)", letterSpacing: "0.22em", width: "clamp(2.6rem,5vw,3.5rem)" }}
        >
          {label}
        </p>
        {list.map((p) => <ProviderPill key={p.provider_id} p={p} />)}
      </div>
    );

  return (
    <div className="center-container" style={{ marginBottom: "clamp(2rem,4vh,3rem)" }}>
      <div
        className="rounded-card border border-white/[0.07] bg-white/[0.02]"
        style={{ padding: "clamp(1.25rem,3vw,2rem)" }}
      >
        <div className="flex items-center justify-between flex-wrap" style={{ gap: "0.75rem", marginBottom: "clamp(1rem,2vh,1.5rem)" }}>
          <div className="flex items-center gap-2">
            <TvIcon sx={{ fontSize: "clamp(0.9rem,1.4vw,1.1rem)", color: "#c9a843" }} />
            <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(1rem,1.8vw,1.3rem)" }}>
              Where to Watch
            </h2>
          </div>
          {regionData.link && (
            <a
              href={regionData.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-body text-muted hover:text-gold transition-colors duration-fast"
              style={{ fontSize: "clamp(0.6rem,0.9vw,0.75rem)" }}
              aria-label="View all providers on TMDB"
            >
              All providers <OpenInNewIcon sx={{ fontSize: "0.75rem" }} />
            </a>
          )}
        </div>

        <div className="flex flex-col" style={{ gap: "clamp(0.75rem,1.8vh,1.25rem)" }}>
          <Group label="Stream" list={flatrate} />
          <Group label="Rent"   list={rent} />
          <Group label="Buy"    list={buy} />
        </div>

        <p className="font-body text-faint" style={{ fontSize: "clamp(0.5rem,0.75vw,0.6rem)", marginTop: "clamp(1rem,2vh,1.5rem)" }}>
          Powered by JustWatch via TMDB
        </p>
      </div>
    </div>
  );
};

/* ── Similar Movies ────────────────────────────────────────────── */
const SimilarMovies = ({ id }) => {
  const { data: similar } = useSWR(`/movie/${id}/similar`, fetcher, { suspense: true });
  const movies = similar.results || [];

  if (movies.length === 0) return null;

  return (
    <div className="center-container" style={{ marginTop: "clamp(2.5rem,5vh,4rem)", paddingBottom: "clamp(2rem,4vh,3rem)" }}>
      <h2
        className="font-display font-bold text-white"
        style={{ fontSize: "clamp(1.2rem,2vw,1.6rem)", marginBottom: "clamp(1rem,2vh,1.5rem)" }}
      >
        More Like This
      </h2>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(clamp(130px, 16vw, 190px), 1fr))",
          gap: "clamp(0.75rem, 2vw, 1.25rem)",
        }}
      >
        {movies.slice(0, 10).map((m) => (
          <FilmCard
            key={m.id}
            film={m}
            subtitle={m.release_date ? m.release_date.slice(0, 4) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Main Page Container ───────────────────────────────────────── */
const FilmPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-base text-white">
      {/* Back Button — fixed position, no wrapper needed */}
      <BackButton fallbackRoute="/" />

      {/* Hero Section - Highest Priority */}
      <ErrorBoundary>
        <Suspense fallback={<FilmDetailHeroSkeleton />}>
          <FilmHero id={id} />
        </Suspense>
      </ErrorBoundary>

      {/* Cast Section - Independent Loading */}
      <ErrorBoundary>
        <Suspense fallback={<CastSectionSkeleton />}>
          <CastSection id={id} />
        </Suspense>
      </ErrorBoundary>

      {/* Watch Providers - Independent Loading */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <WatchProviders id={id} />
        </Suspense>
      </ErrorBoundary>

      {/* Similar Movies - Lowest Priority */}
      <ErrorBoundary>
        <Suspense fallback={<SimilarMoviesSkeleton />}>
          <SimilarMovies id={id} />
        </Suspense>
      </ErrorBoundary>

      <Footer />
    </div>
  );
};

export default FilmPage;
