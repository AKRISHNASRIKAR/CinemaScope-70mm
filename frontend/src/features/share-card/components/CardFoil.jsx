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
    </>
  );
};

export default CardFoil;
