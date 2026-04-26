import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScrollRow from "@/components/ui/ScrollRow";
import { posterUrl } from "@/lib/utils/tmdbImage";

const HeroCarousel = ({ films = [], label = "NOW SHOWING", activeFilmId = null }) => {
  const navigate  = useNavigate();
  const cardRefs  = useRef({});
  const stripRef  = useRef(null);

  /* ── Smooth-scroll active card into view when hero film changes ── */
  useEffect(() => {
    if (!activeFilmId || !stripRef.current) return;
    const el        = cardRefs.current[activeFilmId];
    const container = stripRef.current;
    if (el && container) {
      const targetScroll =
        el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  }, [activeFilmId]);

  if (!films.length) return null;

  return (
    <div
      className="flex flex-col select-none"
      style={{ paddingRight: "clamp(1rem,3vw,2.5rem)" }}
    >
      {/* Label */}
      <span
        className="font-mono tracking-[0.22em] text-white/40 uppercase mb-2"
        style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)", paddingLeft: "clamp(0.5rem,1vw,1rem)" }}
      >
        {label}
      </span>

      {/* Scroll strip — arrows only when > 5 items */}
      <div className="relative flex items-center group/hc">
        {films.length > 5 && (
          <button
            onClick={() => stripRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
            aria-label="Scroll Now Showing left"
            className="
              hidden sm:flex absolute -left-3 z-20
              items-center justify-center rounded-full
              bg-black/50 backdrop-blur-sm border border-white/10
              text-white/70 hover:text-white hover:bg-black/70
              opacity-30 group-hover/hc:opacity-100
              transition-all duration-fast cursor-pointer
            "
            style={{ width: "clamp(1.5rem,2.5vw,2rem)", height: "clamp(1.5rem,2.5vw,2rem)" }}
          >
            ‹
          </button>
        )}

        <div
          ref={stripRef}
          role="region"
          aria-label="Now Showing films"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft")  { e.preventDefault(); stripRef.current?.scrollBy({ left: -180, behavior: "smooth" }); }
            if (e.key === "ArrowRight") { e.preventDefault(); stripRef.current?.scrollBy({ left:  180, behavior: "smooth" }); }
          }}
          className="flex items-end overflow-x-auto overflow-y-visible scrollbar-hide py-4 outline-none focus-visible:ring-1 focus-visible:ring-gold/40 rounded"
          style={{
            gap: "clamp(0.4rem,0.8vw,0.6rem)",
            paddingLeft:  "clamp(0.5rem,1vw,1rem)",
            paddingRight: "clamp(0.5rem,1vw,1rem)",
            maxWidth: "clamp(200px,50vw,600px)",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {films.map((film) => {
            const isActive = film.id === activeFilmId;
            const src = posterUrl(film.poster_path, "w200") ?? "/fallback-image-film.jpg";

            return (
              <div
                key={film.id}
                ref={(el) => { cardRefs.current[film.id] = el; }}
                onClick={() => navigate(`/film/${film.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/film/${film.id}`); } }}
                role="button"
                tabIndex={0}
                aria-label={`${film.title}${isActive ? " (currently showing)" : ""}`}
                className="flex-shrink-0 cursor-pointer"
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
                    src={src}
                    alt={film.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{ opacity: isActive ? 1 : 0.55, transition: "opacity 200ms ease" }}
                  />
                </div>
                <p
                  className="font-body line-clamp-1 leading-tight mt-1"
                  style={{
                    fontSize: "clamp(0.5rem,0.85vw,0.7rem)",
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

        {films.length > 5 && (
          <button
            onClick={() => stripRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
            aria-label="Scroll Now Showing right"
            className="
              hidden sm:flex absolute -right-1 z-20
              items-center justify-center rounded-full
              bg-black/50 backdrop-blur-sm border border-white/10
              text-white/70 hover:text-white hover:bg-black/70
              opacity-30 group-hover/hc:opacity-100
              transition-all duration-fast cursor-pointer
            "
            style={{ width: "clamp(1.5rem,2.5vw,2rem)", height: "clamp(1.5rem,2.5vw,2rem)" }}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;
