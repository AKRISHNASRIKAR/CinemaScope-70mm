import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { GENRE_MAP } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { backdropUrl, posterUrl } from "@/lib/utils/tmdbImage";

const DISPLAY_MS = 5600;
const PAUSE_MS = 9000;
const IMG_FADE_MS = 1100;
const CONTENT_OUT_MS = 240;
const CONTENT_IN_MS = 520;
const HERO_EASE = [0.16, 1, 0.3, 1];
const PORTRAIT_ART_MEDIA = "(max-width: 700px), (orientation: portrait) and (max-width: 1024px)";

const getGenres = (film) => {
  if (film?.genres?.length) return film.genres.slice(0, 3).map((genre) => genre.name);
  if (film?.genre_ids?.length) {
    return film.genre_ids.slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);
  }
  return [];
};

const artOf = (film) => {
  const desktopSrc = backdropUrl(film?.backdrop_path) ?? posterUrl(film?.poster_path, "w780");
  const mobileSrc = posterUrl(film?.poster_path, "w780") ?? desktopSrc;

  return { desktopSrc, mobileSrc };
};

const preloadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });

const preloadArt = (art) =>
  Promise.all([
    preloadImage(art?.desktopSrc),
    art?.mobileSrc !== art?.desktopSrc ? preloadImage(art?.mobileSrc) : Promise.resolve(),
  ]);

const contentVariants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: CONTENT_IN_MS / 1000, ease: HERO_EASE, delay },
  }),
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    transition: { duration: CONTENT_OUT_MS / 1000, ease: "easeIn" },
  },
};

const staticVariants = {
  hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
  exit: { opacity: 1, y: 0, transition: { duration: 0 } },
};

