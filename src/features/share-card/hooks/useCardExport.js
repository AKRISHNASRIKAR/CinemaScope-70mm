import { useCallback, useRef, useState } from "react";
import { getFontEmbedCSS } from "../utils/fontEmbed";

const EXPORT_TIMEOUT_MS = 45000;

/**
 * useCardExport — orchestrates deterministic HTML→PNG export.
 *
 * The export never screenshots the WebGL preview. Instead the caller
 * mounts an off-screen <ExportStage> (a 1080×1080 or 1080×1920 HTML
 * composition) while `stageRequest` is set, and wires its `onReady`
 * to `handleStageReady`. The stage is only in the DOM for the few
 * hundred ms the capture takes.
 *
 *   const { exportCard, exporting, error, stageRequest, handleStageReady, handleStageError } = useCardExport();
 *   const blob = await exportCard("square");
 */
export function useCardExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [stageRequest, setStageRequest] = useState(null);
  const resolver = useRef(null);

  const exportCard = useCallback((format) => {
    setError(null);
    setExporting(true);
    const capture = new Promise((resolve, reject) => {
      resolver.current = { resolve, reject };
      // key forces a fresh stage mount per export
      setStageRequest({ format, key: Date.now() });
    });
    // Rasterizing 1080×1920 can stall outright — a backgrounded tab never
    // paints the off-screen stage. Without this the button would sit on
    // "Preparing…" forever with no way back.
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Export timed out")), EXPORT_TIMEOUT_MS);
    });
    return Promise.race([capture, timeout])
      .catch((err) => {
        setError("Couldn't generate the card image. Please try again.");
        throw err;
      })
      .finally(() => {
        clearTimeout(timer);
        resolver.current = null;
        setExporting(false);
        setStageRequest(null);
      });
  }, []);

  const handleStageReady = useCallback(async (node) => {
    try {
      const [{ toBlob }, fontEmbedCSS] = await Promise.all([
        import("html-to-image"),
        getFontEmbedCSS(),
      ]);
      // Stage is laid out at final pixel size — pixelRatio 1 gives an
      // exact 1080-wide PNG without re-rasterizing at 2× cost.
      const blob = await toBlob(node, { pixelRatio: 1, cacheBust: false, fontEmbedCSS });
      if (!blob) throw new Error("Export produced an empty image");
      resolver.current?.resolve(blob);
    } catch (err) {
      setError("Couldn't generate the card image. Please try again.");
      resolver.current?.reject(err);
    } finally {
      resolver.current = null;
    }
  }, []);

  const handleStageError = useCallback((err) => {
    setError("Couldn't generate the card image. Please try again.");
    resolver.current?.reject(err);
    resolver.current = null;
  }, []);

  return { exportCard, exporting, error, stageRequest, handleStageReady, handleStageError };
}
