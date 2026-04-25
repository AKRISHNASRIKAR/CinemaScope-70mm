import { useState, useCallback } from "react";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

/**
 * LazyImage — drop-in <img> replacement with:
 *   - Shimmer skeleton while loading
 *   - onError fallback (film icon or person icon)
 *   - loading="lazy" by default (override with eager)
 *   - No layout shift — reserves space via parent's aspect-ratio
 *
 * Props:
 *   src          — image URL
 *   alt          — alt text
 *   className    — applied to the <img> element
 *   style        — applied to the <img> element
 *   fallbackType — "poster" | "person" | "backdrop"  (default "poster")
 *   eager        — set true for above-fold / priority images
 *   fetchPriority— "high" | "low" | "auto" (default "auto")
 *   onLoad       — optional callback after load
 */
const LazyImage = ({
  src,
  alt = "",
  className = "",
  style = {},
  fallbackType = "poster",
  eager = false,
  fetchPriority = "auto",
  onLoad,
  ...rest
}) => {
  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setErrored(true);
    setLoaded(true); // hide skeleton
  }, []);

  // Decide fallback icon
  const FallbackIcon = fallbackType === "person" ? PersonOutlineIcon : BrokenImageIcon;

  return (
    <div className="relative w-full h-full">
      {/* Shimmer while loading */}
      {!loaded && (
        <div
          className="skeleton absolute inset-0 rounded-[inherit]"
          aria-hidden
        />
      )}

      {/* Error fallback */}
      {errored && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-surface rounded-[inherit]"
          aria-hidden
        >
          <FallbackIcon
            sx={{ fontSize: "clamp(1.5rem,3vw,2.5rem)", color: "rgba(255,255,255,0.12)" }}
          />
        </div>
      )}

      {/* Actual image — hidden until loaded */}
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={fetchPriority}
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          style={{
            ...style,
            opacity: loaded ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
          {...rest}
        />
      )}
    </div>
  );
};

export default LazyImage;
