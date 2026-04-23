import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const VISIBLE = 5;

const HeroCarousel = ({ films = [], label = "PEOPLE ALSO LIKED" }) => {
  const [start, setStart] = useState(0);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const slice = films.slice(start, start + VISIBLE);
  const canPrev = start > 0;
  const canNext = start + VISIBLE < films.length;

  return (
    <div className="flex flex-col gap-3 px-4 md:px-8 select-none">
      {/* Label + arrows */}
      <div className="flex items-center justify-between">
        <span className="font-mono tracking-[0.22em] text-tag text-white/40 uppercase">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => canPrev && setStart((s) => s - 1)}
            disabled={!canPrev}
            className="p-1 text-white/30 hover:text-white disabled:opacity-20 transition-colors duration-fast"
          >
            <ChevronLeftIcon sx={{ fontSize: 16 }} />
          </button>
          <button
            onClick={() => canNext && setStart((s) => s + 1)}
            disabled={!canNext}
            className="p-1 text-white/30 hover:text-white disabled:opacity-20 transition-colors duration-fast"
          >
            <ChevronRightIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Poster cards */}
      <div className="flex items-end gap-2.5">
        {slice.map((film) => {
          const isSelected = selected === film.id;
          return (
            <div
              key={film.id}
              onClick={() => {
                setSelected(film.id);
                navigate(`/film/${film.id}`);
              }}
              className={`
                flex-shrink-0 w-[76px] cursor-pointer group
                transition-transform duration-normal ease-cinematic
                hover:-translate-y-2
                ${isSelected ? "ring-1 ring-gold rounded-card" : ""}
              `}
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
              <p className="mt-1.5 text-[9px] font-body text-white/50 group-hover:text-white/80 line-clamp-1 transition-colors duration-fast leading-tight">
                {film.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeroCarousel;