const Hero = ({ film, relatedFilms = [] }) => {
  const allFilms = useMemo(
    () => (film ? [film, ...relatedFilms.slice(0, 6)].filter(Boolean) : []),
    [film, relatedFilms]
  );
  const total = allFilms.length;
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? staticVariants : contentVariants;
  const initialArt = useMemo(() => artOf(allFilms[0]), [allFilms]);
  const filmSequenceKey = allFilms.map((item) => item?.id).join(":");

  const [layerA, setLayerA] = useState({ idx: 0, ...initialArt });
  const [layerB, setLayerB] = useState({ idx: 1 % Math.max(total, 1), desktopSrc: null, mobileSrc: null, visible: false });
  const [displayIdx, setDisplayIdx] = useState(0);
  const [contentKey, setContentKey] = useState(0);

  const timerRef = useRef(null);
  const pauseRef = useRef(null);
  const transRef = useRef(false);
  const activeIdxRef = useRef(0);
  activeIdxRef.current = displayIdx;

  useEffect(() => {
    if (!total) return;

    clearInterval(timerRef.current);
    clearTimeout(pauseRef.current);
    transRef.current = false;
    activeIdxRef.current = 0;
    setDisplayIdx(0);
    setContentKey((key) => key + 1);
    setLayerA({ idx: 0, ...initialArt });
    setLayerB({ idx: total > 1 ? 1 : 0, desktopSrc: null, mobileSrc: null, visible: false });
  }, [filmSequenceKey, initialArt, total]);

  const transitionTo = useCallback(
    (nextIdx) => {
      if (transRef.current || total <= 0) return;

      const normIdx = ((nextIdx % total) + total) % total;
      if (normIdx === activeIdxRef.current) return;

      const nextFilm = allFilms[normIdx];
      const nextArt = artOf(nextFilm);
      transRef.current = true;

      if (shouldReduceMotion) {
        setLayerA({ idx: normIdx, ...nextArt });
        setLayerB({ idx: (normIdx + 1) % total, desktopSrc: null, mobileSrc: null, visible: false });
        setDisplayIdx(normIdx);
        setContentKey((key) => key + 1);
        transRef.current = false;
        return;
      }

      preloadArt(nextArt).then(() => {
        setLayerB({ idx: normIdx, ...nextArt, visible: false });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setLayerB((previous) => ({ ...previous, visible: true }));
            setDisplayIdx(normIdx);
            setContentKey((key) => key + 1);

            setTimeout(() => {
              setLayerA({ idx: normIdx, ...nextArt });
              setLayerB({ idx: (normIdx + 1) % total, desktopSrc: null, mobileSrc: null, visible: false });
              transRef.current = false;
            }, IMG_FADE_MS + 60);
          });
        });
      });
    },
    [allFilms, shouldReduceMotion, total]
  );

  const startAuto = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      transitionTo((activeIdxRef.current + 1) % total);
    }, DISPLAY_MS);
  }, [total, transitionTo]);

  useEffect(() => {
    if (total <= 1 || shouldReduceMotion) return undefined;

    preloadArt(artOf(allFilms[1 % total]));
    startAuto();

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pauseRef.current);
    };
  }, [allFilms, shouldReduceMotion, startAuto, total]);

  const navigateTo = useCallback(
    (idx) => {
      clearInterval(timerRef.current);
      clearTimeout(pauseRef.current);
      transitionTo(idx);
      if (!shouldReduceMotion) pauseRef.current = setTimeout(startAuto, PAUSE_MS);
    },
    [shouldReduceMotion, startAuto, transitionTo]
  );

  const goPrev = useCallback(() => {
    if (total > 1) navigateTo((displayIdx - 1 + total) % total);
  }, [displayIdx, navigateTo, total]);

  const goNext = useCallback(() => {
    if (total > 1) navigateTo((displayIdx + 1) % total);
  }, [displayIdx, navigateTo, total]);

  if (!allFilms.length) return null;

  const current = allFilms[displayIdx] ?? allFilms[0];
  const genres = getGenres(current);
  const year = current?.release_date?.slice(0, 4) ?? "";
  const rating = current?.vote_average ? current.vote_average.toFixed(1) : null;
  const title = current?.title || current?.original_title || "Featured Film";
  const label = genres[0] ? `${genres[0]} selection` : "Featured film";
  const goToFilm = () => navigate(`/film/${current?.id}`);

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden bg-base group/hero"
      style={{ minHeight: "100svh" }}
      aria-label="Featured films carousel"
      aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goPrev();
        if (event.key === "ArrowRight") goNext();
      }}
    >
      {layerA.desktopSrc && (
        <picture>
          {layerA.mobileSrc && (
            <source media={PORTRAIT_ART_MEDIA} srcSet={layerA.mobileSrc} />
          )}
          <img
            src={layerA.desktopSrc}
            alt=""
            aria-hidden
            fetchPriority="high"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              zIndex: 1,
              willChange: "opacity",
              filter: "brightness(0.92) saturate(1.06) contrast(1.04)",
              objectPosition: "center 34%",
            }}
          />
        </picture>
      )}

      {layerB.desktopSrc && (
        <picture>
          {layerB.mobileSrc && (
            <source media={PORTRAIT_ART_MEDIA} srcSet={layerB.mobileSrc} />
          )}
          <img
            src={layerB.desktopSrc}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              zIndex: 2,
              opacity: layerB.visible ? 1 : 0,
              transition: `opacity ${IMG_FADE_MS}ms cubic-bezier(0.16,1,0.3,1)`,
              willChange: "opacity",
              filter: "brightness(0.92) saturate(1.06) contrast(1.04)",
              objectPosition: "center 34%",
            }}
          />
        </picture>
      )}

      <div className="absolute inset-0" style={{ zIndex: 3 }} aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/8 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/32 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/55 via-black/18 to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 42%, transparent 0%, transparent 52%, rgba(0,0,0,0.42) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.16] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "160px 160px",
          }}
        />
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous featured film"
            className="
              absolute left-4 top-1/2 -translate-y-1/2
              flex items-center justify-center rounded-full
              bg-black/20 backdrop-blur-md border border-white/15
              text-white/60 hover:text-white hover:bg-black/60
              opacity-0 hover:opacity-100 focus-visible:opacity-100
              group-hover/hero:opacity-100
              transition-all duration-300 hover:scale-[1.04] cursor-pointer
            "
            style={{ width: "clamp(2.5rem,4vw,3.5rem)", height: "clamp(2.5rem,4vw,3.5rem)", zIndex: 20 }}
          >
            <ChevronLeftIcon sx={{ fontSize: "clamp(1.2rem,2vw,1.8rem)" }} />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next featured film"
            className="
              absolute right-4 top-1/2 -translate-y-1/2
              flex items-center justify-center rounded-full
              bg-black/20 backdrop-blur-md border border-white/15
              text-white/60 hover:text-white hover:bg-black/60
              opacity-0 hover:opacity-100 focus-visible:opacity-100
              group-hover/hero:opacity-100
              transition-all duration-300 hover:scale-[1.04] cursor-pointer
            "
            style={{ width: "clamp(2.5rem,4vw,3.5rem)", height: "clamp(2.5rem,4vw,3.5rem)", zIndex: 20 }}
          >
            <ChevronRightIcon sx={{ fontSize: "clamp(1.2rem,2vw,1.8rem)" }} />
          </button>
        </>
      )}

      <div
        className="absolute inset-x-0 z-10 pointer-events-none"
        style={{
          bottom: "clamp(7rem, 16vh, 11rem)",
          padding: "0 clamp(1.35rem, 5vw, 4rem)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            className="pointer-events-auto"
            style={{ maxWidth: "min(84vw, 920px)", willChange: "opacity, transform" }}
          >
            <motion.p
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={0}
              className="inline-flex items-center border border-white/55 px-2 py-0.5 font-mono uppercase text-white/80"
              style={{ fontSize: "clamp(0.58rem, 0.9vw, 0.72rem)", letterSpacing: "0.06em", lineHeight: 1.2 }}
            >
              {label}
            </motion.p>

            <motion.h1
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={0.07}
              className="font-wordmark font-black uppercase text-white"
              style={{
                fontSize: "clamp(2.6rem, 8.4vw, 7.4rem)",
                lineHeight: 0.84,
                letterSpacing: "-0.065em",
                marginTop: "clamp(0.9rem, 1.8vh, 1.35rem)",
                textWrap: "balance",
                overflowWrap: "break-word",
                maxWidth: "11ch",
                textShadow: "0 0.08em 0.32em rgba(0,0,0,0.58)",
              }}
            >
              <Link
                to={`/film/${current?.id}`}
                className="cursor-pointer outline-none transition-colors duration-fast hover:text-white/80 focus-visible:text-white/80"
              >
                {title}
              </Link>
            </motion.h1>

            <motion.div
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={0.16}
              className="flex w-fit flex-wrap items-center rounded-full border border-white/15 bg-black/35 font-mono uppercase text-white/95"
              style={{
                gap: "clamp(0.45rem, 0.8vw, 0.7rem)",
                marginTop: "clamp(0.75rem, 1.4vh, 1.1rem)",
                padding: "0.36rem 0.65rem",
                fontSize: "clamp(0.86rem, 1.08vw, 0.96rem)",
                letterSpacing: "0.04em",
                textShadow: "0 2px 12px rgba(0,0,0,0.62)",
              }}
            >
              {rating && (
                <span className="text-gold">
                  {rating}
                  <span className="text-white/50"> / 10</span>
                </span>
              )}
              {rating && year && <span className="text-white/30">/</span>}
              {year && <span className="text-white/70">{year}</span>}
              {(year || rating) && genres.length > 1 && <span className="text-white/30">/</span>}
              {genres.slice(1, 3).map((genre) => (
                <span key={genre} className="text-white/70">{genre}</span>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div
          className="absolute inset-x-0 z-20 flex items-center justify-center"
          style={{ bottom: "clamp(2.4rem, 8vh, 5.5rem)", gap: "0.62rem" }}
        >
          {allFilms.map((item, index) => {
            const isActive = index === displayIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(index)}
                aria-label={`Show ${item.title || item.original_title}`}
                aria-current={isActive ? "true" : undefined}
                className="flex items-center justify-center rounded-full cursor-pointer"
                style={{
                  width: isActive ? "2rem" : "1.15rem",
                  height: "1.15rem",
                  transition: "width 300ms ease",
                }}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: isActive ? "1.6rem" : "0.58rem",
                    height: isActive ? "0.48rem" : "0.58rem",
                    background: isActive ? "rgba(255,255,255,0.86)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.86)" : "2px solid rgba(255,255,255,0.56)",
                    transition: "width 300ms ease, height 300ms ease, border-color 300ms ease, background 300ms ease",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      <button type="button" onClick={goToFilm} className="sr-only">
        View details for {title}
      </button>
    </section>
  );
};

export default Hero;
