import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HeroCarousel from "./HeroCarousel";
import { GENRE_MAP } from "@/lib/constants";

/* ── constants ──────────────────────────────────────────────────── */
const DISPLAY_MS  = 5000;   // time each film is shown before auto-advance
const PAUSE_MS    = 8000;   // pause after manual click
const IMG_FADE_MS = 1000;   // backdrop crossfade duration
const CONTENT_OUT_MS = 300; // text fade-out
const CONTENT_IN_MS  = 400; // text fade-in

/* ── helpers ─────────────────────────────────────────────────────── */
const getGenres = (film) => {
  if (film?.genres?.length) return film.genres.slice(0, 3).map((g) => g.name);
  if (film?.genre_ids?.length)
    return film.genre_ids.slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);
  return [];
};

const backdropOf = (film) =>
  film?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${film.backdrop_path}`
    : null;

/** Preloads an image; resolves on load, resolves (not rejects) on error
 *  so the caller always continues. */
const preloadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.onload  = resolve;
    img.onerror = resolve; // fail gracefully — never block the transition
    img.src = src;
  });

/* ── framer-motion variants ──────────────────────────────────────── */
const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: CONTENT_IN_MS / 1000, ease: [0.25, 0.46, 0.45, 0.94], delay },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: CONTENT_OUT_MS / 1000, ease: "easeIn" } },
};

/* ══════════════════════════════════════════════════════════════════
   Hero component
══════════════════════════════════════════════════════════════════ */
const Hero = ({ film, relatedFilms = [] }) => {
  const allFilms = film ? [film, ...relatedFilms.slice(0, 6)] : [];
  const navigate = useNavigate();
  const total    = allFilms.length;

  /* ── image layer state ─────────────────────────────────────────
     layerA = currently visible backdrop
     layerB = incoming backdrop (hidden until preloaded, then fades in)
     After B's fade completes → B becomes A, new B is prepared
  ─────────────────────────────────────────────────────────────── */
  const [layerA, setLayerA] = useState({ idx: 0, src: backdropOf(allFilms[0]) });
  const [layerB, setLayerB] = useState({ idx: 1 % Math.max(total, 1), src: null, visible: false });

  /* ── content / active index ─────────────────────────────────── */
  const [displayIdx, setDisplayIdx] = useState(0); // drives text content
  const [contentKey, setContentKey] = useState(0); // forces AnimatePresence re-mount

  /* ── refs ────────────────────────────────────────────────────── */
  const timerRef      = useRef(null);
  const pauseRef      = useRef(null);
  const transRef      = useRef(false);        // guard against overlapping transitions
  const activeIdxRef  = useRef(0);            // stale-closure-safe copy of displayIdx
  const layerBRef     = useRef(layerB);       // mutable mirror for transitionend callback
  layerBRef.current   = layerB;
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

      // 1. Preload the backdrop image silently
      preloadImage(nextSrc).then(() => {
        // 2. Put layer B in place (invisible) with the preloaded src
        setLayerB({ idx: normIdx, src: nextSrc, visible: false });

        // Use rAF to ensure the DOM has the new src before starting fade
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // 3. Fade layer B in
            setLayerB((prev) => ({ ...prev, visible: true }));

            // 4. Update text content immediately as B starts fading
            setDisplayIdx(normIdx);
            setContentKey((k) => k + 1);

            // 5. After fade completes, promote B → A, reset B
            setTimeout(() => {
              setLayerA({ idx: normIdx, src: nextSrc });
              setLayerB({
                idx: (normIdx + 1) % total,
                src: null,
                visible: false,
              });
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

  const current = allFilms[displayIdx] ?? allFilms[0];
  const genres  = getGenres(current);
  const year    = current?.release_date?.slice(0, 4) ?? "";
  const rating  = current?.vote_average ? current.vote_average.toFixed(1) : null;

  return (
    <section
      className="relative w-full overflow-hidden bg-base group/hero"
      style={{ height: "100vh", minHeight: "100vh" }}
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
      <div className="absolute inset-0" style={{ zIndex: 3, pointerEvents: "none" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />
        {/* Film grain */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
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
              bg-black/40 backdrop-blur-sm border border-white/10
              text-white/60 hover:text-white hover:bg-black/60
              transition-all duration-normal cursor-pointer
              sm:opacity-0 sm:group-hover/hero:opacity-100
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
              bg-black/40 backdrop-blur-sm border border-white/10
              text-white/60 hover:text-white hover:bg-black/60
              transition-all duration-normal cursor-pointer
              sm:opacity-0 sm:group-hover/hero:opacity-100
            "
            style={{ width: "clamp(2.5rem,4vw,3.5rem)", height: "clamp(2.5rem,4vw,3.5rem)", zIndex: 20 }}
          >
            <ChevronRightIcon sx={{ fontSize: "clamp(1.2rem,2vw,1.8rem)" }} />
          </button>
        </>
      )}

      {/* ══ Dot indicators — pill shape with width transition ═══════ */}
      {total > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center"
          style={{ gap: "clamp(0.3rem,0.5vw,0.4rem)", zIndex: 20 }}
        >
          {allFilms.map((f, i) => (
            <button
              key={f.id}
              onClick={() => navigateTo(i)}
              aria-label={`Go to film ${i + 1}`}
              className="rounded-full cursor-pointer border-none transition-colors duration-[300ms]"
              style={{
                width:            i === displayIdx ? "24px"    : "8px",
                height:           "8px",
                backgroundColor:  i === displayIdx ? "#c9a843" : "rgba(255,255,255,0.25)",
                transition:       "width 300ms ease, background-color 300ms ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ══ Film info — centered constraint ════════════════════════ */}
      <div className="absolute inset-0 z-10 pointer-events-none center-container px-4 sm:px-6 lg:px-12">
        <div className="relative h-full w-full">
          <div
            className="absolute pointer-events-auto"
            style={{
              bottom: "clamp(2rem,6vh,4rem)",
              left: 0,
              maxWidth: "clamp(280px,45vw,600px)",
            }}
            onClick={() => navigate(`/film/${current?.id}`)}
          >
            <AnimatePresence mode="wait">
              <motion.div key={contentKey} style={{ willChange: "opacity, transform" }}>

                {/* Genre tags */}
                {genres.length > 0 && (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={0}
                    className="flex items-center flex-wrap mb-[clamp(0.5rem,1vh,0.75rem)]"
                    style={{ gap: "clamp(0.4rem,0.8vw,0.6rem)" }}
                  >
                    {genres.map((genre, i) => (
                      <React.Fragment key={genre}>
                        <span
                          className="font-body font-medium tracking-[0.18em] text-white/50 uppercase hover:text-white transition-colors duration-fast cursor-pointer"
                          style={{ fontSize: "clamp(0.75rem, 1.4vw, 0.95rem)" }}
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
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={0.08}
                  className="text-white leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(2rem,5vw,5rem)",
                    paddingTop: "clamp(0.75rem, 2vw, 1.25rem)",
                    paddingBottom: "clamp(0.75rem, 2vw, 1.25rem)",
                    willChange: "opacity, transform",
                  }}
                >
                  {current?.title || current?.original_title}
                </motion.h1>

                {/* Metadata row */}
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={0.16}
                  className="flex flex-wrap items-center text-white/40 font-mono tracking-[0.06em]"
                  style={{ gap: "clamp(0.3rem,0.6vw,0.5rem)", fontSize: "clamp(0.75rem, 1.4vw, 0.95rem)" }}
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

                {/* Rating */}
                {rating && (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={0.22}
                    className="flex items-baseline gap-[clamp(0.25rem,0.5vw,0.5rem)] mt-[clamp(0.75rem,1.5vh,1.25rem)]"
                  >
                    <span className="font-mono tracking-[0.15em] text-white/40 uppercase" style={{ fontSize: "clamp(0.6rem,1vw,0.75rem)" }}>Rating</span>
                    <span className="font-mono font-semibold text-gold" style={{ fontSize: "clamp(1.1rem,2vw,1.5rem)" }}>{rating}</span>
                    <span className="font-mono text-white/40" style={{ fontSize: "clamp(0.6rem,1vw,0.75rem)" }}>/ 10</span>
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══ Now Showing carousel — passes activeFilmId for scroll sync ══ */}
      {relatedFilms.length > 0 && (
        <div
          className="absolute z-10 hidden sm:block"
          style={{ bottom: "clamp(2rem,5vh,3rem)", right: 0, zIndex: 10 }}
        >
          <HeroCarousel
            films={relatedFilms}
            label="NOW SHOWING"
            activeFilmId={current?.id}
          />
        </div>
      )}
    </section>
  );
};

export default Hero;
