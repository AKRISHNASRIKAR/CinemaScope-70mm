import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// TMDB Genre mapping (you can fetch this from /genre/movie/list endpoint)
const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const Banner = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const navigate = useNavigate();
  const minSwipeDistance = 50;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;

    if (distance > minSwipeDistance) nextSlide();
    if (distance < -minSwipeDistance) prevSlide();
  };

  useEffect(() => {
    if (!isHovered && movies.length > 0) {
      const interval = setInterval(nextSlide, 3500);
      return () => clearInterval(interval);
    }
  }, [currentIndex, isHovered, movies.length]);

  if (!movies?.length) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-gray-900">
        <h2 className="text-white text-2xl">No movies found.</h2>
      </div>
    );
  }

  const currentMovie = movies[currentIndex];

  // Map genre_ids to genre names
  const getGenreNames = () => {
    if (!currentMovie.genre_ids || currentMovie.genre_ids.length === 0)
      return [];
    return currentMovie.genre_ids
      .slice(0, 3)
      .map((id) => GENRE_MAP[id])
      .filter(Boolean);
  };

  const genres = getGenreNames();

  return (
    <div
      className="relative w-full h-[65vh] sm:h-[80vh] lg:h-[92vh] overflow-hidden rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background */}
      <img
        key={currentMovie.id}
        src={`https://image.tmdb.org/t/p/original${currentMovie.backdrop_path}`}
        alt={currentMovie.title}
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={(e) => {
          e.target.src = "/fallback-image-film.jpg";
        }}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Slide Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full hover:bg-black/50 transition-all z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full hover:bg-black/50 transition-all z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* MOVIE CONTENT */}
      <div
        className="absolute bottom-6 sm:bottom-10 md:bottom-12 lg:bottom-16 left-4 sm:left-8 md:left-12 lg:left-16 right-4 cursor-pointer"
        onClick={() => navigate(`/film/${currentMovie.id}`)}
      >
        <div className="text-left text-white max-w-xl lg:max-w-2xl space-y-2 sm:space-y-2 md:space-y-3">
          {/* GENRES */}
          <div className=" flex items-center gap-2 text-[9px] sm:text-[10px] md:text-xs  uppercase tracking-[0.15em] sm:tracking-[0.2em] font-light text-white/70 -mb-1 sm:-mb-1.5  ">
            {genres.map((genre, index) => (
              <React.Fragment key={index}>
                <span>{genre}</span>
                {index < genres.length - 1 && (
                  <span className="text-white/30">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
          {/* TITLE */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[0.9] tracking-tight">
            {currentMovie.title || currentMovie.original_title}
          </h1>

          {/* META */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-xs text-white/60 pt-1">
            {/* Year */}
            {currentMovie.release_date && (
              <span className="font-light">
                {currentMovie.release_date.slice(0, 4)}
              </span>
            )}

            {/* Rating */}
            {currentMovie.vote_average && (
              <>
                <span className="text-white/30">|</span>
                <span className="font-light flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  {currentMovie.vote_average.toFixed(1)}
                </span>
              </>
            )}

            {/* Language */}
            {currentMovie.original_language && (
              <>
                <span className="text-white/30 hidden md:inline">|</span>
                <span className="font-light uppercase hidden md:inline">
                  {currentMovie.original_language}
                </span>
              </>
            )}
          </div>

          {/* DESCRIPTION */}
          <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed text-white/70 max-w-sm md:max-w-md lg:max-w-lg font-light line-clamp-1 sm:line-clamp-3 pt-1 sm:pt-2">
            {currentMovie.overview || "No description available."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Banner;
