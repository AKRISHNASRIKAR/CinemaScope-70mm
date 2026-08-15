import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ShareCard from "./ShareCard";

/**
 * ExportStage — the deterministic HTML composition that becomes the
 * shared PNG. Never derived from the WebGL canvas.
 *
 * Mounted off-screen only while an export is running. Lays out at
 * final pixel size (1080×1080 or 1080×1920) so html-to-image can
 * capture at pixelRatio 1 with no scaling artifacts.
 *
 * Calls `onReady(node)` once fonts and every image have decoded.
 */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

const ExportStage = ({ data, format = "square", backdropSrc, onReady, onError }) => {
  const nodeRef = useRef(null);
  const story = format === "story";
  const W = 1080;
  const H = story ? 1920 : 1080;
  const cardWidth = story ? 740 : 620;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await document.fonts.ready;
        const node = nodeRef.current;
        if (!node) return;
        const imgs = Array.from(node.querySelectorAll("img"));
        await Promise.all(
          imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
        );
        // Two frames so layout + decode are definitely painted. rAF never
        // fires in a hidden/occluded tab, so race it against a timer —
        // otherwise an export started in a background tab hangs forever.
        await Promise.race([
          new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
          new Promise((r) => setTimeout(r, 120)),
        ]);
        if (!cancelled) onReady(node);
      } catch (err) {
        if (!cancelled) onError?.(err);
      }
    })();
    return () => { cancelled = true; };
    // Stage mounts fresh per export request — run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      aria-hidden
      style={{ position: "fixed", top: 0, left: "-2400px", pointerEvents: "none" }}
    >
      <div
        ref={nodeRef}
        style={{
          width: W,
          height: H,
          position: "relative",
          overflow: "hidden",
          background: "#090909",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Cinematic bed — blurred backdrop when available */}
        {backdropSrc && (
          <img
            src={backdropSrc}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(46px) saturate(1.25) brightness(0.8)",
              transform: "scale(1.25)",
              opacity: 0.55,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(9,9,9,0.55), rgba(9,9,9,0.25) 45%, rgba(9,9,9,0.75))",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(9,9,9,0.8))",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: GRAIN,
            backgroundSize: "180px 180px",
            opacity: 0.05,
          }}
        />

        {/* Story format carries extra CinemaScope framing */}
        {story && (
          <p
            style={{
              position: "absolute",
              top: 110,
              left: 0,
              right: 0,
              textAlign: "center",
              margin: 0,
              fontFamily: '"Epilogue", system-ui, sans-serif',
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: "0.5em",
              textIndent: "0.5em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            CinemaScope
          </p>
        )}

        <div style={{ position: "relative", boxShadow: "0 48px 140px rgba(0,0,0,0.75)", borderRadius: cardWidth / 20 * 0.35 }}>
          <ShareCard data={data} width={cardWidth} showStamp animateStamp={false} />
        </div>

        {story && (
          <p
            style={{
              position: "absolute",
              bottom: 120,
              left: 0,
              right: 0,
              textAlign: "center",
              margin: 0,
              fontFamily: '"DM Mono", monospace',
              fontSize: 19,
              letterSpacing: "0.42em",
              textIndent: "0.42em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Collector Card
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ExportStage;
