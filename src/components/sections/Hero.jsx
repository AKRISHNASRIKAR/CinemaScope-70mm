import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HeroCarousel from "./HeroCarousel";
import { GENRE_MAP } from "@/lib/constants";

const INTERVAL = 3000;
const PAUSE_AFTER_CLICK = 8000;
const FADE_MS = 800;

const getGenres = (film) => {
  if (film.genres?.length) return film.genres.slice(0, 3).map((g) => g.name);
  if (film.genre_ids?.length)
    return film.genre_ids.slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);
  return [];
};

const Hero = ({ film, relatedFilms = [] }) => {
  /* The `film` prop was the single featured film — now we build a rotation
     array from it + relatedFilms (reuse the same pool). */
  const allFilms = film ? [film, ...relatedFilms.slice(0, 6)] : [];
  const navigate = useNavigate();

  const [activeIdx, setActiveIdx] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");
  const timerRef = useRef(null);
  const pauseRef = useRef(null);

  const total = allFilms.length;
  const current = allFilms[activeIdx] || null;

  /* ── transition helper ─────────────────────────────────── */
  const goTo = useCallback(
    (idx) => {
      setFadeClass("opacity-0");
      setTimeout(() => {
        setActiveIdx(idx % total);
        setFadeClass("opacity-100");
      }, FADE_MS / 2);
    },
    [total]
  );

  /* ── auto-advance ──────────────────────────────────────── */
  const startAuto = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      goTo((prev) => prev); // we'll use functional update below
      setFadeClass("opacity-0");
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % total);
        setFadeClass("opacity-100");
      }, FADE_MS / 2);
    }, INTERVAL);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    startAuto();
    return () => clearInterval(timerRef.current);
  }, [total, startAuto]);

  /* ── manual navigation (pauses auto for 8s) ──────────── */
  const navigate_ = useCallback(
    (idx) => {
      clearInterval(timerRef.current);
      clearTimeout(pauseRef.current);
      goTo(idx);
      pauseRef.current = setTimeout(startAuto, PAUSE_AFTER_CLICK);
    },
    [goTo, startAuto]
  );

  const goPrev = () => navigate_((activeIdx - 1 + total) % total);
  const goNext = () => navigate_((activeIdx + 1) % total);

  if (!current) return null;

  const backdrop = current.backdrop_path
    ? `https://image.tmdb.org/t/p/original${current.backdrop_path}`
    : null;
  const genres = getGenres(current);
  const year = current.release_date?.slice(0, 4) ?? "";
  const rating = current.vote_average ? current.vote_average.toFixed(1) : null;

  return (
    <section className="relative w-full h-screen overflow-hidden bg-base group/hero">

      {/* ── Backdrop (crossfade via opacity) ─── */}
      {backdrop && (
        <img
          key={current.id}
          src={backdrop}
          alt={current.title}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity ease-cinematic ${fadeClass}`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        />
      )}

      {/* ── Vignettes ─── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />

      {/* ── Film grain ─── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      {/* ── Prev / Next arrows ─── */}
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous film"
            className="
              absolute left-4 top-1/2 -translate-y-1/2 z-20
              flex items-center justify-center rounded-full
              bg-black/40 backdrop-blur-sm border border-white/10
              text-white/60 hover:text-white hover:bg-black/60
              transition-all duration-normal cursor-pointer
              sm:opacity-0 sm:group-hover/hero:opacity-100
            "
            style={{ width: "clamp(2.5rem, 4vw, 3.5rem)", height: "clamp(2.5rem, 4vw, 3.5rem)" }}
          >
            <ChevronLeftIcon sx={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next film"
            className="
              absolute right-4 top-1/2 -translate-y-1/2 z-20
              flex items-center justify-center rounded-full
              bg-black/40 backdrop-blur-sm border border-white/10
              text-white/60 hover:text-white hover:bg-black/60
              transition-all duration-normal cursor-pointer
              sm:opacity-0 sm:group-hover/hero:opacity-100
            "
            style={{ width: "clamp(2.5rem, 4vw, 3.5rem)", height: "clamp(2.5rem, 4vw, 3.5rem)" }}
          >
            <ChevronRightIcon sx={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }} />
          </button>
        </>
      )}

      {/* ── Dot indicators ─── */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center" style={{ gap: "clamp(0.35rem, 0.6vw, 0.5rem)" }}>
          {allFilms.map((f, i) => (
            <button
              key={f.id}
              onClick={() => navigate_(i)}
              aria-label={`Go to film ${i + 1}`}
              className={`
                rounded-full transition-all duration-normal cursor-pointer border-none
                ${i === activeIdx
                  ? "bg-gold"
                  : "bg-white/25 hover:bg-white/50"
                }
              `}
              style={{
                width:  i === activeIdx ? "clamp(0.5rem, 0.8vw, 0.6rem)" : "clamp(0.35rem, 0.55vw, 0.4rem)",
                height: i === activeIdx ? "clamp(0.5rem, 0.8vw, 0.6rem)" : "clamp(0.35rem, 0.55vw, 0.4rem)",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Bottom-left: Film info (fades with backdrop) ─── */}
      <div
        className={`absolute z-10 cursor-pointer transition-opacity ease-cinematic ${fadeClass}`}
        style={{
          transitionDuration: `${FADE_MS}ms`,
          bottom: "clamp(2rem, 6vh, 4rem)",
          left: "clamp(1.5rem, 4vw, 4rem)",
          maxWidth: "clamp(280px, 45vw, 600px)",
        }}
        onClick={() => navigate(`/film/${current.id}`)}
      >
        {/* Rating */}
        {rating && (
          <div className="flex items-baseline gap-[clamp(0.25rem,0.5vw,0.5rem)] mb-[clamp(0.75rem,1.5vh,1.25rem)]">
            <span className="font-mono tracking-[0.15em] text-white/40 uppercase" style={{ fontSize: "clamp(0.6rem, 1vw, 0.75rem)" }}>Rating</span>
            <span className="font-mono font-semibold text-gold" style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>{rating}</span>
            <span className="font-mono text-white/40" style={{ fontSize: "clamp(0.6rem, 1vw, 0.75rem)" }}>/ 10</span>
          </div>
        )}

        {/* Genre tags */}
        {genres.length > 0 && (
          <div className="flex items-center flex-wrap mb-[clamp(0.5rem,1vh,0.75rem)]" style={{ gap: "clamp(0.4rem, 0.8vw, 0.6rem)" }}>
            {genres.map((genre, i) => (
              <React.Fragment key={genre}>
                <span className="font-body font-medium tracking-[0.18em] text-white/50 uppercase" style={{ fontSize: "clamp(0.6rem, 1.2vw, 0.85rem)" }}>{genre}</span>
                {i < genres.length - 1 && <span className="text-white/25" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.65rem)" }}>|</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          className="font-display font-bold text-white leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 5rem)", marginBottom: "clamp(0.5rem, 1.5vh, 1rem)" }}
        >
          {current.title || current.original_title}
        </h1>

        {/* Metadata row */}
        <div
          className="flex flex-wrap items-center text-white/40 font-mono tracking-[0.06em]"
          style={{ gap: "clamp(0.3rem, 0.6vw, 0.5rem)", fontSize: "clamp(0.65rem, 1.1vw, 0.8rem)" }}
        >
          {year && <span>{year}</span>}
          {current.director && (
            <>
              <span className="text-white/20">|</span>
              <span>
                <span className="text-white/30 uppercase tracking-[0.1em]" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)" }}>Director: </span>
                {current.director}
              </span>
            </>
          )}
          {current.stars?.length > 0 && (
            <>
              <span className="text-white/20">|</span>
              <span>
                <span className="text-white/30 uppercase tracking-[0.1em]" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)" }}>Stars: </span>
                {current.stars.slice(0, 3).join(", ")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom-right: Carousel (stays independent) ─── */}
      {relatedFilms.length > 0 && (
        <div
          className="absolute z-10 hidden sm:block"
          style={{ bottom: "clamp(2rem, 5vh, 3rem)", right: 0 }}
        >
          <HeroCarousel films={relatedFilms} label="NOW SHOWING" />
        </div>
      )}
    </section>
  );
};

export default Hero;
