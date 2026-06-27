import { memo } from "react";
import { Link } from "react-router-dom";
import LazyImage from "@/components/ui/LazyImage";
import { posterUrl } from "@/lib/utils/tmdbImage";

const FilmCard = ({ film, subtitle, className = "", eager = false, imageSize = "w342" }) => {
  return (
    <Link
      to={`/film/${film.id}`}
      aria-label={`View ${film.title || "film details"}`}
      className={`group flex flex-col rounded-card focus-ring ${className}`}
    >
      <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
        <LazyImage
          src={posterUrl(film.poster_path, imageSize) ?? "/fallback-image-film.jpg"}
          alt={film.title ? `${film.title} poster` : "Film poster"}
          fallbackType="poster"
          eager={eager}
          className="poster-image w-full h-full object-cover"
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
    </Link>
  );
};

export default memo(FilmCard);
