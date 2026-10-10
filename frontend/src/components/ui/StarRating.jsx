import { useState } from "react";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarHalfRoundedIcon from "@mui/icons-material/StarHalfRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";

const STARS = [1, 2, 3, 4, 5];
const MAX = 10;

/**
 * StarRating — five stars with half-star precision.
 *
 * Props:
 *   value    — current rating in half-star units (1-10), or null when unrated
 *   onChange — called with the new value (1-10)
 *   disabled — blocks input while a save is in flight
 *   label    — accessible name for the slider
 */
const StarRating = ({ value = null, onChange, disabled = false, label = "Rating" }) => {
  const [hover, setHover] = useState(null);
  const shown = hover ?? value ?? 0;

  // Left half of a star is the half step, right half the full star.
  const valueAt = (event, star) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    return event.clientX - left < width / 2 ? star * 2 - 1 : star * 2;
  };

  const commit = (next) => {
    if (disabled || next === value) return;
    onChange?.(next);
  };

  const handleKeyDown = (event) => {
    const current = value ?? 0;
    const next = {
      ArrowRight: Math.min(MAX, current + 1),
      ArrowUp: Math.min(MAX, current + 1),
      ArrowLeft: Math.max(1, current - 1),
      ArrowDown: Math.max(1, current - 1),
      Home: 1,
      End: MAX,
    }[event.key];

    if (next === undefined) return;
    event.preventDefault();
    commit(next);
  };

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value ? value / 2 : undefined}
      aria-valuetext={value ? `${value / 2} out of 5 stars` : "Not rated"}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(null)}
      className={`inline-flex items-center rounded-card focus-ring ${disabled ? "opacity-60" : ""}`}
    >
      {STARS.map((star) => {
        const Icon =
          shown >= star * 2 ? StarRoundedIcon : shown === star * 2 - 1 ? StarHalfRoundedIcon : StarOutlineRoundedIcon;
        const filled = shown >= star * 2 - 1;

        return (
          <span
            key={star}
            aria-hidden
            onMouseMove={(event) => !disabled && setHover(valueAt(event, star))}
            onClick={(event) => commit(valueAt(event, star))}
            className={`flex transition-colors duration-fast ${disabled ? "cursor-wait" : "cursor-pointer"} ${
              filled ? "text-gold" : "text-white/25"
            }`}
          >
            <Icon sx={{ fontSize: "clamp(1.7rem, 2.3vw, 2.05rem)" }} />
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
