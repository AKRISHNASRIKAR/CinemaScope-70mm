import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const CARD_WIDTH_PX = 90; // approximate card width for scroll increment

const HeroCarousel = ({ films = [], label = "NOW SHOWING", activeFilmId = null }) => {
  const navigate   = useNavigate();
  const stripRef   = useRef(null);
  const cardRefs   = useRef({});

  /* ── Smooth-scroll active card into view when hero film changes ── */
  useEffect(() => {
    if (!activeFilmId || !stripRef.current) return;
    const el = cardRefs.current[activeFilmId];
    if (el) {
      // Use scrollIntoView so the card is centered horizontally
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeFilmId]);

  const scrollBy = (direction) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * CARD_WIDTH_PX * 2, behavior: "smooth" });
  };

  if (!films.length) return null;

  return (
    <div
      className="flex flex-col select-none"
      style={{ gap: "clamp(0.5rem,1vh,0.75rem)", paddingRight: "clamp(1rem,3vw,2.5rem)" }}
    >
      {/* Label */}
      <span
        className="font-mono tracking-[0.22em] text-white/40 uppercase"
        style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)", paddingLeft: "clamp(0.5rem,1vw,1rem)" }}
      >
        {label}
      </span>

      {/* Carousel strip with arrows */}
      <div className="relative flex items-center">

        {/* Prev arrow — hidden on mobile */}
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="
            hidden sm:flex
            absolute -left-3 z-20 items-center justify-center rounded-full
            bg-black/50 backdrop-blur-sm border border-white/10
            text-white/70 hover:text-white hover:bg-black/70
            transition-all duration-fast cursor-pointer
          "
          style={{ width: "clamp(1.5rem,2.5vw,2rem)", height: "clamp(1.5rem,2.5vw,2rem)" }}
        >
          <ChevronLeftIcon sx={{ fontSize: "clamp(0.8rem,1.4vw,1.1rem)" }} />
        </button>

        {/* Scrollable strip */}
        <div
          ref={stripRef}
          className="flex items-end overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{
            gap: "clamp(0.4rem,0.8vw,0.6rem)",
            paddingLeft: "clamp(0.5rem,1vw,1rem)",
            paddingRight: "clamp(0.5rem,1vw,1rem)",
            maxWidth: "clamp(200px,50vw,600px)",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {films.map((film) => {
            const isActive = film.id === activeFilmId;
            return (
              <div
                key={film.id}
                ref={(el) => { cardRefs.current[film.id] = el; }}
                onClick={() => navigate(`/film/${film.id}`)}
                className="flex-shrink-0 cursor-pointer group"
                style={{
                  width: "clamp(70px,10vw,120px)",
                  scrollSnapAlign: "start",
                  transform: "translateY(0)",
                  transition: "transform 200ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div
                  className="relative w-full aspect-[2/3] rounded-card overflow-hidden"
                  style={{
                    boxShadow: isActive
                      ? "0 0 0 2px #c9a843, 0 4px 20px rgba(0,0,0,0.6)"
                      : "0 4px 16px rgba(0,0,0,0.5)",
                    transition: "box-shadow 200ms ease",
                  }}
                >
                  <img
                    src={
                      film.poster_path
                        ? `https://image.tmdb.org/t/p/w200${film.poster_path}`
                        : "/fallback-image-film.jpg"
                    }
                    alt={film.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{
                      opacity: isActive ? 1 : 0.55,
                      transition: "opacity 200ms ease",
                    }}
                  />
                </div>
                <p
                  className="font-body line-clamp-1 leading-tight"
                  style={{
                    fontSize: "clamp(0.5rem,0.85vw,0.7rem)",
                    marginTop: "clamp(0.3rem,0.5vh,0.5rem)",
                    color: isActive ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                    transition: "color 200ms ease",
                  }}
                >
                  {film.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Next arrow — hidden on mobile */}
        <button
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="
            hidden sm:flex
            absolute -right-1 z-20 items-center justify-center rounded-full
            bg-black/50 backdrop-blur-sm border border-white/10
            text-white/70 hover:text-white hover:bg-black/70
            transition-all duration-fast cursor-pointer
          "
          style={{ width: "clamp(1.5rem,2.5vw,2rem)", height: "clamp(1.5rem,2.5vw,2rem)" }}
        >
          <ChevronRightIcon sx={{ fontSize: "clamp(0.8rem,1.4vw,1.1rem)" }} />
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;
