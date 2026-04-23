import { useNavigate } from "react-router-dom";

const FilmCard = ({ film, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/film/${film.id}`)}
      className="group cursor-pointer flex flex-col"
    >
      {/* Poster */}
      <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
        <img
          src={
            film.poster_path
              ? `https://image.tmdb.org/t/p/w342${film.poster_path}`
              : "/fallback-image-film.jpg"
          }
          alt={film.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105"
        />
        {/* hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-normal" />
      </div>

      {/* Title */}
      <p className="mt-2 font-body text-caption font-medium line-clamp-1 leading-snug group-hover:text-gold transition-colors duration-fast">
        {film.title}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-0.5 font-body text-[10px] text-muted line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default FilmCard;
