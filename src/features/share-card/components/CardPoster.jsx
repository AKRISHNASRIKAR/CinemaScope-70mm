/**
 * CardPoster — framed artwork window of the collector card.
 * Fills whatever flex space the card gives it. Parallax shift is
 * driven by the --plx-x / --plx-y vars set by useCardTilt (0 when
 * static/exported). Missing posters get a typographic fallback
 * instead of a broken-image icon.
 */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

const CardPoster = ({ src, title, theme }) => (
  <div
    style={{
      flex: "1 1 0%",
      minHeight: 0,
      position: "relative",
      borderRadius: "0.22em",
      border: `1px solid ${theme.frameColor}`,
      overflow: "hidden",
      background: "#0a0a0a",
    }}
  >
    {src ? (
      <img
        src={src}
        alt=""
        // Keeps the request CORS-clean if a remote URL is ever captured
        // directly (before toDataURL resolves) — see utils/toDataURL.
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: theme.posterFilter,
          // Slight over-scale hides edges revealed by parallax drift
          transform:
            "translate3d(calc(var(--plx-x, 0) * 10px), calc(var(--plx-y, 0) * 10px), 0) scale(1.05)",
        }}
      />
    ) : (
      /* Typographic fallback — no broken-image iconography on a collectible */
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4em",
          background: "linear-gradient(160deg, #161616, #0b0b0b)",
        }}
      >
        <span
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: "3.4em",
            lineHeight: 1,
            color: theme.frameColor,
          }}
        >
          {(title || "C").trim().charAt(0).toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.4em",
            letterSpacing: "0.35em",
            color: theme.faintColor,
            textTransform: "uppercase",
          }}
        >
          No artwork
        </span>
      </div>
    )}

    {/* Film grain over the artwork */}
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: GRAIN,
        backgroundSize: "140px 140px",
        opacity: theme.grainOpacity,
        pointerEvents: "none",
      }}
    />
    {/* Inner vignette to seat the artwork in its frame */}
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: "inset 0 0 2.4em rgba(0,0,0,0.55)",
        pointerEvents: "none",
      }}
    />
  </div>
);

export default CardPoster;
