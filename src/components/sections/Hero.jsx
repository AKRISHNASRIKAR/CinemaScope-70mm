import React from "react";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HeroCarousel from "./HeroCarousel";
import PlayButton from "@/components/ui/PlayButton";
import { GENRE_MAP } from "@/lib/constants";

/* ── helpers ─────────────────────────────────────────────── */
const fmtRuntime = (min) => {
  if (!min) return null;
  return `${Math.floor(min / 60)}H ${min % 60}MIN`;
};

const getGenres = (film) => {
  if (film.genres?.length) return film.genres.slice(0, 3).map((g) => g.name);
  if (film.genre_ids?.length)
    return film.genre_ids.slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);
  return [];
};

/* ── component ───────────────────────────────────────────── */
const Hero = ({ film, relatedFilms = [] }) => {
  const navigate = useNavigate();
  if (!film) return null;

  const backdrop = film.backdrop_path
    ? `https://image.tmdb.org/t/p/original${film.backdrop_path}`
    : null;

  const genres  = getGenres(film);
  const year    = film.release_date?.slice(0, 4) ?? "";
  const rating  = film.vote_average ? film.vote_average.toFixed(1) : null;
  const runtime = fmtRuntime(film.runtime);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-base">

      {/* ── Backdrop ─────────────────────────────────────── */}
      {backdrop && (
        <img
          src={backdrop}
          alt={film.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* ── Vignettes ────────────────────────────────────── */}
      {/* Bottom-heavy gradient — deepens the bottom-left corner */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      {/* Left-heavy gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />
      {/* Top fade so navbar text is readable */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />

      {/* ── Film grain overlay ────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      {/* ── ADD TO WATCHLIST — top right ─────────────────── */}
      <div className="absolute top-24 right-10 z-10">
        <button className="flex items-center gap-2 text-gold hover:text-gold-lt transition-colors duration-normal group cursor-pointer">
          <FavoriteBorderIcon
            sx={{ fontSize: 17 }}
            className="group-hover:scale-110 transition-transform duration-fast"
          />
          <span className="font-body font-medium tracking-[0.18em] text-nav uppercase">
            Add to Watchlist
          </span>
        </button>
      </div>

      {/* ── Center play button ────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-3 pointer-events-auto">
          {runtime && (
            <span className="font-mono tracking-[0.22em] text-tag text-white/45 uppercase">
              {runtime}
            </span>
          )}
          <PlayButton onClick={() => navigate(`/film/${film.id}`)} />
        </div>
      </div>

      {/* ── Bottom-left: Film info ────────────────────────── */}
      <div className="absolute bottom-14 left-10 lg:left-16 z-10 max-w-[40vw]">

        {/* Rating */}
        {rating && (
          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="font-mono tracking-[0.15em] text-tag text-white/40 uppercase">
              Rating
            </span>
            <span className="font-mono font-semibold text-gold text-xl">
              {rating}
            </span>
            <span className="font-mono text-tag text-white/40">/ 10</span>
          </div>
        )}

        {/* Genre tags */}
        {genres.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {genres.map((genre, i) => (
              <React.Fragment key={genre}>
                <span className="font-body font-medium tracking-[0.18em] text-tag text-white/50 uppercase">
                  {genre}
                </span>
                {i < genres.length - 1 && (
                  <span className="text-white/25 text-[9px]">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          className="font-display font-bold text-white leading-[0.9] tracking-tight mb-4"
          style={{ fontSize: "clamp(3rem, 6vw, 6.5rem)" }}
        >
          {film.title || film.original_title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4 font-mono text-meta text-white/40 tracking-[0.06em]">
          {year && <span>{year}</span>}
          {film.director && (
            <>
              <span className="text-white/20">|</span>
              <span>
                <span className="text-white/30 uppercase tracking-[0.1em] text-tag">Director: </span>
                {film.director}
              </span>
            </>
          )}
          {film.stars?.length > 0 && (
            <>
              <span className="text-white/20">|</span>
              <span>
                <span className="text-white/30 uppercase tracking-[0.1em] text-tag">Stars: </span>
                {film.stars.slice(0, 3).join(", ")}
              </span>
            </>
          )}
        </div>

        {/* Synopsis */}
        {film.overview && (
          <p className="font-body font-light text-sm leading-relaxed text-white/55 line-clamp-3">
            {film.overview}
          </p>
        )}
      </div>

      {/* ── Bottom-right: Carousel ────────────────────────── */}
      {relatedFilms.length > 0 && (
        <div className="absolute bottom-10 right-0 z-10">
          <HeroCarousel films={relatedFilms} />
        </div>
      )}
    </section>
  );
};

export default Hero;
