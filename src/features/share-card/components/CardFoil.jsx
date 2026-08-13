/**
 * CardFoil — lightweight foil/light reflection layers.
 * Pure CSS gradients; position is driven by the --foil-x / --foil-y
 * custom properties set by useCardTilt (defaults give a pleasant
 * static sheen for the PNG export and untracked states).
 *
 * mode: "none" | "soft" | "spectral"
 */
const CardFoil = ({ mode = "none" }) => {
  if (mode === "none") return null;

  return (
    <>
      {/* Soft moving highlight */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background:
            "radial-gradient(circle at var(--foil-x, 62%) var(--foil-y, 26%), rgba(255,255,255,0.13), rgba(255,255,255,0) 55%)",
        }}
      />
      {/* Spectral sweep — holographic theme only */}
      {mode === "spectral" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: 0.55,
            mixBlendMode: "screen",
            background:
              "linear-gradient(115deg, transparent 18%, rgba(201,168,67,0.16) 32%, rgba(110,160,255,0.13) 46%, rgba(240,120,200,0.11) 58%, rgba(120,255,214,0.09) 68%, transparent 82%)",
            backgroundSize: "220% 220%",
            backgroundPosition: "var(--foil-x, 50%) var(--foil-y, 50%)",
          }}
        />
      )}
    </>
  );
};

export default CardFoil;
