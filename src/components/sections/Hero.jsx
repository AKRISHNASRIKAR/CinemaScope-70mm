import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HeroCarousel from "./HeroCarousel";
import { GENRE_MAP } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { backdropUrl } from "@/lib/utils/tmdbImage";

/* ── constants ──────────────────────────────────────────────────── */
const DISPLAY_MS     = 5000;
const PAUSE_MS       = 8000;
const IMG_FADE_MS    = 1000;
const CONTENT_OUT_MS = 300;
const CONTENT_IN_MS  = 400;

/* ── helpers ─────────────────────────────────────────────────────── */
const getGenres = (film) => {
  if (film?.genres?.length) return film.genres.slice(0, 3).map((g) => g.name);
  if (film?.genre_ids?.length)
    return film.genre_ids.slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);
  return [];
};

const backdropOf = (film) => backdropUrl(film?.backdrop_path);

/** Preloads an image; resolves on load, resolves (not rejects) on error */
const preloadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.onload  = resolve;
    img.onerror = resolve;
    img.src = src;
  });

/* ── framer-motion variants ──────────────────────────────────────────
   The content wrapper is keyed on contentKey: the old copy plays its
   exit, then the new copy staggers in behind the 1s backdrop crossfade. */
const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: CONTENT_IN_MS / 1000, ease: [0.25, 0.46, 0.45, 0.94], delay },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: CONTENT_OUT_MS / 1000, ease: "easeIn" } },
};

