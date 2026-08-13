import { getTheme } from "../constants/cardThemes";
import { getStamp } from "../constants/stamps";
import { EM_DIVISOR, STAMP_TOP_EM, STAMP_RIGHT_EM } from "../constants/cardLayout";
import { cardNumber, formatRuntime, starsFromTmdb, describeCard } from "../utils/shareCard";
import CardPoster from "./CardPoster";
import CardRating from "./CardRating";
import CardStamp from "./CardStamp";
import CardFoil from "./CardFoil";
import CardBranding from "./CardBranding";

/**
 * ShareCard — the CinemaScope Collector Card (front face).
 *
 * Single source of truth for the card artwork: the same component is
 *   1. captured by html-to-image for the PNG export,
 *   2. rasterized into the Three.js front-face texture,
 *   3. shown directly as the non-WebGL / reduced-motion preview.
 *
 * Every internal measurement is in `em`, with the root font-size
 * derived from `width` — so the identical layout renders at 320px in
 * the modal and 740px on the export stage.
 *
 * data: { movie: { id, title, year, runtime, genres, tmdbRating, posterSrc },
 *         director, rating, stampId, caption, themeId }
 */
const ShareCard = ({ data, width = 320, showStamp = true, animateStamp = false, className = "", style = {} }) => {
  const theme = getTheme(data.themeId);
  const stamp = showStamp ? getStamp(data.stampId) : null;
  const { movie } = data;

  const displayRating = data.rating ?? starsFromTmdb(movie.tmdbRating);
  const ratingLabel = data.rating ? "My Rating" : "TMDB";
  const cardNo = cardNumber(movie.id);

  const metaLine = [data.director, movie.year, formatRuntime(movie.runtime)]
    .filter(Boolean)
    .join("  ·  ");
  const genreLine = (movie.genres || []).slice(0, 3).join("  /  ");

  const longTitle = (movie.title || "").length > 26;

  const ariaLabel = describeCard({ ...data, stamp });

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{
        width,
        fontSize: width / EM_DIVISOR, // everything below is em-scaled
        aspectRatio: "5 / 7",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "0.8em",
        borderRadius: "0.35em",
        border: `1px solid ${theme.frameColor}`,
        background: theme.cardBg,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header — wordmark + serial */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: '"Epilogue", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: "0.5em",
            letterSpacing: "0.32em",
            color: theme.titleColor,
            textTransform: "uppercase",
          }}
        >
          CinemaScope
        </span>
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.48em",
            letterSpacing: "0.14em",
            color: theme.accent,
          }}
        >
          № {cardNo}
        </span>
      </div>
      <div style={{ height: 1, background: theme.ruleColor, margin: "0.55em 0 0.7em" }} />

      {/* Artwork */}
      <CardPoster src={movie.posterSrc} title={movie.title} theme={theme} />

      {/* Title — parallax layer */}
      <h3
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 700,
          fontSize: longTitle ? "0.95em" : "1.22em",
          lineHeight: 1.08,
          letterSpacing: "-0.01em",
          color: theme.titleColor,
          margin: 0,
          marginTop: "0.7em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          transform:
            "translate3d(calc(var(--plx-x, 0) * 5px), calc(var(--plx-y, 0) * 5px), 0)",
        }}
      >
        {movie.title}
      </h3>

      {/* Meta — director · year · runtime */}
      {metaLine && (
        <p
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.46em",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: theme.textColor,
            margin: 0,
            marginTop: "0.85em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {metaLine}
        </p>
      )}
      {genreLine && (
        <p
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.4em",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: theme.faintColor,
            margin: 0,
            marginTop: "0.5em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {genreLine}
        </p>
      )}

      {/* Rating */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.6em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4em" }}>
          <CardRating value={displayRating} color={theme.accent} trackColor={theme.starTrack} size={0.72} gap={0.16} />
          <span
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.5em",
              color: theme.accent,
            }}
          >
            {displayRating ? displayRating.toFixed(1) : "—"}
          </span>
        </div>
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.38em",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: theme.faintColor,
          }}
        >
          {ratingLabel}
        </span>
      </div>

      {/* Caption */}
      {data.caption && (
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: "italic",
            fontSize: "0.62em",
            lineHeight: 1.35,
            color: theme.textColor,
            margin: 0,
            marginTop: "0.7em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {"“"}{data.caption}{"”"}
        </p>
      )}

      {/* Footer chrome */}
      <CardBranding theme={theme} cardNo={cardNo} />

      {/* Stamp — pressed across the lower artwork, parallax layer.
          Anchored from the card's TOP: the poster's top edge is a fixed
          offset while its bottom edge shifts with the caption, so a
          top-anchored stamp always lands on the artwork — and the 3D
          stamp plane can mirror this position (see three/CardMesh). */}
      {stamp && (
        <CardStamp
          stamp={stamp}
          animate={animateStamp}
          style={{
            right: `${STAMP_RIGHT_EM}em`,
            top: `${STAMP_TOP_EM}em`,
            transform:
              "translate3d(calc(var(--plx-x, 0) * 9px), calc(var(--plx-y, 0) * 9px), 0)",
          }}
        />
      )}

      {/* Foil / light reflection */}
      <CardFoil mode={theme.foil} />
    </div>
  );
};

export default ShareCard;
