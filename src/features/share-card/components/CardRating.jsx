/**
 * CardRating — half-star-precision star row, sized in `em` so it
 * scales with whatever typography context it sits in (card or modal).
 * Renders a muted track row with a clipped filled row above it —
 * exact half-stars, no font glyph hacks, crisp in PNG export.
 */

const STAR_PATH =
  "M12 2.6l2.94 5.95 6.57.96-4.75 4.63 1.12 6.54L12 17.6l-5.88 3.08 1.12-6.54L2.49 9.51l6.57-.96z";

const StarRow = ({ color, size, gap }) => (
  <div style={{ display: "flex", gap: `${gap}em`, lineHeight: 0 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        style={{ width: `${size}em`, height: `${size}em`, display: "block", flex: "none" }}
        aria-hidden
      >
        <path d={STAR_PATH} fill={color} />
      </svg>
    ))}
  </div>
);

const CardRating = ({ value = 0, color = "#c9a843", trackColor = "rgba(255,255,255,0.14)", size = 0.8, gap = 0.18 }) => {
  const v = Math.max(0, Math.min(5, value));
  // Gaps make a plain percentage clip drift off half-star boundaries —
  // compute the clip width in em instead.
  const widthEm = Math.floor(v) * (size + gap) + (v % 1) * size;

  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }} aria-hidden>
      <StarRow color={trackColor} size={size} gap={gap} />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${widthEm}em` }}>
        <StarRow color={color} size={size} gap={gap} />
      </div>
    </div>
  );
};

export default CardRating;
