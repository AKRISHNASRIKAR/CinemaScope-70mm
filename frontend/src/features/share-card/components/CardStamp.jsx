import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * CardStamp — an ink stamp, not a badge.
 *
 * Double rule, heavy letterspaced caps, slight rotation and a speckle
 * wash so it reads as rubber-stamped rather than as a UI chip.
 *
 * Deliberately built from plain borders + text: this component is
 * rasterized by html-to-image (into the 3D face texture and into the
 * exported PNG), and effects that the SVG-foreignObject renderer may
 * drop — CSS `mask-image` above all, which can zero the element's
 * alpha entirely — would make the stamp vanish from the artwork. The
 * grain overlay below is the one optional flourish, and if a renderer
 * ignores it the stamp simply comes out clean rather than missing.
 *
 * Props:
 *   stamp    — entry from constants/stamps.js
 *   animate  — play the "stamp hits paper" motion (HTML preview only)
 *   flat     — unrotated & unpositioned, for capturing the 3D texture
 *              (rotation is applied to the plane in the scene)
 */

const SPECKLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='60' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

const StampBody = ({ stamp }) => (
  <div
    style={{
      position: "relative",
      border: `0.085em solid ${stamp.ink}`,
      borderRadius: "0.2em",
      padding: "0.1em",
      opacity: 0.9,
    }}
  >
    <div
      style={{
        border: `0.03em solid ${stamp.ink}`,
        borderRadius: "0.12em",
        padding: "0.3em 0.58em 0.26em",
      }}
    >
      <span
        style={{
          fontFamily: '"Epilogue", system-ui, sans-serif',
          fontWeight: 800,
          fontSize: "0.6em",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: stamp.ink,
          whiteSpace: "nowrap",
          display: "block",
          lineHeight: 1,
        }}
      >
        {stamp.label}
      </span>
    </div>

    {/* Ink speckle — purely additive; absent renderers just get clean ink */}
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "0.2em",
        backgroundImage: SPECKLE,
        backgroundSize: "cover",
        mixBlendMode: "overlay",
        opacity: 0.28,
        pointerEvents: "none",
      }}
    />
  </div>
);

const CardStamp = ({ stamp, animate = false, flat = false, style = {} }) => {
  const reduced = useReducedMotion();
  if (!stamp) return null;

  if (flat) {
    return (
      <div style={{ display: "inline-block", ...style }} aria-hidden>
        <StampBody stamp={stamp} />
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", pointerEvents: "none", ...style }} aria-hidden>
      {animate && !reduced ? (
        <motion.div
          key={stamp.id}
          initial={{ opacity: 0, scale: 1.6, rotate: stamp.rotate - 9 }}
          animate={{
            opacity: [0, 1, 1],
            scale: [1.6, 0.94, 1],
            rotate: [stamp.rotate - 9, stamp.rotate + 1, stamp.rotate],
          }}
          transition={{ duration: 0.42, times: [0, 0.62, 1], ease: "easeOut" }}
        >
          <StampBody stamp={stamp} />
        </motion.div>
      ) : (
        <div style={{ transform: `rotate(${stamp.rotate}deg)` }}>
          <StampBody stamp={stamp} />
        </div>
      )}
    </div>
  );
};

export default CardStamp;