/* Instant variants for reduced-motion users */
const staticVariants = {
  hidden:  { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
  exit:    { opacity: 1, y: 0, transition: { duration: 0 } },
};

/* ══════════════════════════════════════════════════════════════════
   Hero component
══════════════════════════════════════════════════════════════════ */
const Hero = ({ film, relatedFilms = [] }) => {
  const allFilms = film ? [film, ...relatedFilms.slice(0, 6)] : [];
  const navigate = useNavigate();
  const total    = allFilms.length;
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? staticVariants : contentVariants;

  /* image layer state */
  const [layerA, setLayerA] = useState({ idx: 0, src: backdropOf(allFilms[0]) });
  const [layerB, setLayerB] = useState({ idx: 1 % Math.max(total, 1), src: null, visible: false });

  /* content / active index */
  const [displayIdx, setDisplayIdx] = useState(0);
  const [contentKey, setContentKey] = useState(0);

  /* refs */
  const timerRef     = useRef(null);
  const pauseRef     = useRef(null);
  const transRef     = useRef(false);
  const activeIdxRef = useRef(0);
  activeIdxRef.current = displayIdx;

  /* ── core transition ─────────────────────────────────────────── */
  const transitionTo = useCallback(
    (nextIdx) => {
      if (transRef.current) return;
      const normIdx = ((nextIdx % total) + total) % total;
      if (normIdx === activeIdxRef.current) return;

      transRef.current = true;

      const nextFilm = allFilms[normIdx];
      const nextSrc  = backdropOf(nextFilm);

      preloadImage(nextSrc).then(() => {
        setLayerB({ idx: normIdx, src: nextSrc, visible: false });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setLayerB((prev) => ({ ...prev, visible: true }));
            setDisplayIdx(normIdx);
            setContentKey((k) => k + 1);

            setTimeout(() => {
              setLayerA({ idx: normIdx, src: nextSrc });
              setLayerB({ idx: (normIdx + 1) % total, src: null, visible: false });
              transRef.current = false;
            }, IMG_FADE_MS + 60);
          });
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [total]
  );

  /* ── auto-advance ─────────────────────────────────────────────── */
  const startAuto = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const next = (activeIdxRef.current + 1) % total;
      transitionTo(next);
    }, DISPLAY_MS);
  }, [total, transitionTo]);

  useEffect(() => {
    if (total <= 1) return;
    // Silently preload film[1] immediately so it's ready for the first transition
    preloadImage(backdropOf(allFilms[1 % total]));
    startAuto();
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pauseRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  /* ── manual navigation ────────────────────────────────────────── */
  const navigateTo = useCallback(
    (idx) => {
      clearInterval(timerRef.current);
      clearTimeout(pauseRef.current);
      transitionTo(idx);
      pauseRef.current = setTimeout(startAuto, PAUSE_MS);
    },
    [transitionTo, startAuto]
  );

  const goPrev = () => navigateTo((displayIdx - 1 + total) % total);
  const goNext = () => navigateTo((displayIdx + 1) % total);

  /* ── render guard ─────────────────────────────────────────────── */
  if (!allFilms.length) return null;

  const current  = allFilms[displayIdx] ?? allFilms[0];
  const genres   = getGenres(current);
  const year     = current?.release_date?.slice(0, 4) ?? "";
  const rating   = current?.vote_average ? current.vote_average.toFixed(1) : null;
  const goToFilm = () => navigate(`/film/${current?.id}`);

  return (
    <section
      className="relative w-full overflow-hidden bg-base group/hero"
      style={{ height: "90vh", minHeight: "560px" }}
      aria-label="Featured films carousel"
      aria-roledescription="carousel"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft")  goPrev();
        if (e.key === "ArrowRight") goNext();
      }}
    >

      {/* ══ LAYER A — current visible backdrop ══════════════════════ */}
      {layerA.src && (
        <img
          src={layerA.src}
          alt=""
          aria-hidden
          fetchpriority="high"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 1, willChange: "opacity" }}
        />
      )}

      {/* ══ LAYER B — incoming backdrop (preloaded, then fades in) ══ */}
      {layerB.src && (
        <img
          src={layerB.src}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{
            zIndex: 2,
            opacity: layerB.visible ? 1 : 0,
            transition: `opacity ${IMG_FADE_MS}ms cubic-bezier(0.25,0.46,0.45,0.94)`,
            willChange: "opacity",
          }}
        />
      )}

      {/* ══ LAYER C — permanent vignette overlay (never transitions) ══ */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        style={{ zIndex: 3 }}
        onClick={goToFilm}
        aria-label={`View ${current?.title || current?.original_title}`}
        role="button"
        tabIndex={0}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        {/* Film grain */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
          }}
        />
      </div>

      {/* ══ Prev / Next arrows ══════════════════════════════════════ */}
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous film"
            className="
              absolute left-4 top-1/2 -translate-y-1/2
              flex items-center justify-center rounded-full
              bg-black/40 backdrop-blur-md border border-white/10
              text-white/60 hover:text-white hover:bg-black/60
              opacity-40 hover:opacity-100 focus-visible:opacity-100
              group-hover/hero:opacity-100
              transition-all duration-300 hover:scale-[1.06] cursor-pointer
            "
            style={{ width: "clamp(2.5rem,4vw,3.5rem)", height: "clamp(2.5rem,4vw,3.5rem)", zIndex: 20 }}
          >
            <ChevronLeftIcon sx={{ fontSize: "clamp(1.2rem,2vw,1.8rem)" }} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next film"
            className="
              absolute right-4 top-1/2 -translate-y-1/2
              flex items-center justify-center rounded-full
              bg-black/40 backdrop-blur-md border border-white/10
              text-white/60 hover:text-white hover:bg-black/60
              opacity-40 hover:opacity-100 focus-visible:opacity-100
              group-hover/hero:opacity-100
              transition-all duration-300 hover:scale-[1.06] cursor-pointer
            "
            style={{ width: "clamp(2.5rem,4vw,3.5rem)", height: "clamp(2.5rem,4vw,3.5rem)", zIndex: 20 }}
          >
            <ChevronRightIcon sx={{ fontSize: "clamp(1.2rem,2vw,1.8rem)" }} />
          </button>
        </>
      )}

      {/* ══ Bottom stage ═══════════════════════════════════════════
           A single flex-wrap row: film info and the "Now Showing"
           strip sit side by side on wide viewports and stack on narrow
           ones — driven by flex-basis, not breakpoints.            */}
      <div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{ padding: "0 clamp(1.25rem, 5vw, 4rem) clamp(1rem, 2.5vh, 2rem)" }}
      >
        <div className="flex flex-wrap items-end justify-between" style={{ gap: "clamp(1rem, 3vw, 2.5rem)" }}>

          {/* ── Film info ─────────────────────────────────────── */}
          <div style={{ flex: "1 1 clamp(260px, 38vw, 560px)", minWidth: 0 }}>
            <AnimatePresence mode="wait">
              <motion.div key={contentKey} style={{ willChange: "opacity, transform" }}>

              {/* Genre tags */}
              {genres.length > 0 && (
                <motion.div
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={0}
                  className="flex items-center flex-wrap"
                  style={{ gap: "clamp(0.4rem,0.8vw,0.6rem)", marginBottom: "clamp(0.4rem,1vh,0.65rem)" }}
                >
                  {genres.map((genre, i) => (
                    <React.Fragment key={genre}>
                      <span
                        className="font-body font-medium tracking-[0.18em] text-white/50 uppercase"
                        style={{ fontSize: "clamp(0.62rem, 1.2vw, 0.9rem)" }}
                      >
                        {genre}
                      </span>
                      {i < genres.length - 1 && (
                        <span className="text-white/25" style={{ fontSize: "clamp(0.5rem,0.8vw,0.65rem)" }}>|</span>
                      )}
                    </React.Fragment>
                  ))}
                </motion.div>
              )}

              {/* Title */}
              <motion.h1
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={0.08}
                className="text-white leading-[0.9] tracking-tight"
                style={{
                  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.9rem,4.6vw,4.5rem)",
                  paddingBottom: "clamp(0.5rem, 1.4vw, 1rem)",
                  willChange: "opacity, transform",
                }}
              >
                <Link
                  to={`/film/${current?.id}`}
                  className="cursor-pointer outline-none transition-colors duration-fast hover:text-white/80 focus-visible:text-white/80"
                  tabIndex={0}
                >
                  {current?.title || current?.original_title}
                </Link>
              </motion.h1>

              {/* Metadata row */}
              <motion.div
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={0.16}
                className="flex flex-wrap items-center text-white/40 font-mono tracking-[0.06em]"
                style={{ gap: "clamp(0.3rem,0.6vw,0.5rem)", fontSize: "clamp(0.65rem, 1.2vw, 0.9rem)" }}
              >
                {year && <span>{year}</span>}
                {current?.director && (
                  <>
                    <span className="text-white/20">|</span>
                    <span>
                      <span className="text-white/30 uppercase tracking-[0.1em]" style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}>Director: </span>
                      {current.director}
                    </span>
                  </>
                )}
                {current?.stars?.length > 0 && (
                  <>
                    <span className="text-white/20">|</span>
                    <span>
                      <span className="text-white/30 uppercase tracking-[0.1em]" style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}>Stars: </span>
                      {current.stars.slice(0, 3).join(", ")}
                    </span>
                  </>
                )}
              </motion.div>

              {/* Rating + call to action */}
              <motion.div
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={0.22}
                className="flex flex-wrap items-center"
                style={{ gap: "clamp(0.75rem,2vw,1.5rem)", marginTop: "clamp(0.75rem,1.5vh,1.25rem)" }}
              >
                {rating && (
                  <span className="flex items-baseline" style={{ gap: "clamp(0.25rem,0.5vw,0.5rem)" }}>
                    <span className="font-mono tracking-[0.15em] text-white/40 uppercase" style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}>Rating</span>
                    <span className="font-mono font-semibold text-gold" style={{ fontSize: "clamp(1rem,1.8vw,1.4rem)" }}>{rating}</span>
                    <span className="font-mono text-white/40" style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}>/ 10</span>
                  </span>
                )}
              </motion.div>

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Now Showing strip ─────────────────────────────── */}
          {relatedFilms.length > 0 && (
            <div style={{ flex: "1 1 clamp(240px, 40vw, 560px)", minWidth: 0 }}>
              <HeroCarousel
                films={relatedFilms}
                label="NOW SHOWING"
                activeFilmId={current?.id}
              />
            </div>
          )}
        </div>

        {/* ══ Dot indicators — pill shape with width transition ═══ */}
        {total > 1 && (
          <div
            className="flex items-center justify-center"
            style={{ gap: "clamp(0.3rem,0.5vw,0.4rem)", marginTop: "clamp(0.5rem,1.2vh,1rem)" }}
          >
            {allFilms.map((f, i) => (
              <button
                key={f.id}
                onClick={() => navigateTo(i)}
                aria-label={`Go to film ${i + 1}`}
                className="cursor-pointer border-none bg-transparent flex items-center justify-center"
                style={{ width: "32px", height: "32px", padding: 0 }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width:            i === displayIdx ? "24px"    : "8px",
                    height:           "8px",
                    backgroundColor:  i === displayIdx ? "#c9a843" : "rgba(255,255,255,0.25)",
                    transition:       "width 300ms ease, background-color 300ms ease",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
