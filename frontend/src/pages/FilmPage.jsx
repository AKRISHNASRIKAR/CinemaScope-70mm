import { Fragment, Suspense, useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher, parallelFetcher } from "@/lib/api/fetcher";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import Footer from "@/components/layout/Footer";
import FilmActionCard from "@/components/sections/FilmActionCard";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import LazyImage from "@/components/ui/LazyImage";
import SEO from "@/components/seo/SEO";
import { FilmDetailHeroSkeleton, CastSectionSkeleton, SimilarMoviesSkeleton } from "@/components/ui/Skeletons";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { posterUrl, backdropUrl, profileUrl } from "@/lib/utils/tmdbImage";

const INITIAL_CAST = 8;

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
   cache entry and one request through the Edge Function proxy.
   Deliberately NOT suspense: the hero's title and poster shouldn't wait
   on a credits call. Space is reserved while it loads.
─────────────────────────────────────────────────────────────────── */
const KeyCrew = ({ id }) => {
  const { data: credits } = useSWR(`/movie/${id}/credits`, fetcher);
  const navigate = useNavigate();

  const rows = credits ? keyCrew(credits.crew) : [];
  const loading = !credits;

  if (!loading && rows.length === 0) return null;

  const labelStyle = { fontSize: "clamp(0.5rem, 0.78vw, 0.6rem)", letterSpacing: "0.2em" };
  const valueStyle = { fontSize: "clamp(0.78rem, 1.1vw, 0.95rem)" };

  return (
    /* Stacked on phones, two-column from `sm` up — a genuine layout *change*
       rather than continuous scaling, so a breakpoint beats clamp() here. */
    <dl
      className="grid items-baseline grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)]"
      style={{
        columnGap: "clamp(0.6rem, 1.4vw, 1.1rem)",
        rowGap: "clamp(0.15rem, 0.4vh, 0.3rem)",
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
              <dt
                className="font-mono text-white/38 uppercase whitespace-nowrap mt-[0.5rem] first:mt-0 sm:mt-0"
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

const toIsoDuration = (minutes) => {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `PT${hours ? `${hours}H` : ""}${mins ? `${mins}M` : ""}`;
};

const toDescription = (film) =>
  film.overview ||
  `${film.title} film details, cast, watch providers, similar movies, and ratings on CinemaScope.`;

const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return [hours ? `${hours}h` : null, mins ? `${mins}m` : null].filter(Boolean).join(" ");
};

const formatReleaseDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : null;

const GRAIN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

const GrainOverlay = ({ opacity = 0.1 }) => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 mix-blend-overlay"
    style={{ opacity, backgroundImage: GRAIN_URL, backgroundRepeat: "repeat", backgroundSize: "150px 150px" }}
  />
);

const SECTION_PADDING = { paddingTop: "clamp(2rem, 5vw, 4rem)", paddingBottom: "clamp(1rem, 2.5vw, 2rem)" };

/* ── Section heading ──────────────────────────────────────────────
   Same ruled eyebrow + wordmark treatment as the home sections and
   the person page filmography.
─────────────────────────────────────────────────────────────────── */
const SectionHeading = ({ id, eyebrow, title, aside }) => (
  <div
    className="flex flex-wrap items-end justify-between border-y border-white/10"
    style={{
      gap: "clamp(0.75rem, 2vw, 1.25rem)",
      padding: "clamp(0.9rem, 2vw, 1.25rem) 0",
      marginBottom: "clamp(1.25rem, 3vw, 2rem)",
    }}
  >
    <div className="min-w-0">
      <p
        className="font-mono uppercase text-gold"
        style={{
          fontSize: "clamp(0.52rem, 0.82vw, 0.64rem)",
          letterSpacing: "0.28em",
          marginBottom: "clamp(0.6rem, 1.3vw, 0.9rem)",
        }}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-wordmark font-black uppercase text-white"
        style={{ fontSize: "clamp(1.8rem, 4.6vw, 3.9rem)", lineHeight: 0.86, letterSpacing: "-0.055em" }}
      >
        {title}
      </h2>
    </div>
    {aside && (
      <div
        className="font-mono uppercase text-white/42"
        style={{ fontSize: "clamp(0.5rem, 0.78vw, 0.6rem)", letterSpacing: "0.18em" }}
      >
        {aside}
      </div>
    )}
  </div>
);

const PILL_CLASS =
  "inline-flex flex-shrink-0 items-center rounded-full border font-body font-semibold uppercase whitespace-nowrap transition-all duration-normal focus-ring";
const PILL_STYLE = {
  gap: "0.5rem",
  fontSize: "clamp(0.56rem, 0.82vw, 0.66rem)",
  letterSpacing: "0.16em",
  padding: "0.68rem 1.15rem",
};
const PILL_IDLE = "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25 hover:text-white";

/* ── Film Hero Section ────────────────────────── */
const FilmHero = ({ id }) => {
  const { data } = useSWR([`/movie/${id}`, `/movie/${id}/release_dates`], parallelFetcher, { suspense: true });
  const [film, releaseDates] = data;
  const { addFilm } = useRecentlyViewed();

  // Record this film as recently viewed on mount
  useEffect(() => { addFilm(film); }, [film, addFilm]);

  const us = releaseDates?.results?.find((e) => e.iso_3166_1 === "US");
  const certification = us?.release_dates?.find((entry) => entry.certification)?.certification || null;

  // Full-resolution backdrop for social/OG previews; a much lighter "w1280"
  // for the on-page hero, which never renders wider than the viewport.
  const backdropOg = backdropUrl(film.backdrop_path);
  const backdrop = backdropUrl(film.backdrop_path, "w1280");
  const posterSrc = posterUrl(film.poster_path, "w500") ?? "/fallback-image-film.jpg";
  const description = toDescription(film);
  const facts = [formatReleaseDate(film.release_date), certification, formatRuntime(film.runtime)].filter(Boolean);
  const genres = film.genres ?? [];

  return (
    <>
      <SEO
        title={film.title}
        description={description}
        image={backdropOg || posterSrc}
        type="video.movie"
        canonicalPath={`/film/${film.id}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Movie",
          name: film.title,
          description,
          image: posterSrc,
          datePublished: film.release_date || undefined,
          genre: film.genres?.map((genre) => genre.name),
          duration: toIsoDuration(film.runtime),
          aggregateRating: film.vote_average
            ? {
                "@type": "AggregateRating",
                ratingValue: film.vote_average.toFixed(1),
                ratingCount: film.vote_count || undefined,
                bestRating: 10,
                worstRating: 0,
              }
            : undefined,
        }}
      />

      <section
        className="relative isolate overflow-hidden bg-base text-white"
        style={{
          paddingTop: "calc(var(--navbar-height, 3.5rem) + clamp(2rem, 4.5vw, 4rem))",
          paddingBottom: "clamp(1.5rem, 4vw, 3rem)",
        }}
      >
        <div className="absolute inset-0 -z-10" aria-hidden>
          {backdrop && (
            <div className="absolute inset-x-0 top-0" style={{ height: "clamp(24rem, 82vh, 54rem)" }}>
              <img
                src={backdrop}
                alt=""
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-cover opacity-45"
                style={{ objectPosition: "top center" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-base via-base/70 to-base/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-base/85 via-base/20 to-transparent" />
            </div>
          )}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(201,168,67,0.1),transparent_30%)]" />
          <GrainOverlay />
        </div>

        <div className="center-container">
          <div className="film-hero-grid">
            <div className="film-hero-poster min-w-0">
              <div
                className="relative overflow-hidden rounded-card border border-white/10 bg-white/[0.035]"
                style={{ padding: "clamp(0.6rem, 1.2vw, 0.9rem)", boxShadow: "0 34px 120px rgba(0,0,0,0.45)" }}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-card bg-surface">
                  <img
                    src={posterSrc}
                    alt={`${film.title} poster`}
                    loading="eager"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              {facts.length > 0 && (
                <p
                  className="font-mono uppercase text-gold"
                  style={{
                    fontSize: "clamp(0.52rem, 0.86vw, 0.64rem)",
                    letterSpacing: "0.26em",
                    marginBottom: "clamp(0.75rem, 1.6vw, 1.1rem)",
                  }}
                >
                  {facts.join(" / ")}
                </p>
              )}
              <h1
                className="font-wordmark font-black uppercase text-white"
                style={{
                  fontSize: "clamp(2.1rem, 5.6vw, 5rem)",
                  lineHeight: 0.88,
                  letterSpacing: "-0.05em",
                  overflowWrap: "anywhere",
                }}
              >
                {film.title}
              </h1>
              {film.tagline && (
                <p
                  className="font-body italic text-white/55"
                  style={{ fontSize: "clamp(0.82rem, 1.25vw, 1.05rem)", marginTop: "clamp(0.75rem, 1.6vw, 1.1rem)" }}
                >
                  {film.tagline}
                </p>
              )}

              <div
                className="flex flex-wrap items-center border-y border-white/10"
                style={{
                  gap: "clamp(0.75rem, 2vw, 1.5rem)",
                  padding: "clamp(0.8rem, 1.6vw, 1.05rem) 0",
                  marginTop: "clamp(1.1rem, 2.4vw, 1.75rem)",
                }}
              >
                <div className="flex items-baseline" style={{ gap: "0.4rem" }}>
                  <span
                    className="font-mono font-medium text-gold"
                    style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)", lineHeight: 1 }}
                  >
                    {film.vote_average ? film.vote_average.toFixed(1) : "N/A"}
                  </span>
                  <span className="font-mono text-white/38" style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.74rem)" }}>
                    / 10
                  </span>
                  {film.vote_count > 0 && (
                    <span
                      className="font-mono uppercase text-white/38"
                      style={{ fontSize: "clamp(0.5rem, 0.78vw, 0.6rem)", letterSpacing: "0.18em", marginLeft: "0.5rem" }}
                    >
                      {film.vote_count.toLocaleString("en-US")} votes
                    </span>
                  )}
                </div>

                {genres.length > 0 && (
                  <ul className="flex flex-wrap items-center" style={{ gap: "clamp(0.35rem, 0.8vw, 0.5rem)" }} aria-label="Genres">
                    {genres.map((genre) => (
                      <li key={genre.id}>
                        <Link
                          to={`/genre/${genre.id}`}
                          className={`${PILL_CLASS} ${PILL_IDLE}`}
                          style={{ fontSize: "clamp(0.5rem, 0.72vw, 0.6rem)", letterSpacing: "0.14em", padding: "0.42rem 0.78rem" }}
                        >
                          {genre.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Key crew — director */}
              <div style={{ marginTop: "clamp(1rem, 2vw, 1.4rem)" }}>
                <KeyCrew id={film.id} />
              </div>

              {film.overview && (
                <div style={{ marginTop: "clamp(1.1rem, 2.4vw, 1.75rem)" }}>
                  <h2 className="font-mono uppercase text-white/42" style={{ fontSize: "0.58rem", letterSpacing: "0.22em" }}>
                    Synopsis
                  </h2>
                  <p
                    className="mt-3 font-body text-white/62"
                    style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", lineHeight: 1.68, maxWidth: "68ch" }}
                  >
                    {film.overview}
                  </p>
                </div>
              )}
            </div>

            <FilmActionCard film={film} />
          </div>
        </div>
      </section>
    </>
  );
};

/* ── Cast card — portrait + wordmark name, as in "People in Focus" ── */
const CastCard = ({ member, deferImage }) => (
  <Link
    to={`/person/${member.id}`}
    aria-label={`View ${member.name}${member.character ? `, ${member.character}` : ""}`}
    className="group block min-w-0 rounded-card focus-ring"
  >
    <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface shadow-card">
      {deferImage ? (
        <div className="skeleton h-full w-full" aria-hidden />
      ) : (
        <LazyImage
          src={member.profile_path ? profileUrl(member.profile_path, "h632") : null}
          alt=""
          fallbackType="person"
          className="h-full w-full object-cover object-top transition-transform duration-slow ease-cinematic group-hover:scale-[1.04]"
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
    </div>
    <h3
      className="mt-3 truncate font-wordmark font-black uppercase text-white transition-colors duration-fast group-hover:text-gold"
      style={{ fontSize: "clamp(0.72rem, 1.05vw, 0.92rem)" }}
    >
      {member.name}
    </h3>
    {member.character && (
      <p className="mt-1 line-clamp-1 font-body text-white/45" style={{ fontSize: "clamp(0.58rem, 0.9vw, 0.72rem)" }}>
        {member.character}
      </p>
    )}
  </Link>
);

/* ── Cast Section ─────────────────────────────── */
const CastSection = ({ id }) => {
  const { data: credits } = useSWR(`/movie/${id}/credits`, fetcher, { suspense: true });
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
    <section ref={castSectionRef} className="center-container" style={SECTION_PADDING} aria-labelledby="film-cast-heading">
      <SectionHeading
        id="film-cast-heading"
        eyebrow="Ensemble"
        title="Cast"
        aside={`${cast.length} ${cast.length === 1 ? "credit" : "credits"}`}
      />

      {/* 2 / 4 / 8 columns so the initial eight always fill whole rows */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8" style={{ gap: "clamp(0.85rem, 1.8vw, 1.35rem)" }}>
        {visibleCast.map((member) => (
          <CastCard key={`${member.id}-${member.credit_id}`} member={member} deferImage={!castInView} />
        ))}
      </div>

      {cast.length > INITIAL_CAST && (
        <div className="flex justify-center" style={{ marginTop: "clamp(1.5rem, 3vw, 2.25rem)" }}>
          <button
            type="button"
            onClick={() => setShowAllCast((v) => !v)}
            aria-expanded={showAllCast}
            className={`${PILL_CLASS} ${PILL_IDLE} cursor-pointer`}
            style={PILL_STYLE}
          >
            {showAllCast ? (
              <>Show Less <KeyboardArrowUpIcon sx={{ fontSize: "1rem" }} /></>
            ) : (
              <>View Full Cast <KeyboardArrowDownIcon sx={{ fontSize: "1rem" }} /></>
            )}
          </button>
        </div>
      )}
    </section>
  );
};

const ProviderLogo = ({ provider }) => (
  <div className="flex flex-col items-center" style={{ gap: "0.4rem", width: "clamp(2.6rem, 4.6vw, 3.6rem)" }} title={provider.provider_name}>
    <div
      className="overflow-hidden rounded-card border border-white/10 bg-surface"
      style={{ width: "clamp(2.25rem, 4vw, 3rem)", height: "clamp(2.25rem, 4vw, 3rem)" }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
        alt={provider.provider_name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
    <span className="line-clamp-2 text-center font-mono leading-tight text-white/40" style={{ fontSize: "clamp(0.42rem, 0.65vw, 0.55rem)" }}>
      {provider.provider_name}
    </span>
  </div>
);

/* ── 4. Watch Providers (Data-driven) ──────────────────────────── */
const WatchProviders = ({ id }) => {
  const { data } = useSWR(`/movie/${id}/watch/providers`, fetcher, { suspense: true });
  // Use US region; fall back to first available region
  const regions = data?.results ?? {};
  const us = regions["US"];
  const regionData = us ?? Object.values(regions)[0] ?? null;

  if (!regionData) return null;

  const groups = [
    { label: "Stream", providers: regionData.flatrate ?? [] },
    { label: "Rent", providers: regionData.rent ?? [] },
    { label: "Buy", providers: regionData.buy ?? [] },
  ].filter((group) => group.providers.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="center-container" style={SECTION_PADDING} aria-labelledby="film-watch-heading">
      <SectionHeading
        id="film-watch-heading"
        eyebrow="Availability"
        title="Where to Watch"
        aside={
          regionData.link && (
            <a
              href={regionData.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors duration-fast hover:text-gold focus-ring"
              aria-label="View all providers on TMDB"
            >
              All providers <OpenInNewIcon sx={{ fontSize: "0.8rem" }} />
            </a>
          )
        }
      />

      <div
        className="rounded-card border border-white/10 bg-white/[0.025]"
        style={{ padding: "clamp(1rem, 2.2vw, 1.6rem)" }}
      >
        <div className="flex flex-wrap" style={{ gap: "clamp(1.25rem, 3.5vw, 3rem)" }}>
          {groups.map((group) => (
            <div key={group.label} className="min-w-0">
              <p className="font-mono uppercase text-white/35" style={{ fontSize: "0.55rem", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
                {group.label}
              </p>
              <div className="flex flex-wrap" style={{ gap: "clamp(0.6rem, 1.3vw, 1rem)" }}>
                {group.providers.map((provider) => (
                  <ProviderLogo key={provider.provider_id} provider={provider} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="font-body text-faint" style={{ fontSize: "clamp(0.5rem, 0.75vw, 0.6rem)", marginTop: "clamp(1rem, 2vw, 1.4rem)" }}>
          Powered by JustWatch via TMDB
        </p>
      </div>
    </section>
  );
};

/* ── 5. Similar Movies (Data-driven) ───────────────────────────── */
const SimilarMovies = ({ id }) => {
  const { data: similar } = useSWR(`/movie/${id}/similar`, fetcher, { suspense: true });
  const movies = similar?.results || [];

  if (movies.length === 0) return null;

  return (
    <section
      className="center-container"
      style={{ ...SECTION_PADDING, paddingBottom: "clamp(3rem, 7vw, 6rem)" }}
      aria-labelledby="film-similar-heading"
    >
      <SectionHeading id="film-similar-heading" eyebrow="Keep Watching" title="Similar Films" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" style={{ gap: "clamp(0.85rem, 2vw, 1.45rem)" }}>
        {movies.slice(0, 6).map((m) => (
          <FilmCard
            key={m.id}
            film={m}
            subtitle={m.release_date ? m.release_date.slice(0, 4) : undefined}
          />
        ))}
      </div>
    </section>
  );
};

/* ── Main Page Container ───────────────────────────────────────── */
const FilmPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-base text-white">
      {/* Back Button — fixed position, no wrapper needed */}
      <BackButton
        fallbackRoute="/"
        className="h-10 w-10 rounded-full border border-white/10 bg-black/35 backdrop-blur-md hover:bg-black/55"
      />

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
