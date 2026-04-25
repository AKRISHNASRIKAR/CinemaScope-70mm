import React, { Suspense, useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher, parallelFetcher } from "@/lib/api/fetcher";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import { 
  FilmDetailHeroSkeleton, 
  CastSectionSkeleton, 
  FilmRowSkeleton 
} from "@/components/ui/Skeletons";

const INITIAL_CAST = 8;
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 1.5, -1, 2.5, -3, 0.5];

/* ── 1. Film Hero Section (Data-driven) ────────────────────────── */
const FilmHero = ({ id }) => {
  const { data } = useSWR([`/movie/${id}`, `/movie/${id}/release_dates`], parallelFetcher, { suspense: true });
  const [film, releaseDates] = data;

  const us = releaseDates.results?.find((e) => e.iso_3166_1 === "US");
  const certification = us?.release_dates?.[0]?.certification || "N/A";

  const backdrop = film.backdrop_path ? `https://image.tmdb.org/t/p/original${film.backdrop_path}` : null;
  const posterSrc = film.poster_path ? `https://image.tmdb.org/t/p/w500${film.poster_path}` : "/fallback-image-film.jpg";

  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(40vh,55vh,65vh)" }}>
        {backdrop && (
          <img
            src={backdrop}
            alt={film.title}
            loading="eager"
            fetchpriority="high"
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
                fetchpriority="high"
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
          </div>
        </div>
      </div>
    </>
  );
};

/* ── 2. Cast Section (Data-driven) ─────────────────────────────── */
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
      className="center-container px-4 sm:px-6 lg:px-12"
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center transition-all duration-slow overflow-hidden" style={{ gap: "clamp(1rem,2vw,1.5rem)" }}>
          {visibleCast.map((member, i) => {
            const rot = ROTATIONS[i % ROTATIONS.length];
            const imgSrc = member.profile_path ? `https://image.tmdb.org/t/p/w200${member.profile_path}` : null;

            return (
              <div
                key={`${member.id}-${member.credit_id}`}
                onClick={() => navigate(`/person/${member.id}`)}
                className="cursor-pointer w-full max-w-[clamp(110px,14vw,160px)] mx-auto"
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

/* ── 3. Similar Movies (Data-driven) ───────────────────────────── */
const SimilarMovies = ({ id }) => {
  const { data: similar } = useSWR(`/movie/${id}/similar`, fetcher, { suspense: true });
  const movies = similar.results || [];

  if (movies.length === 0) return null;

  return (
    <div className="center-container px-4 sm:px-6 lg:px-12 mt-16 pb-12">
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
      {/* Back Button Placement */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16 pt-24 pb-4">
        <BackButton fallbackRoute="/" label="Back to Gallery" />
      </div>

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

      {/* Similar Movies - Lowest Priority */}
      <ErrorBoundary>
        <Suspense fallback={<FilmRowSkeleton />}>
          <SimilarMovies id={id} />
        </Suspense>
      </ErrorBoundary>

      <Footer />
    </div>
  );
};

export default FilmPage;
