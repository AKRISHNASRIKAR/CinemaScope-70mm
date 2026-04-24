import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const VISIBLE = 5;

const HeroCarousel = ({ films = [], label = "NOW SHOWING" }) => {
  const [start, setStart] = useState(0);
  const navigate = useNavigate();

  const slice   = films.slice(start, start + VISIBLE);
  const canPrev = start > 0;
  const canNext = start + VISIBLE < films.length;

  return (
    <div className="flex flex-col select-none" style={{ gap: "clamp(0.5rem, 1vh, 0.75rem)", paddingRight: "clamp(1rem, 3vw, 2.5rem)" }}>
      {/* Label */}
      <span
        className="font-mono tracking-[0.22em] text-white/40 uppercase"
        style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)", paddingLeft: "clamp(0.5rem, 1vw, 1rem)" }}
      >
        {label}
      </span>

      {/* Carousel strip with arrows */}
      <div className="relative flex items-center">
        {/* Prev arrow */}
        <button
          onClick={() => canPrev && setStart((s) => s - 1)}
          disabled={!canPrev}
          className={`
            absolute -left-3 z-20 flex items-center justify-center rounded-full
            bg-black/50 backdrop-blur-sm border border-white/10
            text-white/70 hover:text-white hover:bg-black/70
            transition-all duration-fast cursor-pointer
            disabled:opacity-0 disabled:pointer-events-none
          `}
          style={{ width: "clamp(1.5rem, 2.5vw, 2rem)", height: "clamp(1.5rem, 2.5vw, 2rem)" }}
        >
          <ChevronLeftIcon sx={{ fontSize: "clamp(0.8rem, 1.4vw, 1.1rem)" }} />
        </button>

        {/* Cards */}
        <div className="flex items-end" style={{ gap: "clamp(0.4rem, 0.8vw, 0.6rem)", paddingLeft: "clamp(0.5rem, 1vw, 1rem)" }}>
          {slice.map((film) => (
            <div
              key={film.id}
              onClick={() => navigate(`/film/${film.id}`)}
              className="flex-shrink-0 cursor-pointer group transition-transform duration-normal ease-cinematic hover:-translate-y-1.5"
              style={{ width: "clamp(90px, 10vw, 160px)" }}
            >
              <img
                src={
                  film.poster_path
                    ? `https://image.tmdb.org/t/p/w200${film.poster_path}`
                    : "/fallback-image-film.jpg"
                }
                alt={film.title}
                className="w-full aspect-[2/3] object-cover rounded-card shadow-card"
              />
              <p
                className="font-body text-white/50 group-hover:text-white/80 line-clamp-1 transition-colors duration-fast leading-tight"
                style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.7rem)", marginTop: "clamp(0.3rem, 0.5vh, 0.5rem)" }}
              >
                {film.title}
              </p>
            </div>
          ))}
        </div>

        {/* Next arrow */}
        <button
          onClick={() => canNext && setStart((s) => s + 1)}
          disabled={!canNext}
          className={`
            absolute -right-1 z-20 flex items-center justify-center rounded-full
            bg-black/50 backdrop-blur-sm border border-white/10
            text-white/70 hover:text-white hover:bg-black/70
            transition-all duration-fast cursor-pointer
            disabled:opacity-0 disabled:pointer-events-none
          `}
          style={{ width: "clamp(1.5rem, 2.5vw, 2rem)", height: "clamp(1.5rem, 2.5vw, 2rem)" }}
        >
          <ChevronRightIcon sx={{ fontSize: "clamp(0.8rem, 1.4vw, 1.1rem)" }} />
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;
