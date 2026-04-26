import { useNavigate } from "react-router-dom";
import LazyImage from "@/components/ui/LazyImage";
import { posterUrl } from "@/lib/utils/tmdbImage";

const FilmCard = ({ film, subtitle, className = "" }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/film/${film.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/film/${film.id}`); } }}
      role="button"
      tabIndex={0}
      aria-label={film.title}
      className={`group cursor-pointer flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-card ${className}`}
    >
      <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
        <LazyImage
          src={posterUrl(film.poster_path, "w342") ?? "/fallback-image-film.jpg"}
          alt={film.title}
          fallbackType="poster"
          className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-normal" />
      </div>
      <p
        className="font-body font-medium line-clamp-1 leading-snug group-hover:text-gold transition-colors duration-fast"
        style={{ marginTop: "clamp(0.4rem,0.8vh,0.6rem)", fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}
      >
        {film.title}
      </p>
      {subtitle && (
        <p className="mt-0.5 font-body text-muted line-clamp-1" style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default FilmCard;
