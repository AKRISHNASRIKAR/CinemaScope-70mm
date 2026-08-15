import { useCallback, useRef, useState } from "react";

/**
 * useCardTilt — pointer-driven 3D tilt + foil tracking for the
 * HTML/CSS card (the non-WebGL fallback preview).
 *
 * Returns handlers to spread on the card wrapper and a style object:
 *   - perspective tilt (rotateX/rotateY, ±maxTilt°)
 *   - CSS vars consumed by the card layers:
 *       --foil-x / --foil-y   → foil highlight position (%)
 *       --plx-x / --plx-y     → parallax direction (-1 … 1)
 *
 * Pass `disabled` for touch devices / prefers-reduced-motion — the
 * style collapses to a static, untransformed card.
 */
export function useCardTilt({ maxTilt = 6, disabled = false } = {}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, fx: 50, fy: 40, active: false });
  const frame = useRef(null);

  const onPointerMove = useCallback(
    (e) => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;  // 0 … 1
      const y = (e.clientY - rect.top) / rect.height;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setTilt({
          rx: (0.5 - y) * maxTilt * 2,
          ry: (x - 0.5) * maxTilt * 2,
          fx: x * 100,
          fy: y * 100,
          active: true,
        });
      });
    },
    [disabled, maxTilt]
  );

  const onPointerLeave = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    setTilt({ rx: 0, ry: 0, fx: 50, fy: 40, active: false });
  }, []);

  const style = disabled
    ? {}
    : {
        transform: `perspective(900px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
        transition: tilt.active
          ? "transform 60ms linear"
          : "transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        willChange: "transform",
        "--foil-x": `${tilt.fx.toFixed(1)}%`,
        "--foil-y": `${tilt.fy.toFixed(1)}%`,
        "--plx-x": (tilt.ry / maxTilt).toFixed(3),
        "--plx-y": (-tilt.rx / maxTilt).toFixed(3),
      };

  return {
    tiltHandlers: disabled ? {} : { onPointerMove, onPointerLeave },
    tiltStyle: style,
  };
}
