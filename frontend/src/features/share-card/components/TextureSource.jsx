import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getFontEmbedCSS } from "../utils/fontEmbed";

/**
 * TextureSource — renders children off-screen and rasterizes the
 * first child into a <canvas> via html-to-image, feeding the 3D
 * card's face textures. Re-captures (debounced) whenever `deps`
 * change, so typing a caption doesn't thrash the rasterizer.
 */
const TextureSource = ({ onCanvas, onError, deps = [], pixelRatio = 2, delay = 280, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        await document.fonts.ready;
        const target = ref.current?.firstElementChild;
        if (!target) return;
        const imgs = Array.from(target.querySelectorAll("img"));
        await Promise.all(
          imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
        );
        const [{ toCanvas }, fontEmbedCSS] = await Promise.all([
          import("html-to-image"),
          getFontEmbedCSS(),
        ]);
        const canvas = await toCanvas(target, { pixelRatio, cacheBust: false, fontEmbedCSS });
        if (!cancelled) onCanvas(canvas);
      } catch (err) {
        if (!cancelled) onError?.(err);
      }
    }, delay);
    return () => { cancelled = true; clearTimeout(t); };
    // Caller controls when to re-capture via the deps array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return createPortal(
    <div
      ref={ref}
      aria-hidden
      style={{ position: "fixed", top: 0, left: "-2400px", pointerEvents: "none" }}
    >
      {children}
    </div>,
    document.body
  );
};

export default TextureSource;
