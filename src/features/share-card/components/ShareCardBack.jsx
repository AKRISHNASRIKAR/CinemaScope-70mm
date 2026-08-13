import { getTheme } from "../constants/cardThemes";
import { cardNumber, formatRuntime, starsFromTmdb } from "../utils/shareCard";
import CardRating from "./CardRating";
import CardFoil from "./CardFoil";

/**
 * ShareCardBack — reverse face of the Collector Card.
 * Quiet, typographic: wordmark, serial, a specimen-style metadata
 * table and the rating. Rasterized into the 3D back-face texture.
 */
const Row = ({ label, value, theme }) =>
  value ? (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "1em",
        padding: "0.5em 0",
        borderBottom: `1px solid ${theme.ruleColor}`,
      }}
    >
      <span
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.4em",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: theme.faintColor,
          flex: "none",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.44em",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: theme.textColor,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  ) : null;

const ShareCardBack = ({ data, width = 320, className = "", style = {} }) => {
  const theme = getTheme(data.themeId);
  const { movie } = data;
  const displayRating = data.rating ?? starsFromTmdb(movie.tmdbRating);

  return (
    <div
      role="img"
      aria-label={`Back of CinemaScope collector card for ${movie.title}`}
      className={className}
      style={{
        width,
        fontSize: width / 20,
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
      {/* Inner hairline frame */}
      <div
        style={{
          position: "absolute",
          inset: "0.55em",
          border: `1px solid ${theme.ruleColor}`,
          borderRadius: "0.22em",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1.4em",
        }}
      >
        <span
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: "2.6em",
            lineHeight: 1,
            color: theme.frameColor,
          }}
        >
          C
        </span>
        <span
          style={{
            fontFamily: '"Epilogue", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: "0.52em",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: theme.titleColor,
            marginTop: "1.2em",
          }}
        >
          CinemaScope
        </span>
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.4em",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: theme.accent,
            marginTop: "1em",
          }}
        >
          Collector Card · № {cardNumber(movie.id)}
        </span>

        {/* Specimen table */}
        <div style={{ width: "100%", marginTop: "1.6em", borderTop: `1px solid ${theme.ruleColor}` }}>
          <Row label="Title" value={movie.title} theme={theme} />
          <Row label="Directed by" value={data.director} theme={theme} />
          <Row label="Year" value={movie.year} theme={theme} />
          <Row label="Runtime" value={formatRuntime(movie.runtime)} theme={theme} />
          <Row label="Genre" value={(movie.genres || []).slice(0, 2).join(" / ")} theme={theme} />
        </div>

        <div style={{ marginTop: "1.4em" }}>
          <CardRating value={displayRating} color={theme.accent} trackColor={theme.starTrack} size={0.66} gap={0.15} />
        </div>
      </div>

      <p
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.36em",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: theme.faintColor,
          textAlign: "center",
          margin: 0,
          marginBottom: "0.8em",
        }}
      >
        First Edition · V1
      </p>

      <CardFoil mode={theme.foil} />
    </div>
  );
};

export default ShareCardBack;
