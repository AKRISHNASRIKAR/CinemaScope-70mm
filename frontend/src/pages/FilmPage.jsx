import { Suspense, useRef, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher, parallelFetcher } from "@/lib/api/fetcher";

import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import BookmarkAddedOutlinedIcon from "@mui/icons-material/BookmarkAddedOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import TvIcon from "@mui/icons-material/Tv";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import PersonCard from "@/components/ui/PersonCard";
import SEO from "@/components/seo/SEO";
import { FilmDetailHeroSkeleton, CastSectionSkeleton, SimilarMoviesSkeleton } from "@/components/ui/Skeletons";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useSession } from "@/hooks/useSession";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { posterUrl, backdropUrl } from "@/lib/utils/tmdbImage";

const INITIAL_CAST = 8;

const toIsoDuration = (minutes) => {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `PT${hours ? `${hours}H` : ""}${mins ? `${mins}M` : ""}`;
};

const toDescription = (film) =>
  film.overview ||
  `${film.title} film details, cast, watch providers, similar movies, and ratings on CinemaScope.`;

const FilmActions = ({ film }) => {
  const { isAuthenticated } = useSession();
  const { history, isLoading: historyLoading, logWatch } = useWatchHistory({
    enabled: isAuthenticated,
    limit: 12,
  });
  const {
    isLoading: watchlistLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  } = useWatchlist({ enabled: isAuthenticated });
  const [status, setStatus] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const inWatchlist = isAuthenticated && isInWatchlist(film.id);
  const watched = isAuthenticated && history.some((item) => item.tmdb_id === film.id);
  const payload = {
    tmdb_id: film.id,
    title: film.title,
    poster_path: film.poster_path ?? null,
  };

  const handleWatchlist = async () => {
    setPendingAction("watchlist");
    setStatus("");
    try {
      if (inWatchlist) {
        await removeFromWatchlist(film.id);
        setStatus("Removed from watchlist.");
      } else {
        await addToWatchlist(payload);
        setStatus("Added to watchlist.");
      }
    } catch (error) {
      setStatus(error.message || "Could not update watchlist.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleWatched = async () => {
    setPendingAction("watched");
    setStatus("");
    try {
      await logWatch(payload);
      setStatus(watched ? "Watch date refreshed." : "Marked as watched.");
    } catch (error) {
      setStatus(error.message || "Could not update watch history.");
    } finally {
      setPendingAction(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="mt-8 flex flex-wrap items-center"
        style={{ gap: "clamp(0.6rem,1.2vw,0.85rem)" }}
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-card border border-gold/35 bg-gold/10 px-4 py-2 font-body font-medium text-gold transition-all duration-normal hover:border-gold/70 hover:bg-gold/15 hover:text-gold-lt"
          style={{ fontSize: "clamp(0.7rem,1vw,0.85rem)" }}
        >
          <LoginOutlinedIcon sx={{ fontSize: "1rem" }} />
          Sign in to save
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div
        className="flex flex-wrap items-center"
        style={{ gap: "clamp(0.6rem,1.2vw,0.85rem)" }}
      >
        <button
          type="button"
          onClick={handleWatchlist}
          disabled={watchlistLoading || pendingAction === "watchlist"}
          aria-pressed={inWatchlist}
          className={`inline-flex items-center gap-2 rounded-card border px-4 py-2 font-body font-medium transition-all duration-normal disabled:cursor-wait disabled:opacity-60 ${
            inWatchlist
              ? "border-gold/60 bg-gold/15 text-gold"
              : "border-white/12 bg-white/[0.04] text-white/70 hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          }`}
          style={{ fontSize: "clamp(0.7rem,1vw,0.85rem)" }}
        >
          {inWatchlist ? (
            <BookmarkAddedOutlinedIcon sx={{ fontSize: "1rem" }} />
          ) : (
            <BookmarkAddOutlinedIcon sx={{ fontSize: "1rem" }} />
          )}
          {inWatchlist ? "In Watchlist" : "Watchlist"}
        </button>

        <button
          type="button"
          onClick={handleWatched}
          disabled={historyLoading || pendingAction === "watched"}
          aria-pressed={watched}
          className={`inline-flex items-center gap-2 rounded-card border px-4 py-2 font-body font-medium transition-all duration-normal disabled:cursor-wait disabled:opacity-60 ${
            watched
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
          }`}
          style={{ fontSize: "clamp(0.7rem,1vw,0.85rem)" }}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: "1rem" }} />
          {watched ? "Watched" : "Mark Watched"}
        </button>
      </div>

      {status && (
        <p
          className="mt-3 font-body text-muted"
          style={{ fontSize: "clamp(0.62rem,0.95vw,0.75rem)" }}
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
      )}
    </div>
  );
};

/* ── Film Hero Section ────────────────────────── */
const FilmHero = ({ id }) => {
  const { data } = useSWR([`/movie/${id}`, `/movie/${id}/release_dates`], parallelFetcher, { suspense: true });
  const [film, releaseDates] = data;
  const { addFilm } = useRecentlyViewed();

  // Record this film as recently viewed on mount
  useEffect(() => { addFilm(film); }, [film, addFilm]);

  const us = releaseDates?.results?.find((e) => e.iso_3166_1 === "US");
  const certification = us?.release_dates?.[0]?.certification || "N/A";

  const backdrop = backdropUrl(film.backdrop_path);
  const posterSrc = posterUrl(film.poster_path, "w500") ?? "/fallback-image-film.jpg";
  const description = toDescription(film);

  return (
    <>
      <SEO
        title={film.title}
        description={description}
        image={backdrop || posterSrc}
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
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(40vh,55vh,65vh)" }}>
        {backdrop && (
          <img
            src={backdrop}
            alt={film.title}
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "top center" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat", backgroundSize: "150px 150px",
          }}
        />
      </section>

      <div className="relative -mt-32 z-10 center-container" style={{ padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)" }}>
        <div className="flex flex-col md:flex-row" style={{ gap: "clamp(1.5rem,4vw,3rem)" }}>
          <div className="flex-shrink-0 mx-auto md:mx-0" style={{ width: "clamp(180px,25vw,320px)" }}>
            <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card-hover">
              <img
                src={posterSrc}
                alt={film.title}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0" style={{ paddingTop: "clamp(1rem,3vh,2rem)" }}>
            <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight" style={{ fontSize: "clamp(1.8rem,4vw,3.5rem)" }}>{film.title}</h1>
            {film.tagline && (
              <p className="font-body italic text-muted mt-2" style={{ fontSize: "clamp(0.75rem,1.2vw,1rem)" }}>{film.tagline}</p>
            )}
            <div className="flex items-baseline mt-4" style={{ gap: "clamp(0.3rem,0.6vw,0.5rem)" }}>
              <span className="text-gold font-mono font-semibold" style={{ fontSize: "clamp(1.2rem,2vw,1.6rem)" }}>⭐ {film.vote_average ? film.vote_average.toFixed(1) : "N/A"}</span>
              <span className="font-mono text-muted" style={{ fontSize: "clamp(0.65rem,1vw,0.8rem)" }}>/ 10</span>
            </div>
            <div className="grid grid-cols-2 mt-6" style={{ gap: "clamp(0.5rem,1.5vw,1rem)" }}>
              {[
                ["Certification", certification],
                ["Release",  film.release_date ? new Date(film.release_date).toDateString() : "N/A"],
                ["Runtime",  film.runtime ? `${film.runtime} min` : "N/A"],
                ["Genres",   film.genres?.map((g) => g.name).join(", ") || "N/A"],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="font-body font-medium text-gold uppercase tracking-[0.12em]" style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}>{label}</span>
                  <p className="font-body text-white/80 mt-0.5" style={{ fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}>{value}</p>
                </div>
              ))}
            </div>
            {film.overview && (
              <div className="mt-8">
                <h2 className="font-display font-bold text-gold" style={{ fontSize: "clamp(1rem,1.8vw,1.3rem)" }}>Overview</h2>
                <p className="font-body text-white/70 leading-relaxed mt-2 line-clamp-3" style={{ fontSize: "clamp(0.75rem,1.1vw,0.9rem)" }}>{film.overview}</p>
              </div>
            )}
            <FilmActions film={film} />
          </div>
        </div>
      </div>
    </>
  );
};

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
    <div
      ref={castSectionRef}
      className="center-container"
      style={{ marginTop: "clamp(2.5rem,5vh,4rem)", paddingBottom: "clamp(2rem,4vh,3rem)" }}
    >
      <div
        className="relative rounded-card overflow-hidden"
        style={{
          padding: "clamp(1.5rem,3vw,2.5rem)",
          background: "var(--color-section-dark)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      >
        <h2 className="font-display font-bold text-white text-center" style={{ fontSize: "clamp(1.2rem,2vw,1.6rem)", marginBottom: "clamp(1.5rem,3vh,2rem)" }}>
          Cast
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center transition-all duration-slow overflow-hidden" style={{ gap: "clamp(1rem,2vw,1.5rem)" }}>
          {visibleCast.map((member, i) => (
            <PersonCard
              key={`${member.id}-${member.credit_id}`}
              person={member}
              subtitle={member.character}
              index={i}
              deferImage={!castInView}
            />
          ))}
        </div>

        {cast.length > INITIAL_CAST && (
          <div className="flex justify-center" style={{ marginTop: "clamp(1.5rem,3vh,2rem)" }}>
            <button
              type="button"
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

/* ── 4. Watch Providers (Data-driven) ──────────────────────────── */
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

  const ProviderLogo = ({ p }) => (
    <div
      key={p.provider_id}
      className="flex flex-col items-center"
      style={{ gap: "0.35rem" }}
      title={p.provider_name}
    >
      <div className="rounded-card overflow-hidden" style={{ width: "clamp(2rem,4vw,3rem)", height: "clamp(2rem,4vw,3rem)" }}>
        <img
          src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
          alt={p.provider_name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="font-mono text-white/40 text-center leading-tight line-clamp-2" style={{ fontSize: "clamp(0.4rem,0.65vw,0.55rem)", maxWidth: "3.5rem" }}>
        {p.provider_name}
      </span>
    </div>
  );

  return (
    <div className="center-container" style={{ marginBottom: "clamp(2rem,4vh,3rem)" }}>
      <div
        className="rounded-card border border-white/8 bg-white/[0.02]"
        style={{ padding: "clamp(1.25rem,3vw,2rem)" }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: "clamp(1rem,2vh,1.5rem)" }}>
          <div className="flex items-center gap-2">
            <TvIcon sx={{ fontSize: "clamp(0.9rem,1.4vw,1.1rem)", color: "var(--color-gold)" }} />
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

        <div className="flex flex-col" style={{ gap: "clamp(1rem,2vh,1.5rem)" }}>
          {flatrate.length > 0 && (
            <div>
              <p className="font-mono text-muted uppercase tracking-[0.15em] mb-3" style={{ fontSize: "clamp(0.5rem,0.75vw,0.6rem)" }}>Stream</p>
              <div className="flex flex-wrap" style={{ gap: "clamp(0.75rem,1.5vw,1.25rem)" }}>
                {flatrate.map((p) => <ProviderLogo key={p.provider_id} p={p} />)}
              </div>
            </div>
          )}
          {rent.length > 0 && (
            <div>
              <p className="font-mono text-muted uppercase tracking-[0.15em] mb-3" style={{ fontSize: "clamp(0.5rem,0.75vw,0.6rem)" }}>Rent</p>
              <div className="flex flex-wrap" style={{ gap: "clamp(0.75rem,1.5vw,1.25rem)" }}>
                {rent.map((p) => <ProviderLogo key={p.provider_id} p={p} />)}
              </div>
            </div>
          )}
          {buy.length > 0 && (
            <div>
              <p className="font-mono text-muted uppercase tracking-[0.15em] mb-3" style={{ fontSize: "clamp(0.5rem,0.75vw,0.6rem)" }}>Buy</p>
              <div className="flex flex-wrap" style={{ gap: "clamp(0.75rem,1.5vw,1.25rem)" }}>
                {buy.map((p) => <ProviderLogo key={p.provider_id} p={p} />)}
              </div>
            </div>
          )}
        </div>

        <p className="font-body text-faint mt-4" style={{ fontSize: "clamp(0.5rem,0.75vw,0.6rem)" }}>
          Powered by JustWatch via TMDB
        </p>
      </div>
    </div>
  );
};

/* ── 5. Similar Movies (Data-driven) ───────────────────────────── */
const SimilarMovies = ({ id }) => {
  const { data: similar } = useSWR(`/movie/${id}/similar`, fetcher, { suspense: true });
  const movies = similar?.results || [];

  if (movies.length === 0) return null;

  return (
    <div className="center-container mt-16 pb-12">
      <h2 className="font-display font-bold text-white mb-6" style={{ fontSize: "clamp(1.2rem,2vw,1.6rem)" }}>
        Similar Movies
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
        {movies.slice(0, 5).map((m) => (
          <FilmCard key={m.id} film={m} />
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
