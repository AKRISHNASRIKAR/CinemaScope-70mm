/**
 * ScrollRow — generic horizontal scroll container with keyboard-accessible
 * prev/next arrow buttons.
 *
 * Replaces the duplicated scroll logic in:
 *   - HeroCarousel (Now Showing strip)
 *   - FilmographyRow in Person.jsx
 *
 * Props:
 *   label        — optional section label rendered above the strip
 *   showArrows   — show prev/next buttons (default: true when items > 5)
 *   scrollAmount — px to scroll per arrow click (default: 300)
 *   gap          — CSS gap value (default: "clamp(0.75rem,1.5vw,1.25rem)")
 *   className    — extra classes on the outer wrapper
 *   children     — the items to render inside the scroll strip
 *
 * Keyboard:
 *   When the strip is focused, ArrowLeft / ArrowRight scroll it.
 *   Tab moves focus into individual items naturally.
 */

import { useRef, useCallback } from "react";
import ChevronLeftIcon  from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const ScrollRow = ({
  label,
  showArrows = true,
  scrollAmount = 300,
  gap = "clamp(0.75rem, 1.5vw, 1.25rem)",
  className = "",
  arrowSize = "clamp(1.75rem, 3vw, 2.5rem)",
  children,
}) => {
  const stripRef = useRef(null);

  const scrollBy = useCallback((dir) => {
    stripRef.current?.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
  }, [scrollAmount]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowLeft")  { e.preventDefault(); scrollBy(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); scrollBy(1);  }
  }, [scrollBy]);

  return (
    <div className={`flex flex-col ${className}`} style={{ gap: "clamp(0.5rem,1vh,0.75rem)" }}>
      {label && (
        <span
          className="font-mono tracking-[0.22em] text-white/40 uppercase"
          style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}
        >
          {label}
        </span>
      )}

      <div className="relative flex items-center group/row">
        {/* Prev arrow */}
        {showArrows && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="
              hidden sm:flex flex-shrink-0
              items-center justify-center rounded-full
              bg-white/5 hover:bg-white/10
              border border-white/10
              text-white/50 hover:text-white
              opacity-0 group-hover/row:opacity-100
              transition-all duration-fast cursor-pointer
              absolute left-0 z-10 -translate-x-1/2
            "
            style={{ width: arrowSize, height: arrowSize }}
          >
            <ChevronLeftIcon sx={{ fontSize: "clamp(0.9rem,1.5vw,1.2rem)" }} />
          </button>
        )}

        {/* Scrollable strip */}
        <div
          ref={stripRef}
          role="region"
          aria-label={label ?? "Scroll row"}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="flex overflow-x-auto scrollbar-hide pb-2 outline-none focus-visible:ring-1 focus-visible:ring-gold/40 rounded"
          style={{
            gap,
            scrollBehavior: "smooth",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>

        {/* Next arrow */}
        {showArrows && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="
              hidden sm:flex flex-shrink-0
              items-center justify-center rounded-full
              bg-white/5 hover:bg-white/10
              border border-white/10
              text-white/50 hover:text-white
              opacity-0 group-hover/row:opacity-100
              transition-all duration-fast cursor-pointer
              absolute right-0 z-10 translate-x-1/2
            "
            style={{ width: arrowSize, height: arrowSize }}
          >
            <ChevronRightIcon sx={{ fontSize: "clamp(0.9rem,1.5vw,1.2rem)" }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ScrollRow;
